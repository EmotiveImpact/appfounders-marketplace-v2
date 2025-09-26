'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/signin');
      } else if (user?.role) {
        setRole(user.role);

        // Only redirect if user is on the base dashboard path
        if (pathname === '/dashboard') {
          router.push(`/dashboard/${user.role}`);
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  // If still loading or no role determined, show loading state
  if (isLoading || !role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is trying to access a role-specific dashboard they don't have access to
  const roleSpecificPaths = {
    developer: '/dashboard/developer',
    tester: '/dashboard/tester',
    admin: '/dashboard/admin',
  };
  
  // Common paths that all authenticated users can access
  const commonPaths = ['/dashboard/profile'];
  
  // Check if the current path is a common path that all users can access
  const isCommonPath = commonPaths.some(path => pathname.startsWith(path));
  
  // Only redirect if user is trying to access a different role's dashboard and not a common path
  if (!isCommonPath) {
    for (const [pathRole, pathPrefix] of Object.entries(roleSpecificPaths)) {
      if (pathRole !== role && pathname.startsWith(pathPrefix)) {
        // User is trying to access a dashboard they don't have access to
        // Redirect them to their own dashboard
        router.push(`/dashboard/${role}`);
        return (
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar is already included in the root layout, so we don't need it here */}
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
