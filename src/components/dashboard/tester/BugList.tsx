'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Bug, 
  CheckCircle2, 
  Filter, 
  Search,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { useBugs } from '@/hooks/useTesterDashboard';
import { getCurrentUser } from '@/services/authService';
import { 
  formatDate, 
  getSeverityColorClass, 
  getStatusColorClass,
  getSeverityLabel,
  getStatusLabel
} from '@/utils/dashboardUtils';
import { Bug as BugType, BugSeverity, BugStatus } from '@/services/bugService';

export default function BugList() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<BugSeverity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<BugStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'severity' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { 
    bugs, 
    loading, 
    error,
    fetchBugsByTesterId,
    fetchAllBugs
  } = useBugs();
  
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserId(user.id);
      if (user.role === 'admin') {
        fetchAllBugs();
      } else {
        fetchBugsByTesterId(user.id);
      }
    }
  }, [fetchBugsByTesterId, fetchAllBugs]);
  
  // Filter and sort bugs
  const filteredBugs = bugs
    .filter(bug => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.appName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Severity filter
      const matchesSeverity = selectedSeverity === 'all' || bug.severity === selectedSeverity;
      
      // Status filter
      const matchesStatus = selectedStatus === 'all' || bug.status === selectedStatus;
      
      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortField === 'createdAt') {
        return sortDirection === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortField === 'severity') {
        const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return sortDirection === 'asc'
          ? severityOrder[a.severity] - severityOrder[b.severity]
          : severityOrder[b.severity] - severityOrder[a.severity];
      } else if (sortField === 'status') {
        const statusOrder = { open: 3, 'in-progress': 2, resolved: 1, closed: 0, rejected: 0 };
        return sortDirection === 'asc'
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      }
      return 0;
    });
  
  // Toggle sort direction or change sort field
  const handleSort = (field: 'createdAt' | 'severity' | 'status') => {
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
        <p className="font-medium">Error loading bugs</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold">Bug Reports</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Link 
            href="/dashboard/tester/bugs/report" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Report Bug
          </Link>
        </div>
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
                placeholder="Search bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Severity Filter */}
            <div className="relative inline-block text-left">
              <div className="flex">
                <label className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Severity
                </label>
                <select
                  className="block w-full rounded-r-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as BugSeverity | 'all')}
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
                  onChange={(e) => setSelectedStatus(e.target.value as BugStatus | 'all')}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bug List */}
      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {filteredBugs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bug
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    App
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('severity')}
                  >
                    <div className="flex items-center">
                      Severity
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
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Reported
                      <ArrowUpDown className="h-4 w-4 ml-1" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/tester/bugs/${bug.id}`} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {bug.status === 'open' ? (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          ) : bug.status === 'resolved' || bug.status === 'closed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Bug className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{bug.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{bug.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{bug.appName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getSeverityColorClass(bug.severity)}`}>
                        {getSeverityLabel(bug.severity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getStatusColorClass(bug.status)}`}>
                        {getStatusLabel(bug.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bug.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bug className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No bugs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedSeverity !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'You haven\'t reported any bugs yet'}
            </p>
            <Link 
              href="/dashboard/tester/bugs/report" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Report Bug
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
