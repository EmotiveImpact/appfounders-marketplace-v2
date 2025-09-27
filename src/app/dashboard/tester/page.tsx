'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserPurchases } from '@/lib/hooks/usePayloadAPI';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Filter, Grid, List, ExternalLink, MessageSquare, Bug, ClipboardList, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TesterDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: purchases, loading: purchasesLoading, error: purchasesError, execute: fetchPurchases } = useUserPurchases();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!authLoading && isAuthenticated && (user as any)?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch purchases on initial load
  useEffect(() => {
    if (isAuthenticated && user && !purchases && !purchasesLoading) {
      fetchPurchases();
    }
  }, [isAuthenticated, user, fetchPurchases, purchases, purchasesLoading]);
  
  // Filter purchases based on search query
  const filteredPurchases = purchases?.docs?.filter((purchase: any) =>
    purchase.app?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Only show loading state on initial load, not when there's an error
  if ((authLoading || purchasesLoading) && !purchasesError) {
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
            {/* Welcome section */}
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h1 className="text-2xl font-bold text-blue-800 mb-2">Welcome, {user?.name || 'Tester'}</h1>
              <p className="text-blue-600">
                You are signed in as: {user?.email} (Role: Tester)
              </p>
            </div>
            
            {/* Tester Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Bug className="h-5 w-5 mr-2 text-red-500" />
                    Bug Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Report and track bugs across projects. Categorize by severity and priority.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/tester/bugs">
                    <Button variant="outline" size="sm">View Reports</Button>
                  </Link>
                  <Link href="/dashboard/tester/bugs/report" className="ml-2">
                    <Button size="sm">Report Bug</Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2 text-blue-500" />
                    Test Cases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    View and manage test cases assigned to you. Track execution history.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/tester/test-cases">
                    <Button variant="outline" size="sm">View Test Cases</Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-green-500" />
                    Test Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    View test pass/fail rates, coverage metrics, and bug distribution.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/tester/analytics">
                    <Button variant="outline" size="sm">View Analytics</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">My Apps for Testing</h2>
            
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search your apps..."
                  className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Error message */}
            {purchasesError && (
              <div className="text-center py-12 border rounded-lg">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Apps Available</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't purchased any apps yet.
                </p>
                <Link 
                  href="/marketplace" 
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Browse Marketplace
                </Link>
              </div>
            )}
            
            {/* Empty state */}
            {!purchasesError && filteredPurchases.length === 0 && (
              <div className="text-center py-12 border rounded-lg">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Apps Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'No apps match your search criteria.' : 'You haven\'t purchased any apps for testing yet.'}
                </p>
                <Link 
                  href="/marketplace" 
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Browse Marketplace
                </Link>
              </div>
            )}
            
            {/* Grid view */}
            {viewMode === 'grid' && filteredPurchases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPurchases.map((purchase: any) => (
                  <div key={purchase.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={purchase.app?.image?.url || '/placeholder-app.png'}
                        alt={purchase.app?.name || 'App'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-lg mb-1">{purchase.app?.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {purchase.app?.shortDescription || purchase.app?.description?.substring(0, 100)}
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                          Purchased: {formatDate(purchase.createdAt)}
                        </span>
                        <Link href={`/dashboard/tester/apps/${purchase.app?.id}`}>
                          <button className="px-3 py-1 bg-black text-white text-sm rounded-md hover:bg-gray-800">
                            Test App
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* List view */}
            {viewMode === 'list' && filteredPurchases.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        App
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredPurchases.map((purchase: any) => (
                      <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              <Image
                                src={purchase.app?.image?.url || '/placeholder-app.png'}
                                alt={purchase.app?.name || 'App'}
                                fill
                                className="rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {purchase.app?.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {purchase.app?.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(purchase.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(purchase.app?.price || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/dashboard/tester/apps/${purchase.app?.id}`}>
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">
                              Test
                            </button>
                          </Link>
                          <Link href={`/marketplace/${purchase.app?.id}`} target="_blank">
                            <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center">
                              View <ExternalLink className="h-3 w-3 ml-1" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
