'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserBugs } from '@/lib/hooks/usePayloadAPI';
import { formatDate } from '@/lib/utils';
import { Plus, Search, AlertCircle } from 'lucide-react';

export default function BugsListPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: bugsData, loading: bugsLoading, error: bugsError, execute: fetchBugs } = useUserBugs();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!authLoading && isAuthenticated && (user as any)?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch bugs on initial load
  useEffect(() => {
    if (isAuthenticated && user && !bugsData && !bugsLoading) {
      fetchBugs();
    }
  }, [isAuthenticated, user, fetchBugs, bugsData, bugsLoading]);
  
  // Filter bugs based on search query
  const filteredBugs = bugsData?.docs?.filter((bug: any) =>
    bug.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bug.app?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Loading state
  if ((authLoading || bugsLoading) && !bugsError) {
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
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 sm:mb-0">My Bug Reports</h1>
            <Link
              href="/dashboard/tester/bugs/report"
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Bug
            </Link>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bug reports..."
                className="pl-10 pr-4 py-2 border rounded-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Error message */}
          {bugsError && (
            <div className="text-center py-12 border rounded-lg">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Bug Reports Available</h3>
              <p className="text-muted-foreground mb-6">
                You haven't reported any bugs yet.
              </p>
              <Link 
                href="/dashboard/tester/bugs/report" 
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Report Your First Bug
              </Link>
            </div>
          )}
          
          {/* Empty state */}
          {filteredBugs.length === 0 && !bugsLoading && !bugsError && (
            <div className="text-center py-12 border rounded-lg">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Bug Reports Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'No bug reports match your search query.' 
                  : 'You haven\'t reported any bugs yet.'}
              </p>
              <Link 
                href="/dashboard/tester/bugs/report" 
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Report Your First Bug
              </Link>
            </div>
          )}
          
          {/* Bug reports list */}
          {filteredBugs.length > 0 && (
            <div className="overflow-hidden border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bug
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      App
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBugs.map((bug: any) => (
                    <tr key={bug.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{bug.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {typeof bug.app === 'string' ? bug.app : bug.app?.name || 'Unknown App'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(bug.severity)}`}>
                          {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bug.status)}`}>
                          {bug.status.charAt(0).toUpperCase() + bug.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bug.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/tester/bugs/${bug.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
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
  );
}
