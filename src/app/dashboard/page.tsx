'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // Redirect based on user role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role) {
      console.log('User role detected:', user.role);
      setRedirecting(true);
      
      // Redirect to role-specific dashboard
      const redirectPath = `/dashboard/${user.role}`;
      router.push(redirectPath);
    } else if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {redirecting ? 'Redirecting to your dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
        <p className="mb-4">You need to sign in to access this page.</p>
        <Link href="/signin" className="px-4 py-2 bg-indigo-600 text-white rounded-md">
          Go to Sign In
        </Link>
      </div>
    );
  }

  // This is a fallback UI that should rarely be seen due to the redirect
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => {
                if (user) {
                  // Use the signOut method from useAuth
                  signOut();
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-indigo-50 p-4 rounded-md mb-6">
            <p className="text-indigo-700">
              Welcome, <span className="font-semibold">{user.name}</span>!
            </p>
            <p className="text-indigo-600 text-sm mt-1">
              You are signed in as: {user.email} (Role: {user.role})
            </p>
          </div>

          <div className="text-center py-8">
            <p className="text-lg mb-4">Redirecting you to your role-specific dashboard...</p>
            <div className="flex justify-center gap-4">
              {user.role === 'developer' && (
                <Link
                  href="/dashboard/developer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Developer Dashboard
                </Link>
              )}
              
              {user.role === 'tester' && (
                <Link
                  href="/dashboard/tester"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Tester Dashboard
                </Link>
              )}
              
              {user.role === 'admin' && (
                <Link
                  href="/dashboard/admin"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
