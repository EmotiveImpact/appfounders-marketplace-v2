'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'developer' | 'tester' | 'admin';
  fallbackUrl?: string;
}

/**
 * A component that guards routes requiring authentication
 * Redirects to sign-in page if not authenticated
 * Can also check for specific roles
 */
export function AuthGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = '/signin' 
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after auth state is determined
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to sign-in
        router.push(fallbackUrl);
      } else if (requiredRole && user?.role !== requiredRole) {
        // Authenticated but wrong role, redirect to dashboard
        router.push(`/dashboard/${user?.role || ''}`);
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user, fallbackUrl]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated and has correct role, render children
  if (isAuthenticated && (!requiredRole || user?.role === requiredRole)) {
    return <>{children}</>;
  }

  // Otherwise, render nothing (redirect will happen in useEffect)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
