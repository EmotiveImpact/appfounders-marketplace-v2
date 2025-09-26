'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeAnalytics, useRealtimeNotifications } from '@/hooks/use-websocket';
import { 
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  Eye,
  Download,
  Star,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RealTimeDashboardProps {
  userRole: 'admin' | 'developer' | 'user';
  className?: string;
}

export function RealTimeDashboard({ userRole, className }: RealTimeDashboardProps) {
  const [timeframe, setTimeframe] = useState('24h');
  const { analytics, metrics, loading, connected, refresh } = useRealtimeAnalytics(timeframe);
  const { notifications, clearNotifications } = useRealtimeNotifications();

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (analytics || metrics) {
      setLastUpdate(new Date());
    }
  }, [analytics, metrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'users': return Users;
      case 'revenue': return DollarSign;
      case 'purchases': return ShoppingCart;
      case 'activity': return Activity;
      default: return TrendingUp;
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdminDashboard = () => {
    if (!analytics?.platform) return null;

    const { platform, revenue, users, apps } = analytics;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Users"
            value={formatNumber(platform.totals?.total_testers + platform.totals?.total_developers || 0)}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(revenue?.timeline?.reduce((sum: number, item: any) => sum + (item.total_revenue || 0), 0) || 0)}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Total Apps"
            value={formatNumber(platform.totals?.total_apps || 0)}
            icon={ShoppingCart}
            color="purple"
          />
          <MetricCard
            title="Total Purchases"
            value={formatNumber(platform.totals?.total_purchases || 0)}
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenue?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time_bucket" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={users?.activity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time_bucket" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="active_users" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Apps */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue?.top_apps?.slice(0, 5).map((app: any, index: number) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground">{app.sales_count} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(app.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDeveloperDashboard = () => {
    if (!analytics?.developer) return null;

    const { developer, apps, revenue } = analytics;

    return (
      <div className="space-y-6">
        {/* Developer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Apps"
            value={formatNumber(developer.overview?.total_apps || 0)}
            icon={ShoppingCart}
            color="blue"
          />
          <MetricCard
            title="Total Sales"
            value={formatNumber(developer.overview?.total_sales || 0)}
            icon={Activity}
            color="green"
          />
          <MetricCard
            title="Total Earnings"
            value={formatCurrency(developer.overview?.total_earnings || 0)}
            icon={DollarSign}
            color="purple"
          />
          <MetricCard
            title="Average Rating"
            value={(developer.overview?.avg_rating || 0).toFixed(1)}
            icon={Star}
            color="orange"
          />
        </div>

        {/* Earnings Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_bucket" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="earnings" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* App Performance */}
        <Card>
          <CardHeader>
            <CardTitle>App Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apps?.slice(0, 5).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{app.recent_sales} recent sales</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {app.rating.toFixed(1)} ({app.rating_count})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(app.recent_earnings || 0)}</p>
                    <Badge variant={app.status === 'approved' ? 'default' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderUserDashboard = () => {
    if (!analytics?.activity) return null;

    const { activity, purchases } = analytics;

    return (
      <div className="space-y-6">
        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Total Purchases"
            value={formatNumber(purchases?.total_purchases || 0)}
            icon={ShoppingCart}
            color="blue"
          />
          <MetricCard
            title="Total Spent"
            value={formatCurrency(purchases?.total_spent || 0)}
            icon={DollarSign}
            color="green"
          />
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="actions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Real-Time Analytics</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span>Disconnected</span>
              </>
            )}
            <span>•</span>
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearNotifications}>
              <Bell className="w-4 h-4 mr-2" />
              {notifications.length}
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Metrics */}
      {metrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.data?.online_users || 0}</p>
                <p className="text-sm text-muted-foreground">Users Online</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.data?.recent_activity?.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Actions (Last Hour)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{connected ? 'Live' : 'Offline'}</p>
                <p className="text-sm text-muted-foreground">Data Stream</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-specific Dashboard */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          {userRole === 'admin' && renderAdminDashboard()}
          {userRole === 'developer' && renderDeveloperDashboard()}
          {userRole === 'user' && renderUserDashboard()}
        </>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.data?.timestamp || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
