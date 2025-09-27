'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type PayloadMethod = 'get' | 'post' | 'put' | 'delete';

interface PayloadAPIOptions {
  path: string;
  method?: PayloadMethod;
  data?: any;
  params?: Record<string, string>;
  refreshOnSuccess?: boolean;
  cacheTime?: number; // New option for cache duration in ms
}

interface UsePayloadAPIResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (options?: Partial<PayloadAPIOptions>) => Promise<T | null>;
}

// Simple cache implementation
const apiCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Hook for interacting with the Payload CMS API
 */
export function usePayloadAPI<T = any>(defaultOptions?: PayloadAPIOptions): UsePayloadAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for aborting pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback(
    async (options?: Partial<PayloadAPIOptions>): Promise<T | null> => {
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        cacheTime: options?.cacheTime ?? defaultOptions?.cacheTime ?? 60000, // Default 1 minute cache
      };

      const {
        path,
        method = 'get',
        params = {},
        data: requestData,
        cacheTime,
        refreshOnSuccess = false,
      } = mergedOptions;

      if (!path) {
        throw new Error('Path is required');
      }

      // Generate cache key based on path, method, params, and requestData
      const cacheKey = `${method}:${path}:${JSON.stringify(params)}:${
        requestData ? JSON.stringify(requestData) : ''
      }`;

      // Check cache for GET requests
      if (method === 'get' && cacheTime && cacheTime > 0) {
        const cachedData = apiCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < cacheTime) {
          // Use cached data if it exists and is not expired
          setData(cachedData.data);
          setLoading(false);
          setError(null);
          return cachedData.data;
        }
      }

      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Track request start time for performance monitoring
      const startTime = Date.now();

      try {
        // Build URL with query parameters
        const searchParams = new URLSearchParams({ path, ...params });
        const url = `/api/payload?${searchParams.toString()}`;

        // Configure request options
        const requestOptions: RequestInit = {
          method: method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        };

        // Add body for non-GET requests
        if (method !== 'get' && requestData) {
          requestOptions.body = JSON.stringify(requestData);
        }

        // Execute request
        const response = await fetch(url, requestOptions);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'An error occurred');
        }

        // Parse response
        const result = await response.json();
        setData(result);

        // Cache GET responses
        if (method === 'get' && cacheTime && cacheTime > 0) {
          apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
        }

        // Refresh page if requested
        if (refreshOnSuccess) {
          router.refresh();
        }

        // Log request time for performance monitoring
        if (process.env.NODE_ENV === 'development') {
          console.log(`API request to ${path} took ${Date.now() - startTime}ms`);
        }

        return result;
      } catch (err: any) {
        // Don't set error state if the request was aborted
        if (err.name === 'AbortError') {
          return null;
        }

        const error = err instanceof Error ? err : new Error(err?.message || 'Unknown error');
        setError(error);

        // For GET requests, set an empty result instead of null to prevent UI flickering
        if (method === 'get') {
          const emptyResult = { docs: [] } as unknown as T;
          setData(emptyResult);
          return emptyResult;
        }

        return null;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [defaultOptions, router]
  );

  const debouncedExecute = useCallback(
    async (options?: Partial<PayloadAPIOptions>): Promise<T | null> => {
      const now = Date.now();
      if (now - lastRequestTimeRef.current < 500) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          lastRequestTimeRef.current = now;
          execute(options);
        }, 500);
        return null;
      }
      lastRequestTimeRef.current = now;
      return execute(options);
    },
    [execute]
  );

  return { data, error, loading, execute: debouncedExecute };
}

/**
 * Specialized hook for fetching apps from the marketplace
 */
export function useApps(params?: Record<string, string>) {
  return usePayloadAPI({
    path: '/api/apps',
    params,
  });
}

/**
 * Specialized hook for fetching a single app by ID
 */
export function useApp(id?: string) {
  return usePayloadAPI({
    path: id ? `/api/apps/${id}` : '',
  });
}

/**
 * Specialized hook for creating a new app
 */
export function useCreateApp() {
  return usePayloadAPI({
    path: '/api/apps',
    method: 'post',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for updating an app
 */
export function useUpdateApp(id?: string) {
  return usePayloadAPI({
    path: id ? `/api/apps/${id}` : '',
    method: 'put',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for deleting an app
 */
export function useDeleteApp() {
  return usePayloadAPI({
    path: '/api/apps',
    method: 'delete',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for processing a purchase
 */
export function usePurchase() {
  return usePayloadAPI({
    path: '/api/purchases',
    method: 'post',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for fetching user purchases
 */
export function useUserPurchases(userId?: string) {
  return usePayloadAPI({
    path: userId ? `/api/purchases?tester=${userId}` : '/api/purchases',
  });
}

/**
 * Specialized hook for fetching developer sales
 */
export function useDeveloperSales(developerId?: string) {
  return usePayloadAPI({
    path: developerId ? `/api/purchases?developer=${developerId}` : '/api/purchases',
  });
}

/**
 * Specialized hook for fetching bugs
 */
export function useBugs(params?: Record<string, string>) {
  return usePayloadAPI({
    path: '/api/bugs',
    params,
  });
}

/**
 * Specialized hook for fetching a single bug by ID
 */
export function useBug(id?: string) {
  return usePayloadAPI({
    path: id ? `/api/bugs/${id}` : '',
  });
}

/**
 * Specialized hook for creating a new bug report
 */
export function useCreateBug() {
  return usePayloadAPI({
    path: '/api/bugs',
    method: 'post',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for updating a bug report
 */
export function useUpdateBug(id?: string) {
  return usePayloadAPI({
    path: id ? `/api/bugs/${id}` : '',
    method: 'put',
    refreshOnSuccess: true,
  });
}

/**
 * Specialized hook for fetching user's reported bugs
 */
export function useUserBugs(userId?: string) {
  return usePayloadAPI({
    path: '/api/bugs',
    params: userId ? { reportedBy: userId } : undefined,
  });
}
