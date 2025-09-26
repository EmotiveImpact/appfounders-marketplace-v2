'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

interface UserWithRole {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Loader2,
  ArrowLeft,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  Filter,
  Download
} from 'lucide-react';

// Mock data for charts
const dailyVisitorsData = [
  { date: '2025-02-25', visitors: 120 },
  { date: '2025-02-26', visitors: 145 },
  { date: '2025-02-27', visitors: 132 },
  { date: '2025-02-28', visitors: 165 },
  { date: '2025-03-01', visitors: 189 },
  { date: '2025-03-02', visitors: 201 },
  { date: '2025-03-03', visitors: 220 },
  { date: '2025-03-04', visitors: 252 }
];

const conversionRateData = [
  { date: '2025-02-25', rate: 2.3 },
  { date: '2025-02-26', rate: 2.5 },
  { date: '2025-02-27', rate: 2.2 },
  { date: '2025-02-28', rate: 2.8 },
  { date: '2025-03-01', rate: 3.1 },
  { date: '2025-03-02', rate: 3.5 },
  { date: '2025-03-03', rate: 3.8 },
  { date: '2025-03-04', rate: 4.2 }
];

const userDemographicsData = [
  { name: '18-24', value: 15 },
  { name: '25-34', value: 35 },
  { name: '35-44', value: 25 },
  { name: '45-54', value: 15 },
  { name: '55+', value: 10 }
];

const platformDistributionData = [
  { name: 'iOS', value: 45 },
  { name: 'Android', value: 35 },
  { name: 'Web', value: 15 },
  { name: 'Desktop', value: 5 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const userRetentionData = [
  { day: '1', retention: 100 },
  { day: '3', retention: 75 },
  { day: '7', retention: 60 },
  { day: '14', retention: 45 },
  { day: '30', retention: 35 },
  { day: '60', retention: 28 },
  { day: '90', retention: 22 }
];

export default function AppAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week');
  const [app, setApp] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    averageRating: 0,
    conversionRate: 0,
    activeUsers: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  });
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    const userWithRole = user as UserWithRole;
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && userWithRole?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch app data and analytics
  useEffect(() => {
    if (isAuthenticated && !authLoading && appId) {
      fetchAppData();
      fetchAppAnalytics();
    }
  }, [isAuthenticated, authLoading, appId, timeRange]);
  
  const fetchAppData = async () => {
    try {
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Set mock data
      setApp({
        id: appId,
        name: 'Super App Pro',
        icon: '/images/app-icon.png',
        description: 'A powerful productivity app for professionals',
        price: 149,
        category: 'Productivity',
        platform: 'iOS, Android',
        status: 'published',
        createdAt: '2025-01-15T12:00:00Z',
        updatedAt: '2025-03-01T15:30:00Z'
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching app data');
    }
  };
  
  const fetchAppAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock data
      setAnalytics({
        totalUsers: 1250,
        totalRevenue: 186250,
        averageRating: 4.7,
        conversionRate: 3.5,
        activeUsers: {
          daily: 520,
          weekly: 850,
          monthly: 1100
        }
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
          <div className="mb-6">
            <Link href="/dashboard/developer/apps" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Apps
            </Link>
            
            {app && (
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 mr-4 overflow-hidden">
                  {app.icon && (
                    <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{app.name} Analytics</h1>
                  <p className="text-gray-600 mt-1">
                    Detailed performance metrics and insights
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Time range filter */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 mr-3">Time Range:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTimeRangeChange('day')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === 'day'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => handleTimeRangeChange('week')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === 'week'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => handleTimeRangeChange('month')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === 'month'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => handleTimeRangeChange('year')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    timeRange === 'year'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                  <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Star className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                  <p className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                  <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-lg font-medium mb-4">Active Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Daily Active Users</h4>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.activeUsers.daily.toLocaleString()}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Weekly Active Users</h4>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.activeUsers.weekly.toLocaleString()}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Monthly Active Users</h4>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.activeUsers.monthly.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Visitors Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Daily Visitors</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyVisitorsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => formatDate(label as string)}
                      formatter={(value) => [value, 'Visitors']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="Visitors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Conversion Rate Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Conversion Rate</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={conversionRateData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => formatDate(label as string)}
                      formatter={(value) => [`${value}%`, 'Conversion Rate']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#82ca9d"
                      name="Conversion Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* User Demographics Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">User Demographics (Age)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDemographicsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userDemographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Users']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Platform Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Platform Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {platformDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Users']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* User Retention Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-lg font-medium mb-4">User Retention</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userRetentionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Retention Rate']} />
                  <Legend />
                  <Bar dataKey="retention" fill="#8884d8" name="Retention Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Feedback Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Feedback</h3>
              <Link href={`/dashboard/developer/feedback?appId=${appId}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                View All Feedback
              </Link>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 5 ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill={i < 5 ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">John D.</span>
                  </div>
                  <span className="text-xs text-gray-500">2025-03-04</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  "Great app! It has significantly improved my productivity. Would love to see more integrations in the future."
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 4 ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill={i < 4 ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">Sarah M.</span>
                  </div>
                  <span className="text-xs text-gray-500">2025-03-03</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  "I use this app daily. The UI is intuitive, but I experienced some lag on my older device."
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 5 ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill={i < 5 ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">Alex W.</span>
                  </div>
                  <span className="text-xs text-gray-500">2025-03-01</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  "Absolutely worth the price! This app has become an essential part of my workflow. The customer support is also excellent."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}