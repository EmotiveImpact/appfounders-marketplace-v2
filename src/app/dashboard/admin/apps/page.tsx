'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Eye,
  CheckSquare,
  XSquare,
  Clock
} from 'lucide-react';

export default function AdminAppsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    // Check if user is admin
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push(`/dashboard/${user?.role || ''}`);
      return;
    }

    // Fetch apps data
    const fetchApps = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockApps = [
            { id: 'a1', name: 'Task Manager Pro', developer: 'John Doe', developerEmail: 'john@example.com', category: 'Productivity', price: 4.99, status: 'pending', submittedAt: '2025-03-01', updatedAt: '2025-03-01' },
            { id: 'a2', name: 'Budget Tracker', developer: 'Robert Johnson', developerEmail: 'robert@example.com', category: 'Finance', price: 2.99, status: 'pending', submittedAt: '2025-03-02', updatedAt: '2025-03-02' },
            { id: 'a3', name: 'Fitness Coach', developer: 'Michael Wilson', developerEmail: 'michael@example.com', category: 'Health', price: 5.99, status: 'pending', submittedAt: '2025-03-03', updatedAt: '2025-03-03' },
            { id: 'a4', name: 'Recipe Finder', developer: 'Sarah Brown', developerEmail: 'sarah@example.com', category: 'Food', price: 0, status: 'pending', submittedAt: '2025-03-04', updatedAt: '2025-03-04' },
            { id: 'a5', name: 'Weather Forecast', developer: 'Emily Davis', developerEmail: 'emily@example.com', category: 'Weather', price: 1.99, status: 'approved', submittedAt: '2025-02-25', updatedAt: '2025-02-27' },
            { id: 'a6', name: 'Language Translator', developer: 'David Miller', developerEmail: 'david@example.com', category: 'Education', price: 3.99, status: 'approved', submittedAt: '2025-02-26', updatedAt: '2025-02-28' },
            { id: 'a7', name: 'Meditation Guide', developer: 'Lisa Taylor', developerEmail: 'lisa@example.com', category: 'Health', price: 4.99, status: 'rejected', submittedAt: '2025-02-20', updatedAt: '2025-02-22', rejectionReason: 'Content guidelines violation' },
            { id: 'a8', name: 'Stock Tracker', developer: 'James Anderson', developerEmail: 'james@example.com', category: 'Finance', price: 9.99, status: 'approved', submittedAt: '2025-02-15', updatedAt: '2025-02-18' },
            { id: 'a9', name: 'Travel Planner', developer: 'Jennifer Thomas', developerEmail: 'jennifer@example.com', category: 'Travel', price: 6.99, status: 'rejected', submittedAt: '2025-02-10', updatedAt: '2025-02-12', rejectionReason: 'Incomplete information' },
            { id: 'a10', name: 'Note Taking App', developer: 'John Doe', developerEmail: 'john@example.com', category: 'Productivity', price: 2.99, status: 'approved', submittedAt: '2025-02-05', updatedAt: '2025-02-07' },
          ];
          setApps(mockApps);
          setFilteredApps(mockApps);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching apps:', error);
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [authLoading, isAuthenticated, router, user]);

  // Apply filters and search
  useEffect(() => {
    let result = [...apps];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((app: any) => app.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((app: any) => app.category === categoryFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (app: any) => 
          app.name.toLowerCase().includes(search) || 
          app.developer.toLowerCase().includes(search)
      );
    }
    
    setFilteredApps(result);
  }, [apps, statusFilter, categoryFilter, searchTerm]);

  // Get unique categories for filter
  const categories = [...new Set(apps.map((app: any) => app.category))];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  // Handle app approval
  const openApprovalModal = (app: any) => {
    setSelectedApp(app);
    setShowApprovalModal(true);
  };

  const handleApprove = () => {
    // In a real app, this would be an API call
    setApps(apps.map((app: any) => 
      app.id === selectedApp.id 
        ? { ...app, status: 'approved', updatedAt: new Date().toISOString() } 
        : app
    ));
    setShowApprovalModal(false);
    setSelectedApp(null);
  };

  // Handle app rejection
  const openRejectModal = (app: any) => {
    setSelectedApp(app);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    
    // In a real app, this would be an API call
    setApps(apps.map((app: any) => 
      app.id === selectedApp.id 
        ? { 
            ...app, 
            status: 'rejected', 
            updatedAt: new Date().toISOString(),
            rejectionReason
          } 
        : app
    ));
    setShowRejectModal(false);
    setSelectedApp(null);
    setRejectionReason('');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading apps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">App Management</h1>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Apps Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">App</th>
                  <th className="px-6 py-3">Developer</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApps.length > 0 ? (
                  filteredApps.map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium">{app.name}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div>{app.developer}</div>
                          <div className="text-sm text-gray-500">{app.developerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{app.category}</td>
                      <td className="px-6 py-4">{formatPrice(app.price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {app.status === 'approved' && (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          {app.status === 'rejected' && (
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          {app.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          <span className="capitalize">{app.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/dashboard/admin/apps/${app.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => openApprovalModal(app)}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <CheckSquare className="h-5 w-5" />
                              </button>
                              
                              <button 
                                onClick={() => openRejectModal(app)}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <XSquare className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No apps found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Approval Confirmation Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Approval</h3>
              <p className="mb-6">
                Are you sure you want to approve <span className="font-semibold">{selectedApp?.name}</span>? This will make the app available to all users.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Reject App</h3>
              <p className="mb-4">
                Please provide a reason for rejecting <span className="font-semibold">{selectedApp?.name}</span>:
              </p>
              <textarea
                className="w-full border rounded-lg p-3 mb-4 min-h-[100px]"
                placeholder="Rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={!rejectionReason.trim()}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
