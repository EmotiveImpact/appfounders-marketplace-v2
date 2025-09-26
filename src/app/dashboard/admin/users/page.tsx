'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface UserWithRole {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActive: string;
}
import { 
  Loader2,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    // Check if user is admin
    const userWithRole = user as UserWithRole;
    if (!authLoading && isAuthenticated && userWithRole?.role !== 'admin') {
      router.push(`/dashboard/${userWithRole?.role || ''}`);
      return;
    }

    // Fetch users data
    const fetchUsers = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockUsers = [
            { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'developer', status: 'active', joinedAt: '2025-02-15', lastActive: '2025-03-04' },
            { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', role: 'tester', status: 'active', joinedAt: '2025-02-20', lastActive: '2025-03-05' },
            { id: 'u3', name: 'Robert Johnson', email: 'robert@example.com', role: 'developer', status: 'active', joinedAt: '2025-02-22', lastActive: '2025-03-03' },
            { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', role: 'tester', status: 'inactive', joinedAt: '2025-02-25', lastActive: '2025-02-28' },
            { id: 'u5', name: 'Michael Wilson', email: 'michael@example.com', role: 'developer', status: 'active', joinedAt: '2025-02-27', lastActive: '2025-03-05' },
            { id: 'u6', name: 'Sarah Brown', email: 'sarah@example.com', role: 'developer', status: 'pending', joinedAt: '2025-03-01', lastActive: '2025-03-01' },
            { id: 'u7', name: 'David Miller', email: 'david@example.com', role: 'tester', status: 'active', joinedAt: '2025-03-02', lastActive: '2025-03-04' },
            { id: 'u8', name: 'Lisa Taylor', email: 'lisa@example.com', role: 'developer', status: 'suspended', joinedAt: '2025-02-10', lastActive: '2025-02-20' },
            { id: 'u9', name: 'James Anderson', email: 'james@example.com', role: 'tester', status: 'active', joinedAt: '2025-02-18', lastActive: '2025-03-03' },
            { id: 'u10', name: 'Jennifer Thomas', email: 'jennifer@example.com', role: 'developer', status: 'active', joinedAt: '2025-02-28', lastActive: '2025-03-05' },
            { id: 'u11', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', joinedAt: '2025-01-01', lastActive: '2025-03-05' },
          ];
          setUsers(mockUsers);
          setFilteredUsers(mockUsers);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [authLoading, isAuthenticated, router, user]);

  // Apply filters and search
  useEffect(() => {
    let result = [...users];
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((user: any) => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((user: any) => user.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (user: any) => 
          user.name.toLowerCase().includes(search) || 
          user.email.toLowerCase().includes(search)
      );
    }
    
    setFilteredUsers(result);
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle user deletion
  const confirmDelete = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    // In a real app, this would be an API call
    if (userToDelete) {
      setUsers(users.filter((u: AdminUser) => u.id !== userToDelete.id));
    }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <button
            onClick={() => router.push('/dashboard/admin/users/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            <span>Add User</span>
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="developer">Developer</option>
                  <option value="tester">Tester</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-700 border rounded-lg px-4 py-2 pr-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'developer' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : user.role === 'tester' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {user.status === 'active' && (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          {user.status === 'inactive' && (
                            <XCircle className="h-4 w-4 text-gray-500 mr-1" />
                          )}
                          {user.status === 'pending' && (
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          {user.status === 'suspended' && (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className="capitalize">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(user.joinedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(user.lastActive)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(user)}
                            className="text-red-600 hover:text-red-800"
                            disabled={user.role === 'admin'}
                          >
                            <Trash2 className={`h-5 w-5 ${user.role === 'admin' ? 'opacity-30 cursor-not-allowed' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete the user <span className="font-semibold">{userToDelete?.name}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
