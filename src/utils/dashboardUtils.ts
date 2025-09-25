// Dashboard utility functions

import { BugSeverity, BugStatus } from '@/services/bugService';
import { TestCasePriority, TestCaseStatus, TestExecutionResult } from '@/services/testCaseService';

// Format date to readable string
export const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format time duration in seconds to readable string
export const formatDuration = (seconds: number): string => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min${remainingSeconds > 0 ? ` ${remainingSeconds} sec` : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
  }
};

// Get color class for bug severity
export const getSeverityColorClass = (severity: BugSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

// Get color class for bug status
export const getStatusColorClass = (status: BugStatus): string => {
  switch (status) {
    case 'open':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'in-progress':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'resolved':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'closed':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    case 'rejected':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

// Get color class for test case priority
export const getPriorityColorClass = (priority: TestCasePriority): string => {
  switch (priority) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

// Get color class for test case status
export const getTestStatusColorClass = (status: TestCaseStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'in-progress':
      return 'text-purple-700 bg-purple-50 border-purple-200';
    case 'passed':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'blocked':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

// Get color class for test execution result
export const getTestResultColorClass = (result: TestExecutionResult): string => {
  switch (result) {
    case 'passed':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'blocked':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'skipped':
      return 'text-gray-700 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

// Get severity label
export const getSeverityLabel = (severity: BugSeverity): string => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

// Get status label
export const getStatusLabel = (status: BugStatus): string => {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Get priority label
export const getPriorityLabel = (priority: TestCasePriority): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

// Get test status label
export const getTestStatusLabel = (status: TestCaseStatus): string => {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Get test result label
export const getTestResultLabel = (result: TestExecutionResult): string => {
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Format platform and browser info
export const formatEnvironmentInfo = (environment: {
  platform: string;
  version: string;
  deviceModel: string;
  osVersion: string;
  browser: string;
}): string => {
  const parts = [];
  
  if (environment.platform) parts.push(environment.platform);
  if (environment.deviceModel && environment.deviceModel !== 'N/A') parts.push(environment.deviceModel);
  if (environment.osVersion && environment.osVersion !== 'N/A') parts.push(environment.osVersion);
  if (environment.browser && environment.browser !== 'N/A') parts.push(environment.browser);
  
  return parts.join(' • ');
};

// Calculate pass rate percentage
export const calculatePassRate = (passed: number, total: number): string => {
  if (total === 0) return '0%';
  const rate = (passed / total) * 100;
  return `${rate.toFixed(1)}%`;
};

// Get color class based on pass rate
export const getPassRateColorClass = (passRate: number): string => {
  if (passRate >= 90) {
    return 'text-green-700';
  } else if (passRate >= 70) {
    return 'text-yellow-700';
  } else {
    return 'text-red-700';
  }
};

// Format steps to reproduce as a numbered list
export const formatStepsToReproduce = (steps: string[]): string => {
  if (!steps || steps.length === 0) return 'No steps provided';
  
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
};

// Generate chart data for bug severity distribution
export const generateBugSeverityChartData = (
  bySeverity: Record<BugSeverity, number>
): { labels: string[]; data: number[]; backgroundColor: string[] } => {
  return {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    data: [
      bySeverity.critical,
      bySeverity.high,
      bySeverity.medium,
      bySeverity.low
    ],
    backgroundColor: [
      'rgba(220, 38, 38, 0.7)', // red for critical
      'rgba(249, 115, 22, 0.7)', // orange for high
      'rgba(234, 179, 8, 0.7)',  // yellow for medium
      'rgba(34, 197, 94, 0.7)'   // green for low
    ]
  };
};

// Generate chart data for bug status distribution
export const generateBugStatusChartData = (
  byStatus: Record<BugStatus, number>
): { labels: string[]; data: number[]; backgroundColor: string[] } => {
  return {
    labels: ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    data: [
      byStatus.open,
      byStatus['in-progress'],
      byStatus.resolved,
      byStatus.closed,
      byStatus.rejected
    ],
    backgroundColor: [
      'rgba(59, 130, 246, 0.7)',  // blue for open
      'rgba(168, 85, 247, 0.7)',   // purple for in-progress
      'rgba(34, 197, 94, 0.7)',    // green for resolved
      'rgba(107, 114, 128, 0.7)',  // gray for closed
      'rgba(220, 38, 38, 0.7)'     // red for rejected
    ]
  };
};

// Generate chart data for test case execution results
export const generateTestResultsChartData = (
  executionResults: {
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
  }
): { labels: string[]; data: number[]; backgroundColor: string[] } => {
  return {
    labels: ['Passed', 'Failed', 'Blocked', 'Skipped'],
    data: [
      executionResults.passed,
      executionResults.failed,
      executionResults.blocked,
      executionResults.skipped
    ],
    backgroundColor: [
      'rgba(34, 197, 94, 0.7)',    // green for passed
      'rgba(220, 38, 38, 0.7)',    // red for failed
      'rgba(249, 115, 22, 0.7)',   // orange for blocked
      'rgba(107, 114, 128, 0.7)'   // gray for skipped
    ]
  };
};
