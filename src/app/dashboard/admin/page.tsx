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

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface PendingApp {
  id: string;
  name: string;
  developer: string;
  submittedAt: string;
}

interface DashboardStats {
  totalUsers: number;
  totalApps: number;
  pendingApprovals: number;
  totalRevenue: number;
  recentUsers: RecentUser[];
  pendingApps: PendingApp[];
}
import { 
  Users, 
  Package, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalApps: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    recentUsers: [],
    pendingApps: []
  });

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

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          setStats({
            totalUsers: 1245,
            totalApps: 87,
            pendingApprovals: 12,
            totalRevenue: 158750,
            recentUsers: [
              { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'developer', joinedAt: '2025-02-28' },
              { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', role: 'tester', joinedAt: '2025-03-01' },
              { id: 'u3', name: 'Robert Johnson', email: 'robert@example.com', role: 'developer', joinedAt: '2025-03-02' },
              { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', role: 'tester', joinedAt: '2025-03-03' },
              { id: 'u5', name: 'Michael Wilson', email: 'michael@example.com', role: 'developer', joinedAt: '2025-03-04' }
            ],
            pendingApps: [
              { id: 'a1', name: 'Task Manager Pro', developer: 'John Doe', submittedAt: '2025-03-01', status: 'pending' },
              { id: 'a2', name: 'Budget Tracker', developer: 'Robert Johnson', submittedAt: '2025-03-02', status: 'pending' },
              { id: 'a3', name: 'Fitness Coach', developer: 'Michael Wilson', submittedAt: '2025-03-03', status: 'pending' },
              { id: 'a4', name: 'Recipe Finder', developer: 'Sarah Brown', submittedAt: '2025-03-04', status: 'pending' }
            ]
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading, isAuthenticated, router, user]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-2 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Apps</p>
                <p className="text-2xl font-bold">{stats.totalApps.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 mr-4">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mr-4">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Users and Pending Apps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Recent Users</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentUsers.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">
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
                        <td className="px-4 py-3 text-sm">{formatDate(user.joinedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => router.push('/dashboard/admin/users')}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All Users
                </button>
              </div>
            </div>
          </div>
          
          {/* Pending Apps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Pending App Approvals</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">App Name</th>
                      <th className="px-4 py-3">Developer</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.pendingApps.map((app: any) => (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">{app.name}</td>
                        <td className="px-4 py-3 text-sm">{app.developer}</td>
                        <td className="px-4 py-3 text-sm">{formatDate(app.submittedAt)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => router.push('/dashboard/admin/apps')}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All Apps
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/admin/users/create')}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm">Add New User</span>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/admin/apps')}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <span className="text-sm">Review Apps</span>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/admin/analytics')}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm">View Analytics</span>
            </button>
            
            <button 
              onClick={() => router.push('/dashboard/admin/settings')}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col items-center justify-center gap-2"
            >
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <span className="text-sm">System Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
