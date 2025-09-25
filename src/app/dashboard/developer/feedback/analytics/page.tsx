'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bug,
  Lightbulb,
  ThumbsUp,
  Download
} from 'lucide-react';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

export default function FeedbackAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState('all');
  const [timeRange, setTimeRange] = useState('30days'); // 7days, 30days, 90days, year
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAnalyticsData();
      fetchApps();
    }
  }, [isAuthenticated, authLoading, selectedApp, timeRange]);
  
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (selectedApp !== 'all') queryParams.append('appId', selectedApp);
      queryParams.append('timeframe', timeRange);
      
      // Fetch feedback analytics data from API
      const response = await fetch(`/api/analytics/feedback?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data.data);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching feedback analytics data');
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
  
  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedApp(e.target.value);
  };
  
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  // Prepare chart data
  const getCategoryData = () => {
    if (!analyticsData || !analyticsData.feedbackByCategory) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.feedbackByCategory.map((item: any) => item.category),
      datasets: [
        {
          label: 'Feedback by Category',
          data: analyticsData.feedbackByCategory.map((item: any) => item.count),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getRatingDistributionData = () => {
    if (!analyticsData || !analyticsData.ratingDistribution) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.ratingDistribution.map((item: any) => `${item.rating} Star`),
      datasets: [
        {
          label: 'Rating Distribution',
          data: analyticsData.ratingDistribution.map((item: any) => item.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getFeedbackTrendData = () => {
    if (!analyticsData || !analyticsData.feedbackTrend) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.feedbackTrend.map((item: any) => item.date),
      datasets: [
        {
          label: 'Feedback Count',
          data: analyticsData.feedbackTrend.map((item: any) => item.count),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    };
  };
  
  const getRatingTrendData = () => {
    if (!analyticsData || !analyticsData.ratingTrend) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.ratingTrend.map((item: any) => item.date),
      datasets: [
        {
          label: 'Average Rating',
          data: analyticsData.ratingTrend.map((item: any) => item.rating),
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          tension: 0.1
        }
      ]
    };
  };
  
  const getResponseTimeData = () => {
    if (!analyticsData || !analyticsData.responseTimeAverage) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.responseTimeAverage.map((item: any) => item.date),
      datasets: [
        {
          label: 'Average Response Time (hours)',
          data: analyticsData.responseTimeAverage.map((item: any) => item.hours),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          tension: 0.1
        }
      ]
    };
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-lg">Loading feedback analytics...</span>
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
              <h1 className="text-2xl font-bold">Feedback Analytics</h1>
              <p className="text-gray-600 mt-1">
                Analyze feedback trends and insights for your apps
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <select
                  value={selectedApp}
                  onChange={handleAppChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Apps</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="1year">Last year</option>
                </select>
              </div>
              
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
          
          {!analyticsData ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-600">No feedback data available for the selected criteria.</p>
            </div>
          ) : (
            <>
              {/* Overview metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                      <h3 className="text-xl font-bold">{analyticsData.overview.totalFeedback.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <Star className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Rating</p>
                      <h3 className="text-xl font-bold">{analyticsData.overview.averageRating.toFixed(1)}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Response Rate</p>
                      <h3 className="text-xl font-bold">{analyticsData.overview.responseRate}%</h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
                      <h3 className="text-xl font-bold">{analyticsData.overview.resolutionRate}%</h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Open Issues</p>
                      <h3 className="text-xl font-bold">{analyticsData.overview.openIssues}</h3>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Feedback Trend */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Feedback Over Time</h3>
                  <div className="h-80">
                    <Line 
                      data={getFeedbackTrendData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Rating Trend */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Rating Trend</h3>
                  <div className="h-80">
                    <Line 
                      data={getRatingTrendData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            min: 1,
                            max: 5,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Feedback by Category</h3>
                  <div className="h-80">
                    <Bar 
                      data={getCategoryData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Rating Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-4">Rating Distribution</h3>
                  <div className="h-80">
                    <Pie 
                      data={getRatingDistributionData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Response Time */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h3 className="text-lg font-medium mb-4">Average Response Time</h3>
                <div className="h-80">
                  <Line 
                    data={getResponseTimeData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Hours'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Key Insights */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h3 className="text-lg font-medium mb-4">Key Insights</h3>
                <div className="space-y-4">
                  {analyticsData.overview.averageRating < 3 && (
                    <div className="p-4 border-l-4 border-red-500 bg-red-50">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            Your average rating is below 3.0. Consider addressing common complaints to improve user satisfaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.overview.responseRate < 70 && (
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Your response rate is below 70%. Responding to feedback promptly can improve user engagement.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.overview.resolutionRate > 80 && (
                    <div className="p-4 border-l-4 border-green-500 bg-green-50">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Great job! Your resolution rate is above 80%, indicating effective issue handling.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}