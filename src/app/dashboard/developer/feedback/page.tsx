'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface UserWithRole {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}
import { 
  Loader2,
  Search,
  Filter,
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Bug,
  ThumbsUp
} from 'lucide-react';

// Category options
const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'bug', label: 'Bugs', icon: <Bug className="h-4 w-4 mr-2" /> },
  { value: 'feature_request', label: 'Feature Requests', icon: <Lightbulb className="h-4 w-4 mr-2" /> },
  { value: 'improvement', label: 'Improvements', icon: <ThumbsUp className="h-4 w-4 mr-2" /> },
  { value: 'praise', label: 'Praise', icon: <Star className="h-4 w-4 mr-2" /> }
];

// Status options
const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open', icon: <AlertCircle className="h-4 w-4 mr-2" /> },
  { value: 'in_progress', label: 'In Progress', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
  { value: 'planned', label: 'Planned', icon: <ChevronUp className="h-4 w-4 mr-2" /> },
  { value: 'resolved', label: 'Resolved', icon: <CheckCircle className="h-4 w-4 mr-2" /> },
  { value: 'closed', label: 'Closed', icon: <XCircle className="h-4 w-4 mr-2" /> }
];

// Rating options
const ratingOptions = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' }
];

export default function FeedbackManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  
  // Response state
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    const userWithRole = user as UserWithRole;
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && userWithRole?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Check for appId in query params
  useEffect(() => {
    const appId = searchParams.get('appId');
    if (appId) {
      setSelectedApp(appId);
    }
  }, [searchParams]);
  
  // Fetch feedback data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchFeedbackData();
      fetchApps();
    }
  }, [isAuthenticated, authLoading]);
  
  // Apply filters
  useEffect(() => {
    if (feedback.length > 0) {
      applyFilters();
    }
  }, [feedback, searchQuery, selectedApp, selectedCategory, selectedStatus, selectedRating, sortField, sortDirection]);
  
  const fetchFeedbackData = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (selectedApp !== 'all') queryParams.append('appId', selectedApp);
      if (selectedCategory !== 'all') queryParams.append('category', selectedCategory);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);
      if (selectedRating !== 'all') queryParams.append('rating', selectedRating);
      
      // Fetch feedback data from API
      const response = await fetch(`/api/feedback?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback data');
      }
      
      const data = await response.json();
      
      // Set feedback data
      setFeedback(data.feedback);
      setFilteredFeedback(data.feedback);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching feedback data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchApps = async () => {
    try {
      // Fetch apps from API
      const response = await fetch('/api/apps');
      
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      
      const data = await response.json();
      
      // Set apps data
      setApps(data.apps || []);
      
    } catch (err: any) {
      console.error('Error fetching apps:', err);
    }
  };
  
  const applyFilters = () => {
    let result = [...feedback];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.content.toLowerCase().includes(query) ||
          item.userName.toLowerCase().includes(query) ||
          item.userEmail.toLowerCase().includes(query)
      );
    }
    
    // Filter by app
    if (selectedApp !== 'all') {
      result = result.filter(item => item.appId === selectedApp);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter(item => item.status === selectedStatus);
    }
    
    // Filter by rating
    if (selectedRating !== 'all') {
      result = result.filter(item => item.rating === parseInt(selectedRating, 10));
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle dates
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle ratings (numbers)
      if (sortField === 'rating') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Compare values based on sort direction
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Update total count for pagination
    setTotalItems(result.length);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResult = result.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredFeedback(paginatedResult);
  };
  
  const handleSortChange = (field: string) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    applyFilters();
  };
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to first page when changing items per page
    applyFilters();
  };
  
  const toggleExpandFeedback = (id: string) => {
    if (expandedFeedbackId === id) {
      setExpandedFeedbackId(null);
    } else {
      setExpandedFeedbackId(id);
      // Initialize response text if not already set
      if (!responseText[id]) {
        const feedbackItem = feedback.find(item => item.id === id);
        setResponseText({
          ...responseText,
          [id]: feedbackItem?.developerResponse || ''
        });
      }
    }
  };
  
  const handleResponseChange = (id: string, value: string) => {
    setResponseText({
      ...responseText,
      [id]: value
    });
  };
  
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      // Send status update to API
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: id,
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update feedback status');
      }
      
      const data = await response.json();
      
      // Update feedback in state
      const updatedFeedback = feedback.map(item => {
        if (item.id === id) {
          return data.feedback;
        }
        return item;
      });
      
      setFeedback(updatedFeedback);
      
      // Apply filters to update filtered feedback
      applyFilters();
      
      // Show success message
      alert(`Feedback status updated to ${newStatus}`);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating feedback status');
    }
  };
  
  const handleSubmitResponse = async (id: string) => {
    try {
      // Send response to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: id,
          response: responseText[id]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      const data = await response.json();
      
      // Update feedback in state
      const updatedFeedback = feedback.map(item => {
        if (item.id === id) {
          return data.feedback;
        }
        return item;
      });
      
      setFeedback(updatedFeedback);
      setExpandedFeedbackId(null);
      
      // Apply filters to update filtered feedback
      applyFilters();
      
      // Show success message
      alert('Response submitted successfully');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your response');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'improvement':
        return <ThumbsUp className="h-4 w-4 text-blue-500" />;
      case 'praise':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case 'planned':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            Planned
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'bug':
        return 'Bug';
      case 'feature_request':
        return 'Feature Request';
      case 'improvement':
        return 'Improvement';
      case 'praise':
        return 'Praise';
      default:
        return category;
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Feedback Management</h1>
            <p className="text-gray-600 mt-1">
              View and respond to user feedback for your apps
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search feedback..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* App Filter */}
              <div className="w-full md:w-48">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                >
                  <option value="all">All Apps</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Category Filter */}
              <div className="w-full md:w-48">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="w-full md:w-48">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Rating Filter */}
              <div className="w-full md:w-36">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                >
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Sorting Options */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm font-medium text-gray-700">Sort by:</div>
              <button 
                onClick={() => handleSortChange('createdAt')}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'createdAt' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Date
                {sortField === 'createdAt' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button 
                onClick={() => handleSortChange('rating')}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'rating' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rating
                {sortField === 'rating' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button 
                onClick={() => handleSortChange('status')}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'status' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
              <button 
                onClick={() => handleSortChange('updatedAt')}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortField === 'updatedAt' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Updated
                {sortField === 'updatedAt' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Feedback List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No feedback found matching your filters.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredFeedback.map(item => (
                  <li key={item.id} className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                              {item.userName.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{item.userName}</h3>
                            <p className="text-xs text-gray-500">{item.userEmail}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < item.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill={i < item.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-xs text-gray-500">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 flex flex-wrap items-center space-x-2">
                          <div className="flex items-center space-x-1 mr-2">
                            {getCategoryIcon(item.category)}
                            <span className="text-xs text-gray-600">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>
                          {getStatusBadge(item.status)}
                          <span className="text-xs text-gray-500">
                            App: {item.appName}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                        {item.content}
                      </div>
                      
                      {/* Developer Response (if any) */}
                      {item.developerResponse && (
                        <div className="ml-8 bg-indigo-50 p-4 rounded-md">
                          <p className="text-xs font-medium text-indigo-700 mb-1">Your Response:</p>
                          <p className="text-sm text-gray-700">{item.developerResponse}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Responded on {formatDate(item.updatedAt)}
                          </p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => toggleExpandFeedback(item.id)}
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {expandedFeedbackId === item.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Response
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              {item.developerResponse ? 'Edit Response' : 'Respond'}
                            </>
                          )}
                        </button>
                        
                        <div className="flex space-x-2">
                          <select
                            className="text-xs border border-gray-300 rounded-md px-2 py-1"
                            value={item.status}
                            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="planned">Planned</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Response Form */}
                      {expandedFeedbackId === item.id && (
                        <div className="mt-4 border border-gray-200 rounded-md p-4">
                          <h4 className="text-sm font-medium mb-2">Your Response</h4>
                          <textarea
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Type your response here..."
                            value={responseText[item.id] || ''}
                            onChange={(e) => handleResponseChange(item.id, e.target.value)}
                          ></textarea>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => handleSubmitResponse(item.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              disabled={!responseText[item.id]}
                            >
                              Submit Response
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Pagination */}
          {filteredFeedback.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <span className="text-sm text-gray-700 mr-2">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </span>
                <select
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, index) => {
                  // Only show a few page numbers around the current page
                  if (
                    index === 0 ||
                    index === Math.ceil(totalItems / itemsPerPage) - 1 ||
                    (index >= currentPage - 2 && index <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                          currentPage === index + 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  }
                  
                  // Show ellipsis for skipped pages
                  if (
                    (index === 1 && currentPage > 3) ||
                    (index === Math.ceil(totalItems / itemsPerPage) - 2 && currentPage < Math.ceil(totalItems / itemsPerPage) - 3)
                  ) {
                    return <span key={index} className="px-2">...</span>;
                  }
                  
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === Math.ceil(totalItems / itemsPerPage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}