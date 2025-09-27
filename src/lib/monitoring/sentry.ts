import * as Sentry from '@sentry/nextjs';
import React from 'react';
// import { User } from '@sentry/types';

// Initialize Sentry
export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Filter out network errors that are not actionable
        if (error.message.includes('Network request failed')) {
          return null;
        }
        
        // Filter out cancelled requests
        if (error.message.includes('AbortError')) {
          return null;
        }
        
        // Filter out development-only errors
        if (process.env.NODE_ENV === 'development' && 
            error.message.includes('HMR')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional configuration
    integrations: [
      // new Sentry.Integrations.Http({ tracing: true }),
      // new Sentry.Replay({
      //   maskAllText: true,
      //   blockAllMedia: true,
      // }),
    ],
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Custom tags
    initialScope: {
      tags: {
        component: 'web-app',
        platform: 'nextjs',
      },
    },
  });
}

// Set user context
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  } as any);
}

// Clear user context
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Add breadcrumb
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' | 'debug' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Capture exception with context
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: any;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context?.user) {
      scope.setUser(context.user);
    }
    
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    Sentry.captureException(error);
  });
}

// Capture message
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return (Sentry as any).startTransaction({
    name,
    op,
  });
}

// Custom performance monitoring for API calls
export async function monitorApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const transaction = startTransaction(`api.${name}`, 'http.client');
  
  try {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }
    
    const result = await apiCall();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, {
      tags: { api_call: name },
      extra: context,
    });
    throw error;
  } finally {
    transaction.finish();
  }
}

// Monitor database operations
export async function monitorDatabaseOperation<T>(
  operation: string,
  query: string,
  dbCall: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(`db.${operation}`, 'db.query');
  
  try {
    transaction.setTag('db.operation', operation);
    transaction.setData('db.query', query);
    
    const result = await dbCall();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, {
      tags: { 
        db_operation: operation,
        db_query: query.substring(0, 100) + '...',
      },
    });
    throw error;
  } finally {
    transaction.finish();
  }
}

// Monitor React component performance
export function withSentryProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
) {
  return Sentry.withProfiler(Component, { name });
}

// Error boundary for React components
export class SentryErrorBoundary extends Sentry.ErrorBoundary {
  constructor(props: any) {
    super(props);
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    captureException(error, {
      tags: { component: 'error_boundary' },
      extra: errorInfo,
    });
  }
}

// Custom hooks for monitoring
export function useSentryTransaction(name: string, op: string) {
  const transaction = React.useRef<any>(null);
  
  React.useEffect(() => {
    transaction.current = startTransaction(name, op);
    
    return () => {
      if (transaction.current) {
        transaction.current.finish();
      }
    };
  }, [name, op]);
  
  return transaction.current;
}

// Monitoring utilities
export const monitoring = {
  // Track user actions
  trackUserAction: (action: string, properties?: Record<string, any>) => {
    addBreadcrumb(
      `User action: ${action}`,
      'user',
      'info',
      properties
    );
  },
  
  // Track page views
  trackPageView: (page: string, properties?: Record<string, any>) => {
    addBreadcrumb(
      `Page view: ${page}`,
      'navigation',
      'info',
      properties
    );
  },
  
  // Track business events
  trackBusinessEvent: (event: string, properties?: Record<string, any>) => {
    captureMessage(
      `Business event: ${event}`,
      'info',
      {
        tags: { event_type: 'business' },
        extra: properties,
      }
    );
  },
  
  // Track performance metrics
  trackPerformance: (metric: string, value: number, unit: string) => {
    addBreadcrumb(
      `Performance: ${metric} = ${value}${unit}`,
      'performance',
      'info',
      { metric, value, unit }
    );
  },
  
  // Track feature usage
  trackFeatureUsage: (feature: string, properties?: Record<string, any>) => {
    addBreadcrumb(
      `Feature used: ${feature}`,
      'feature',
      'info',
      properties
    );
  },
};

export default Sentry;
