'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  ClipboardCheck, 
  Clock, 
  ExternalLink, 
  Play, 
  Tag, 
  User, 
  XCircle
} from 'lucide-react';
import { useTestCases } from '@/hooks/useTesterDashboard';
import { 
  formatDate, 
  getPriorityColorClass, 
  getTestStatusColorClass,
  getPriorityLabel,
  getTestStatusLabel,
  getTestResultColorClass,
  getTestResultLabel,
  formatDuration
} from '@/utils/dashboardUtils';

interface TestCaseDetailProps {
  testCaseId: string;
}

export default function TestCaseDetail({ testCaseId }: TestCaseDetailProps) {
  const { 
    currentTestCase, 
    testExecutions,
    loading, 
    error,
    fetchTestCaseById,
    fetchTestExecutions
  } = useTestCases();
  
  useEffect(() => {
    fetchTestCaseById(testCaseId);
    fetchTestExecutions(testCaseId);
  }, [testCaseId, fetchTestCaseById, fetchTestExecutions]);
  
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
        <p className="font-medium">Error loading test case details</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!currentTestCase) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
        <p className="font-medium">Test case not found</p>
        <p className="text-sm">The requested test case could not be found.</p>
        <Link 
          href="/dashboard/tester/test-cases" 
          className="mt-2 inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Test Cases
        </Link>
      </div>
    );
  }
  
  // Sort executions by date (newest first)
  const sortedExecutions = [...testExecutions].sort(
    (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
  );
  
  // Get latest execution
  const latestExecution = sortedExecutions.length > 0 ? sortedExecutions[0] : null;
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/dashboard/tester/test-cases" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Test Cases
        </Link>
      </div>
      
      {/* Test Case Header */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getPriorityColorClass(currentTestCase.priority)}`}>
                {getPriorityLabel(currentTestCase.priority)}
              </span>
              <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getTestStatusColorClass(currentTestCase.status)}`}>
                {getTestStatusLabel(currentTestCase.status)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentTestCase.title}</h1>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
              <div className="flex items-center">
                <ClipboardCheck className="h-4 w-4 mr-1" />
                <span>Test #{currentTestCase.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created {formatDate(currentTestCase.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>By {currentTestCase.createdBy.name}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Assigned to {currentTestCase.assignedTo.name}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/tester/test-cases/${currentTestCase.id}/execute`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Play className="h-4 w-4 mr-1" />
              Execute Test
            </Link>
          </div>
        </div>
      </div>
      
      {/* Test Case Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{currentTestCase.description}</p>
            </div>
          </div>
          
          {/* Preconditions */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preconditions</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{currentTestCase.preconditions}</p>
            </div>
          </div>
          
          {/* Test Steps */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Steps</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Step
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTestCase.steps.map((step) => (
                    <tr key={step.stepNumber} className={step.stepNumber % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {step.stepNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {step.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {step.expectedResult}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Execution History */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Execution History</h2>
            
            {sortedExecutions.length > 0 ? (
              <div className="space-y-4">
                {sortedExecutions.map((execution) => (
                  <div key={execution.id} className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {execution.result === 'passed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          ) : execution.result === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          ) : (
                            <ClipboardCheck className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getTestResultColorClass(execution.result)}`}>
                            {getTestResultLabel(execution.result)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(execution.executedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Executed By</p>
                          <p className="text-sm text-gray-900">{execution.executedBy.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Duration</p>
                          <p className="text-sm text-gray-900">{formatDuration(execution.duration)}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{execution.notes}</p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Environment</p>
                        <p className="text-sm text-gray-900">
                          {execution.environment.platform} • 
                          {execution.environment.version && ` v${execution.environment.version} • `}
                          {execution.environment.deviceModel && execution.environment.deviceModel !== 'N/A' && `${execution.environment.deviceModel} • `}
                          {execution.environment.osVersion && execution.environment.osVersion !== 'N/A' && `${execution.environment.osVersion} • `}
                          {execution.environment.browser && execution.environment.browser !== 'N/A' && execution.environment.browser}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Step Results</p>
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                Step
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Result
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {execution.stepResults.map((stepResult) => (
                              <tr key={stepResult.stepNumber}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {stepResult.stepNumber}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {stepResult.result === 'passed' ? (
                                    <span className="inline-flex items-center text-xs text-green-700">
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Passed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-xs text-red-700">
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Failed
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {stepResult.notes}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-md">
                <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No executions yet</h3>
                <p className="text-gray-500 mb-4">This test case hasn't been executed yet</p>
                <Link
                  href={`/dashboard/tester/test-cases/${currentTestCase.id}/execute`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Execute Test
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* App Info */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">App Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">App Name</p>
                <p className="text-sm text-gray-900">{currentTestCase.appName}</p>
              </div>
              {currentTestCase.projectId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Project ID</p>
                  <p className="text-sm text-gray-900">{currentTestCase.projectId}</p>
                </div>
              )}
              {currentTestCase.featureId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Feature ID</p>
                  <p className="text-sm text-gray-900">{currentTestCase.featureId}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {currentTestCase.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {currentTestCase.tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags</p>
              )}
            </div>
          </div>
          
          {/* Latest Execution Summary */}
          {latestExecution && (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Latest Execution</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Result</p>
                  <div className="flex items-center mt-1">
                    {latestExecution.result === 'passed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    ) : latestExecution.result === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <ClipboardCheck className="h-5 w-5 text-gray-400 mr-2" />
                    )}
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getTestResultColorClass(latestExecution.result)}`}>
                      {getTestResultLabel(latestExecution.result)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Executed</p>
                  <p className="text-sm text-gray-900">{formatDate(latestExecution.executedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">By</p>
                  <p className="text-sm text-gray-900">{latestExecution.executedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-sm text-gray-900">{formatDuration(latestExecution.duration)}</p>
                </div>
                <div>
                  <Link
                    href={`/dashboard/tester/test-cases/${currentTestCase.id}/execute`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Execute Again
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
