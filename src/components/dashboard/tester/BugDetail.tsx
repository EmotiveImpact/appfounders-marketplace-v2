'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Bug, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Monitor, 
  User, 
  XCircle,
  Share2
} from 'lucide-react';
import { useBugs } from '@/hooks/useTesterDashboard';
import { getCurrentUser, hasRole } from '@/services/authService';
import { 
  formatDate, 
  getSeverityColorClass, 
  getStatusColorClass,
  formatStepsToReproduce,
  formatEnvironmentInfo,
  getSeverityLabel,
  getStatusLabel
} from '@/utils/dashboardUtils';
import { BugStatus } from '@/services/bugService';

interface BugDetailProps {
  bugId: string;
}

export default function BugDetail({ bugId }: BugDetailProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BugStatus>('open');
  
  const { 
    currentBug, 
    loading, 
    error,
    fetchBugById,
    updateBug
  } = useBugs();
  
  useEffect(() => {
    fetchBugById(bugId);
    setIsAdmin(hasRole('admin'));
  }, [bugId, fetchBugById]);
  
  const handleStatusUpdate = async () => {
    if (!currentBug) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    await updateBug(bugId, newStatus, user.id, user.name);
    setStatusUpdateOpen(false);
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
        <p className="font-medium">Error loading bug details</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!currentBug) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
        <p className="font-medium">Bug not found</p>
        <p className="text-sm">The requested bug report could not be found.</p>
        <Link 
          href="/dashboard/tester/bugs" 
          className="mt-2 inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bug List
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          href="/dashboard/tester/bugs" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bug List
        </Link>
      </div>
      
      {/* Bug Header */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getSeverityColorClass(currentBug.severity)}`}>
                {getSeverityLabel(currentBug.severity)}
              </span>
              <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getStatusColorClass(currentBug.status)}`}>
                {getStatusLabel(currentBug.status)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentBug.title}</h1>
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
              <div className="flex items-center">
                <Bug className="h-4 w-4 mr-1" />
                <span>Bug #{currentBug.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Reported {formatDate(currentBug.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>By {currentBug.reportedBy.name}</span>
              </div>
              {currentBug.assignedTo && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>Assigned to {currentBug.assignedTo.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <button
                onClick={() => setStatusUpdateOpen(!statusUpdateOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Status
              </button>
            )}
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </button>
          </div>
        </div>
        
        {/* Status Update Form */}
        {statusUpdateOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Update Bug Status</h3>
            <div className="flex items-center gap-2">
              <select
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BugStatus)}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update
              </button>
              <button
                onClick={() => setStatusUpdateOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bug Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{currentBug.description}</p>
            </div>
          </div>
          
          {/* Steps to Reproduce */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Steps to Reproduce</h2>
            <div className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                {currentBug.stepsToReproduce.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
          
          {/* Expected vs Actual Behavior */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Expected Behavior</h2>
                <p className="text-gray-700 whitespace-pre-line">{currentBug.expectedBehavior}</p>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Actual Behavior</h2>
                <p className="text-gray-700 whitespace-pre-line">{currentBug.actualBehavior}</p>
              </div>
            </div>
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
                <p className="text-sm text-gray-900">{currentBug.appName}</p>
              </div>
              {currentBug.projectId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Project ID</p>
                  <p className="text-sm text-gray-900">{currentBug.projectId}</p>
                </div>
              )}
              {currentBug.testCaseId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Related Test Case</p>
                  <Link 
                    href={`/dashboard/tester/test-cases/${currentBug.testCaseId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    View Test Case <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Environment */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Environment</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Platform</p>
                <p className="text-sm text-gray-900">{currentBug.environment.platform}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">App Version</p>
                <p className="text-sm text-gray-900">{currentBug.environment.version}</p>
              </div>
              {currentBug.environment.deviceModel && currentBug.environment.deviceModel !== 'N/A' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Device Model</p>
                  <p className="text-sm text-gray-900">{currentBug.environment.deviceModel}</p>
                </div>
              )}
              {currentBug.environment.osVersion && currentBug.environment.osVersion !== 'N/A' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">OS Version</p>
                  <p className="text-sm text-gray-900">{currentBug.environment.osVersion}</p>
                </div>
              )}
              {currentBug.environment.browser && currentBug.environment.browser !== 'N/A' && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Browser</p>
                  <p className="text-sm text-gray-900">{currentBug.environment.browser}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Status History */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status History</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bug className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Bug Reported</p>
                  <p className="text-xs text-gray-500">{formatDate(currentBug.createdAt)}</p>
                  <p className="text-xs text-gray-500">By {currentBug.reportedBy.name}</p>
                </div>
              </div>
              
              {currentBug.status !== 'open' && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Status Updated</p>
                    <p className="text-xs text-gray-500">{formatDate(currentBug.updatedAt)}</p>
                    <p className="text-xs text-gray-500">
                      Status changed to <span className="font-medium">{getStatusLabel(currentBug.status)}</span>
                    </p>
                  </div>
                </div>
              )}
              
              {currentBug.resolvedAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Bug Resolved</p>
                    <p className="text-xs text-gray-500">{formatDate(currentBug.resolvedAt)}</p>
                    {currentBug.assignedTo && (
                      <p className="text-xs text-gray-500">By {currentBug.assignedTo.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
