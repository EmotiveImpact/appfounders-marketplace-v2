'use client';

import { useState, useEffect } from 'react';
import { useTesterDashboard } from '@/hooks/useTesterDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const RADIAN = Math.PI / 180;

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function TestAnalyticsPage() {
  const { fetchTestCaseStatistics } = useTesterDashboard();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        const stats = await fetchTestCaseStatistics(timeRange);
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to load test statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [fetchTestCaseStatistics, timeRange]);

  if (loading) return <LoadingSpinner />;
  if (!statistics) return <div>Failed to load analytics data</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Analytics Dashboard</h1>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-4 py-2 rounded ${timeRange === '7days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-4 py-2 rounded ${timeRange === '30days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('90days')}
            className={`px-4 py-2 rounded ${timeRange === '90days' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Test Execution Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Execution Results</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statistics.executionResults}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {statistics.executionResults.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bug Severity Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Bug Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={statistics.bugSeverity}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test Execution Trends */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Execution Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={statistics.executionTrends}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="passed" stroke="#00C49F" name="Passed" />
            <Line type="monotone" dataKey="failed" stroke="#FF8042" name="Failed" />
            <Line type="monotone" dataKey="blocked" stroke="#FFBB28" name="Blocked" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Coverage by Project */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Coverage by Project</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={statistics.coverageByProject}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="covered" stackId="a" fill="#00C49F" name="Covered" />
              <Bar dataKey="uncovered" stackId="a" fill="#FF8042" name="Uncovered" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test Execution Time by App */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Avg. Execution Time by App</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={statistics.executionTimeByApp}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="time" fill="#8884d8" name="Time (minutes)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
