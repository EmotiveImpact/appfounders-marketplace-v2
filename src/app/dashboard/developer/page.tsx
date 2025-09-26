'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDeveloperSales } from '@/lib/hooks/usePayloadAPI';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  BarChart, 
  DollarSign, 
  Users, 
  Package, 
  PlusCircle,
  ArrowRight,
  Download,
  TrendingUp
} from 'lucide-react';
import { mockAuth } from '@/lib/auth/mock-auth';

interface UserWithRole {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    data: salesData, 
    loading: salesLoading, 
    error: salesError, 
    execute: fetchSales 
  } = useDeveloperSales();
  
  // Check for mock authentication in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const mockUser = mockAuth.getCurrentUser();
      if (mockUser && mockUser.role !== 'developer') {
        console.log('Mock user is not a developer, redirecting...');
        router.push('/dashboard');
      }
    }
  }, [router]);
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    const userWithRole = user as UserWithRole;
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && userWithRole?.role !== 'developer') {
      router.push('/dashboard');
    }
    // No else case - if user is authenticated and is a developer, stay on this page
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch sales data on initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSales();
    }
  }, [isAuthenticated, user, fetchSales]);
  
  // Mock data for the dashboard
  const mockApps = [
    { id: '1', name: 'App 1', image: '/placeholder-app.png', purchaseCount: 12, earnings: 240 },
    { id: '2', name: 'App 2', image: '/placeholder-app.png', purchaseCount: 8, earnings: 160 },
    { id: '3', name: 'App 3', image: '/placeholder-app.png', purchaseCount: 5, earnings: 100 },
  ];
  
  const mockStats = {
    totalApps: mockApps.length,
    totalSales: mockApps.reduce((acc, app) => acc + app.purchaseCount, 0),
    totalEarnings: mockApps.reduce((acc, app) => acc + app.earnings, 0),
    averageRating: 4.5
  };
  
  // Calculate real stats if we have sales data
  const stats = salesData ? {
    totalApps: salesData.totalApps || 0,
    totalSales: salesData.totalSales || 0,
    totalEarnings: salesData.totalEarnings || 0,
    averageRating: salesData.averageRating || 0
  } : mockStats;
  
  // Recent sales data
  const recentSales = salesData?.recentSales || [];
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-3xl font-bold">Developer Dashboard</h1>
              <Link
                href="/dashboard/developer/create"
                className="mt-4 sm:mt-0 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 inline-flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New App
              </Link>
            </div>
            
            {/* Stats overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Total Apps</p>
                    <h3 className="text-2xl font-bold">{stats.totalApps}</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <h3 className="text-2xl font-bold">{stats.totalSales}</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <DollarSign className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <BarChart className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Avg. Rating</p>
                    <h3 className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link
                href="/dashboard/developer/apps"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Manage Apps</h3>
                    <p className="text-sm text-muted-foreground">Edit, update, or archive your apps</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
              
              <Link
                href="/dashboard/developer/analytics"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">See detailed performance metrics</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
              
              <Link
                href="/dashboard/developer/feedback"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Tester Feedback</h3>
                    <p className="text-sm text-muted-foreground">View and respond to feedback</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </div>
            
            {/* Your apps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Apps</h2>
                <Link 
                  href="/dashboard/developer/apps"
                  className="text-sm font-medium hover:underline inline-flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(salesData?.apps || mockApps).slice(0, 3).map((app) => (
                  <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="relative aspect-video">
                      <Image
                        src={typeof app.image === 'string' ? app.image : app.image?.url || '/placeholder-app.png'}
                        alt={app.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-2">{app.name}</h3>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-muted-foreground">{app.purchaseCount} sales</span>
                        <span>{formatCurrency(app.earnings)}</span>
                      </div>
                      <Link
                        href={`/dashboard/developer/apps/${app.id}`}
                        className="w-full py-2 bg-black text-white rounded-md hover:bg-gray-800 inline-block text-center text-sm"
                      >
                        Manage App
                      </Link>
                    </div>
                  </div>
                ))}
                
                {(salesData?.apps || mockApps).length === 0 && (
                  <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Apps Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't created any apps yet. Get started by creating your first app.
                    </p>
                    <Link 
                      href="/dashboard/developer/create"
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 inline-flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New App
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent sales */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Sales</h2>
                <Link 
                  href="/dashboard/developer/earnings"
                  className="text-sm font-medium hover:underline inline-flex items-center"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              {recentSales.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">App</th>
                        <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Tester</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="relative w-8 h-8 rounded overflow-hidden mr-3 flex-shrink-0">
                                <Image
                                  src={typeof sale.app.image === 'string' ? sale.app.image : sale.app.image?.url || '/placeholder-app.png'}
                                  alt={sale.app.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="font-medium">{sale.app.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            {formatDate(sale.purchaseDate || sale.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm hidden sm:table-cell">
                            {sale.tester?.name || 'Anonymous Tester'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="font-medium">{formatCurrency(sale.developerPayout)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Sales Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't made any sales yet. Create an app and start selling!
                  </p>
                  <Link 
                    href="/dashboard/developer/create"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 inline-flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New App
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
