'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
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
  Cell
} from 'recharts';
import { 
  Loader2,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';

// Mock data for charts
const monthlyRevenueData = [
  { name: 'Jan', revenue: 1200 },
  { name: 'Feb', revenue: 1900 },
  { name: 'Mar', revenue: 2400 },
  { name: 'Apr', revenue: 1800 },
  { name: 'May', revenue: 2800 },
  { name: 'Jun', revenue: 3500 },
  { name: 'Jul', revenue: 3000 },
  { name: 'Aug', revenue: 3800 },
  { name: 'Sep', revenue: 4200 },
  { name: 'Oct', revenue: 4800 },
  { name: 'Nov', revenue: 5100 },
  { name: 'Dec', revenue: 5800 }
];

const appRevenueData = [
  { name: 'App 1', value: 4500 },
  { name: 'App 2', value: 3200 },
  { name: 'App 3', value: 2100 },
  { name: 'App 4', value: 1800 },
  { name: 'App 5', value: 1200 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const purchasesByPlatformData = [
  { name: 'iOS', purchases: 120 },
  { name: 'Android', purchases: 85 },
  { name: 'Web', purchases: 65 },
  { name: 'Desktop', purchases: 45 }
];

export default function SalesDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('year');
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalCustomers: 0,
    growthRate: 0,
    recentSales: []
  });
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch sales data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchSalesData();
    }
  }, [isAuthenticated, authLoading, timeRange]);
  
  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock data
      setSalesData({
        totalRevenue: 45800,
        totalSales: 320,
        totalCustomers: 285,
        growthRate: 24.5,
        recentSales: [
          { id: 1, customer: 'John Doe', app: 'App 1', amount: 149, date: '2025-03-04' },
          { id: 2, customer: 'Jane Smith', app: 'App 2', amount: 99, date: '2025-03-03' },
          { id: 3, customer: 'Bob Johnson', app: 'App 1', amount: 149, date: '2025-03-02' },
          { id: 4, customer: 'Alice Brown', app: 'App 3', amount: 199, date: '2025-03-01' },
          { id: 5, customer: 'Charlie Wilson', app: 'App 2', amount: 99, date: '2025-02-28' }
        ]
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching sales data');
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
            <h1 className="text-2xl font-bold">Sales Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your app sales and revenue
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Time range filter */}
          <div className="mb-6 flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-3">Time Range:</span>
            <div className="flex space-x-2">
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
                onClick={() => handleTimeRangeChange('quarter')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === 'quarter'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quarter
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
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                  <p className="text-2xl font-bold">{salesData.totalSales}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                  <p className="text-2xl font-bold">{salesData.totalCustomers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Growth Rate</h3>
                  <p className="text-2xl font-bold">{salesData.growthRate}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Monthly Revenue</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyRevenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Revenue by App Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Revenue by App</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appRevenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {appRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Purchases by Platform Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Purchases by Platform</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={purchasesByPlatformData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="purchases" fill="#82ca9d" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Sales Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4">Sales Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRevenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent Sales Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Sales</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-800">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      App
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sale.customer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{sale.app}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(sale.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
