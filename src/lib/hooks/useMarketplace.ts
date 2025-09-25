'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { mockApps } from '../mock-data';

export function useMarketplace() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [apps, setApps] = useState(mockApps);
  const [filteredApps, setFilteredApps] = useState(mockApps);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to filter apps based on current filters
  const filterApps = useCallback(() => {
setIsLoading(true);

try {
  // Simulate API delay
  setTimeout(() => {
    let results = [...apps];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(
        app => 
          app.name.toLowerCase().includes(searchTerm) || 
          app.description.toLowerCase().includes(searchTerm) ||
          app.developer.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      results = results.filter(app => app.category === filters.category);
    }
    
    // Apply platform filter
    if (filters.platform && filters.platform !== 'all') {
      results = results.filter(app => app.type === filters.platform);
    }
    
    // Apply price range filter
    if (filters.minPrice) {
      results = results.filter(app => app.price >= Number(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      results = results.filter(app => app.price <= Number(filters.maxPrice));
    }
    
    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'rating_desc':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'popular':
          results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
          break;
        case 'newest':
        default:
          // Sort by release date (newest first)
          results.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
          break;
      }
    }
    
    setFilteredApps(results);
    setIsLoading(false);
  }, 500); // Simulate network delay
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred while filtering apps'));
      setIsLoading(false);
    }
  }, [apps, filters]);

  // Apply filters whenever they change
  useEffect(() => {
    filterApps();
  }, [filterApps]);

  // Function to update filters
  const updateFilters = useCallback(
async (newFilters: Record<string, string>) => {
  const updatedFilters = { ...filters, ...newFilters };
  
  // Remove any filters with empty values
  Object.keys(updatedFilters).forEach((key) => {
    if (!updatedFilters[key]) {
      delete updatedFilters[key];
    }
      });
      
      setFilters(updatedFilters);
      return null;
    },
    [filters]
  );

  // Function to reset filters
  const resetFilters = useCallback(async () => {
    setFilters({});
    return null;
  }, []);

  // Function to purchase an app
  const purchaseApp = useCallback(
    async (appId: string) => {
      if (!user) {
        throw new Error('You must be logged in to purchase an app');
      }

      if (user.role !== 'tester') {
        throw new Error('Only testers can purchase apps');
      }

      // Simulate purchase
      return { success: true, message: 'Purchase successful' };
    },
    [user]
  );

  // Function to check if user has purchased an app
  const hasUserPurchasedApp = useCallback(
    (appId: string) => {
      if (!user || !user.purchasedApps) {
        return false;
      }

      return user.purchasedApps?.includes(appId);
    },
    [user]
  );

  return {
    apps: filteredApps,
    totalApps: mockApps.length,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    purchaseApp,
    isPurchasing: false,
    purchaseError: null,
    hasUserPurchasedApp,
  };
}

export function useAppDetail(appId?: string) {
  const { user } = useAuth();
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch app data when appId changes
  useEffect(() => {
    if (appId) {
      setIsLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const foundApp = mockApps.find(app => app.id === appId);
        
        if (foundApp) {
          setApp(foundApp);
        } else {
          setError(new Error('App not found'));
        }
        
        setIsLoading(false);
      }, 500);
    }
  }, [appId]);

  // Function to purchase the app
  const purchaseApp = useCallback(async () => {
    if (!appId) {
      throw new Error('App ID is required');
    }

    if (!user) {
      throw new Error('You must be logged in to purchase an app');
    }

    if (user.role !== 'tester') {
      throw new Error('Only testers can purchase apps');
    }

    // Simulate purchase
    return { success: true, message: 'Purchase successful' };
  }, [appId, user]);

  // Function to check if user has purchased the app
  const hasUserPurchasedApp = useCallback(() => {
    if (!user || !user.purchasedApps || !appId) {
      return false;
    }

    return user.purchasedApps.includes(appId);
  }, [user, appId]);

  // Function to refresh app data
  const refreshApp = useCallback(() => {
    if (appId) {
      setIsLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const foundApp = mockApps.find(app => app.id === appId);
        
        if (foundApp) {
          setApp(foundApp);
        } else {
          setError(new Error('App not found'));
        }
        
        setIsLoading(false);
      }, 300);
    }
  }, [appId]);

  return {
    app,
    isLoading,
    error,
    purchaseApp,
    isPurchasing: false,
    purchaseError: null,
    hasUserPurchasedApp: hasUserPurchasedApp(),
    refreshApp,
  };
}
