'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Bug, 
  CheckCircle2, 
  ClipboardCheck, 
  Clock, 
  XCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useBugs, useTestCases } from '@/hooks/useTesterDashboard';
// import { getCurrentUser } from '@/services/authService';
import { 
  formatDate, 
  getSeverityColorClass, 
  getStatusColorClass,
  getTestStatusColorClass,
  calculatePassRate,
  getPassRateColorClass
} from '@/utils/dashboardUtils';

export default function TesterDashboardOverview() {
  const [userId, setUserId] = useState<string | null>(null);
  
  const { 
    bugs, 
    loading: bugsLoading, 
    error: bugsError,
    statistics: bugStats,
    fetchBugsByTesterId,
    fetchBugStatistics
  } = useBugs();
  
  const {
    testCases,
    loading: testCasesLoading,
    error: testCasesError,
    statistics: testCaseStats,
    fetchTestCasesByTesterId,
    fetchTestCaseStatistics
  } = useTestCases();
  
  useEffect(() => {
    // const user = getCurrentUser();
    // if (user) {
    //   setUserId(user.id);
    //   fetchBugsByTesterId(user.id);
    //   fetchTestCasesByTesterId(user.id);
    //   fetchBugStatistics();
    //   fetchTestCaseStatistics();
    // }
    setUserId('user-id');
    fetchBugsByTesterId('user-id');
    fetchTestCasesByTesterId('user-id');
    fetchBugStatistics();
    fetchTestCaseStatistics();
  }, [fetchBugsByTesterId, fetchTestCasesByTesterId, fetchBugStatistics, fetchTestCaseStatistics]);
  
  const loading = bugsLoading || testCasesLoading;
  const error = bugsError || testCasesError;
  
  // Recent bugs (last 5)
  const recentBugs = [...bugs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  // Recent test cases (last 5)
  const recentTestCases = [...testCases]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  
  // Calculate summary metrics
  const pendingTestCases = testCases.filter(tc => tc.status === 'pending' || tc.status === 'in-progress').length;
  const openBugs = bugs.filter(bug => bug.status === 'open' || bug.status === 'in-progress').length;
  
  // Pass rate calculation
  const passRate = testCaseStats ? testCaseStats.executionResults.passRate : 0;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
        <p className="font-medium">Error loading dashboard data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Test Cases */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Test Cases</p>
              <p className="text-2xl font-bold">{testCases.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{pendingTestCases}</span> pending
            </p>
          </div>
        </div>
        
        {/* Reported Bugs */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reported Bugs</p>
              <p className="text-2xl font-bold">{bugs.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <Bug className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{openBugs}</span> open
            </p>
          </div>
        </div>
        
        {/* Test Pass Rate */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Pass Rate</p>
              <p className={`text-2xl font-bold ${getPassRateColorClass(passRate)}`}>
                {passRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium">
                {testCaseStats ? testCaseStats.executionResults.passed : 0}
              </span> passed tests
            </p>
          </div>
        </div>
        
        {/* Last Activity */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Activity</p>
              <p className="text-lg font-medium truncate">
                {recentBugs.length > 0 || recentTestCases.length > 0 ? (
                  recentBugs.length > 0 && (!recentTestCases.length || 
                    new Date(recentBugs[0].createdAt) > new Date(recentTestCases[0].updatedAt)) ? (
                    `Bug: ${recentBugs[0].title.substring(0, 15)}...`
                  ) : (
                    `Test: ${recentTestCases[0].title.substring(0, 15)}...`
                  )
                ) : (
                  'No recent activity'
                )}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {recentBugs.length > 0 || recentTestCases.length > 0 ? (
                recentBugs.length > 0 && (!recentTestCases.length || 
                  new Date(recentBugs[0].createdAt) > new Date(recentTestCases[0].updatedAt)) ? (
                  formatDate(recentBugs[0].createdAt)
                ) : (
                  formatDate(recentTestCases[0].updatedAt)
                )
              ) : (
                'N/A'
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Bug Severity Distribution */}
      {bugStats && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Bug Severity Distribution</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center">
              <div className="w-full bg-red-100 rounded-md p-3 flex justify-center">
                <span className="text-xl font-bold text-red-700">
                  {bugStats.bySeverity.critical}
                </span>
              </div>
              <span className="text-xs mt-1 text-gray-500">Critical</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-full bg-orange-100 rounded-md p-3 flex justify-center">
                <span className="text-xl font-bold text-orange-700">
                  {bugStats.bySeverity.high}
                </span>
              </div>
              <span className="text-xs mt-1 text-gray-500">High</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-full bg-yellow-100 rounded-md p-3 flex justify-center">
                <span className="text-xl font-bold text-yellow-700">
                  {bugStats.bySeverity.medium}
                </span>
              </div>
              <span className="text-xs mt-1 text-gray-500">Medium</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-full bg-green-100 rounded-md p-3 flex justify-center">
                <span className="text-xl font-bold text-green-700">
                  {bugStats.bySeverity.low}
                </span>
              </div>
              <span className="text-xs mt-1 text-gray-500">Low</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bugs */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Bugs</h3>
              <Link 
                href="/dashboard/tester/bugs" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentBugs.length > 0 ? (
              recentBugs.map(bug => (
                <div key={bug.id} className="p-4 hover:bg-gray-50">
                  <Link href={`/dashboard/tester/bugs/${bug.id}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {bug.status === 'open' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ) : bug.status === 'resolved' || bug.status === 'closed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Bug className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{bug.title}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColorClass(bug.severity)}`}>
                            {bug.severity}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{bug.appName}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(bug.createdAt)}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(bug.status)}`}>
                            {bug.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No bugs reported yet
              </div>
            )}
          </div>
          
          {recentBugs.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/dashboard/tester/bugs/report" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
              >
                Report New Bug <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
        
        {/* Recent Test Cases */}
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Assigned Test Cases</h3>
              <Link 
                href="/dashboard/tester/test-cases" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentTestCases.length > 0 ? (
              recentTestCases.map(testCase => (
                <div key={testCase.id} className="p-4 hover:bg-gray-50">
                  <Link href={`/dashboard/tester/test-cases/${testCase.id}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {testCase.status === 'passed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : testCase.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <ClipboardCheck className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{testCase.title}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getTestStatusColorClass(testCase.status)}`}>
                            {testCase.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{testCase.appName}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(testCase.updatedAt)}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {testCase.steps.length} steps
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No test cases assigned yet
              </div>
            )}
          </div>
          
          {recentTestCases.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <Link 
                href="/dashboard/tester/test-cases/execute" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
              >
                Execute Test Case <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
