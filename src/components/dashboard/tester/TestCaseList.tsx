'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ClipboardCheck, 
  Filter, 
  Search,
  ArrowUpDown,
  Play,
  XCircle
} from 'lucide-react';
import { useTestCases } from '@/hooks/useTesterDashboard';
import { useSession } from 'next-auth/react';
import { 
  formatDate, 
  getPriorityColorClass, 
  getTestStatusColorClass,
  getPriorityLabel,
  getTestStatusLabel
} from '@/utils/dashboardUtils';
import { TestCasePriority, TestCaseStatus } from '@/services/testCaseService';

export default function TestCaseList() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TestCasePriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TestCaseStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'updatedAt' | 'priority' | 'status'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const {
    testCases,
    loading,
    error,
    fetchTestCasesByTesterId,
    fetchAllTestCases
  } = useTestCases();

  useEffect(() => {
    if (session?.user) {
      setUserId((session.user as any).id);
      if ((session.user as any).role === 'admin') {
        fetchAllTestCases();
      } else {
        fetchTestCasesByTesterId((session.user as any).id);
      }
    }
  }, [session, fetchTestCasesByTesterId, fetchAllTestCases]);
  
  // Filter and sort test cases
  const filteredTestCases = testCases
    .filter(testCase => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testCase.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testCase.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Priority filter
      const matchesPriority = selectedPriority === 'all' || testCase.priority === selectedPriority;
      
      // Status filter
      const matchesStatus = selectedStatus === 'all' || testCase.status === selectedStatus;
      
      return matchesSearch && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortField === 'updatedAt') {
        return sortDirection === 'asc' 
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortField === 'priority') {
        const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return sortDirection === 'asc'
          ? priorityOrder[a.priority] - priorityOrder[b.priority]
          : priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortField === 'status') {
        const statusOrder = { 'pending': 3, 'in-progress': 2, 'passed': 1, 'failed': 0, 'blocked': 0 };
        return sortDirection === 'asc'
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      }
      return 0;
    });
  
  // Toggle sort direction or change sort field
  const handleSort = (field: 'updatedAt' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
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
        <p className="font-medium">Error loading test cases</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold">Test Cases</h2>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Priority Filter */}
            <div className="relative inline-block text-left">
              <div className="flex">
                <label className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Priority
                </label>
                <select
                  className="block w-full rounded-r-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as TestCasePriority | 'all')}
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="relative inline-block text-left">
              <div className="flex">
                <label className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Status
                </label>
                <select
                  className="block w-full rounded-r-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TestCaseStatus | 'all')}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Case List */}
      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {filteredTestCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Case
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">
                      Priority
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('updatedAt')}
                  >
                    <div className="flex items-center">
                      Last Updated
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTestCases.map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/tester/test-cases/${testCase.id}`} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {testCase.status === 'passed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : testCase.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <ClipboardCheck className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{testCase.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{testCase.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{testCase.appName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getPriorityColorClass(testCase.priority)}`}>
                        {getPriorityLabel(testCase.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getTestStatusColorClass(testCase.status)}`}>
                        {getTestStatusLabel(testCase.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(testCase.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/tester/test-cases/${testCase.id}/execute`}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Execute
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No test cases found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'No test cases have been assigned to you yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
