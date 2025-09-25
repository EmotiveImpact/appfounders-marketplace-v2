'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ArrowUpRight, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp,
  Download,
  Calendar,
  Filter,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DeveloperAnalyticsDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [timeframe, setTimeframe] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch analytics data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated, authLoading, timeframe]);
  
  // Function to ensure data exists with fallbacks
  const ensureDataStructure = (data: any) => {
    if (!data) return {
      overview: {
        totalUsers: 0,
        totalRevenue: 0,
        averageRating: 0,
        conversionRate: 0,
        activeUsers: 0
      },
      platformDistribution: [],
      regionData: [],
      monthlyRevenue: [],
      appPerformance: [],
      dailyVisitors: []
    };
    
    return {
      overview: data.overview || {
        totalUsers: 0,
        totalRevenue: 0,
        averageRating: 0,
        conversionRate: 0,
        activeUsers: 0
      },
      platformDistribution: data.platformDistribution || [],
      regionData: data.regionData || [],
      monthlyRevenue: data.monthlyRevenue || [],
      appPerformance: data.appPerformance || [],
      dailyVisitors: data.dailyVisitors || []
    };
  };
  
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);
      
      // Fetch analytics data from API
      const response = await fetch(`/api/analytics?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      // Ensure data structure is consistent
      const processedData = ensureDataStructure(data.data);
      setAnalyticsData(processedData);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(e.target.value);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Function to handle data export
  const handleExportData = () => {
    if (!analyticsData) return;
    
    // Create CSV content
    const csvContent = [
      // Headers
      ['Metric', 'Value'],
      ['Total Users', analyticsData.overview?.totalUsers || 0],
      ['Total Revenue', analyticsData.overview?.totalRevenue || 0],
      ['Average Rating', analyticsData.overview?.averageRating || 0],
      ['Conversion Rate', analyticsData.overview?.conversionRate || 0],
      ['Active Users', analyticsData.overview?.activeUsers || 0],
    ].map(row => row.join(',')).join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-lg">Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-red-600">Error</h2>
              <p className="mt-2">{error}</p>
              <button 
                onClick={fetchAnalyticsData}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-600">No analytics data available.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive analytics for all your apps
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={timeframe}
                  onChange={handleTimeframeChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="1year">Last year</option>
                </select>
              </div>
              
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
          
          {/* Overview metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <h3 className="text-2xl font-bold">{analyticsData.overview?.totalUsers?.toLocaleString() || '0'}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>12% increase</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(analyticsData.overview?.totalRevenue || 0)}</h3>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>8.5% increase</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Rating</p>
                  <h3 className="text-2xl font-bold">{(analyticsData.overview?.averageRating || 0).toFixed(1)}</h3>
                </div>
                <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>0.2 increase</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <h3 className="text-2xl font-bold">{analyticsData.overview?.conversionRate || 0}%</h3>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>0.5% increase</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <h3 className="text-2xl font-bold">{analyticsData.overview?.activeUsers?.toLocaleString() || '0'}</h3>
                </div>
                <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>5% increase</span>
              </div>
            </div>
          </div>
          
          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Visitors Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Visitors</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.dailyVisitors || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip 
                      formatter={(value: any) => [`${value} visitors`, 'Visitors']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorVisitors)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={analyticsData.monthlyRevenue || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`$${value}`, 'Revenue']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Platform Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.platformDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(analyticsData.platformDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Regional Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.regionData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(analyticsData.regionData || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* App Performance Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">App Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      App Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(analyticsData.appPerformance || []).map((app: any, index: number) => (
                    <tr key={app.appId || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{app.users.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatCurrency(app.revenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-500">{app.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/dashboard/developer/analytics/app/${app.appId}`} className="text-indigo-600 hover:text-indigo-900">
                          View Details <ArrowRight className="h-4 w-4 inline ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/developer/sales"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Sales Dashboard</h3>
                  <p className="text-sm text-gray-500">Detailed sales and revenue analytics</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            
            <Link
              href="/dashboard/developer/feedback/analytics"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Feedback Analytics</h3>
                  <p className="text-sm text-gray-500">Analyze user feedback and ratings</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            
            <Link
              href="/dashboard/developer/apps"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">App Management</h3>
                  <p className="text-sm text-gray-500">Manage your apps and settings</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}