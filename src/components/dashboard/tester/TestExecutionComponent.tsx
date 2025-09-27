'use client';
import React, { useEffect, useState } from 'react';
import { Loader2, Search, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import { useTesterDashboard } from '@/hooks/useTesterDashboard';
import { formatDuration, formatDate } from '@/utils/formatters';
import { TestExecution } from '@/types/testExecution';

export default function TestExecutionComponent() {
  const { 
    testExecutions,
    loadingExecutions,
    errorExecutions,
    fetchTestExecutions
  } = useTesterDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof TestExecution>('executedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTestExecutions();
  }, [fetchTestExecutions]);

  // Filter and sort executions
  const filteredExecutions = testExecutions
    ?.filter(execution => {
      // Apply search filter
      const matchesSearch = !searchTerm || 
        (execution as any).testCase?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (execution.executedBy as any)?.toLowerCase?.().includes(searchTerm.toLowerCase());
      
      // Apply result filter
      const matchesResult = !filterResult || execution.result === filterResult;
      
      return matchesSearch && matchesResult;
    })
    .sort((a, b) => {
      if (sortField === 'executedAt') {
        return sortDirection === 'asc' 
          ? new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
          : new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime();
      }
      
      if (sortField === 'duration') {
        return sortDirection === 'asc' 
          ? a.duration - b.duration
          : b.duration - a.duration;
      }
      
      // Default sort for other fields
      const aValue = String((a as any)[sortField] || '');
      const bValue = String((b as any)[sortField] || '');
      
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  // Handle sort toggle
  const toggleSort = (field: keyof TestExecution) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get result badge color
  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Execution History</h1>
      
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search test cases, notes, or tester..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterResult || ''}
            onChange={(e) => setFilterResult(e.target.value || null)}
          >
            <option value="">All Results</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>
      
      {/* Loading state */}
      {loadingExecutions ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : errorExecutions ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-600">Error loading executions: {errorExecutions}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => toggleSort('testCase')}
                  >
                    Test Case
                    {sortField === 'testCase' && (
                      <ArrowUpDown size={16} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => toggleSort('result')}
                  >
                    Result
                    {sortField === 'result' && (
                      <ArrowUpDown size={16} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => toggleSort('duration')}
                  >
                    Duration
                    {sortField === 'duration' && (
                      <ArrowUpDown size={16} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => toggleSort('executedBy')}
                  >
                    Executed By
                    {sortField === 'executedBy' && (
                      <ArrowUpDown size={16} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => toggleSort('executedAt')}
                  >
                    <Calendar size={16} className="mr-1" />
                    Date
                    {sortField === 'executedAt' && (
                      <ArrowUpDown size={16} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Environment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExecutions?.map((execution) => (
                <tr key={execution.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{(execution as any).testCase?.title || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultBadgeClass(execution.result)}`}>
                      {execution.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDuration(execution.duration)}</td>
                  <td className="px-4 py-3 text-sm">{(execution.executedBy as any)?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(execution.executedAt.toString())}</td>
                  <td className="px-4 py-3 text-sm">{(execution.environment as any)?.platform || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!filteredExecutions || filteredExecutions.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              {searchTerm || filterResult 
                ? 'No test executions match your filters'
                : 'No test executions recorded yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
