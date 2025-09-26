'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Calendar,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface PredictiveAnalyticsProps {
  userRole: 'admin' | 'developer';
  developerId?: string;
  className?: string;
}

export function PredictiveAnalytics({ userRole, developerId, className }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState('30');
  const [selectedModel, setSelectedModel] = useState('all');

  useEffect(() => {
    loadPredictions();
  }, [horizon, selectedModel, developerId]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        horizon,
        model: selectedModel,
      });

      if (developerId) {
        params.set('developer_id', developerId);
      }

      const response = await fetch(`/api/analytics/predictive?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load predictions');
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'growing':
      case 'strong_growth':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const renderSalesForecast = () => {
    if (!predictions?.sales_forecast) return null;

    const { predictions: forecast, model_info, historical_data } = predictions.sales_forecast;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Model Info */}
            <div className="flex items-center justify-between text-sm">
              <span>Model: {model_info?.type}</span>
              <Badge variant={model_info?.r_squared > 0.7 ? 'default' : 'secondary'}>
                R² = {model_info?.r_squared?.toFixed(3)}
              </Badge>
            </div>

            {/* Forecast Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[...historical_data?.slice(-14) || [], ...forecast?.slice(0, 14) || []]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'predicted_sales' ? `${value} (predicted)` : value,
                    name === 'predicted_sales' ? 'Sales' : 'Historical Sales'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales_count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="historical_sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_sales" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="predicted_sales"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(forecast?.reduce((sum: number, d: any) => sum + d.predicted_sales, 0) || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Predicted Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(forecast?.reduce((sum: number, d: any) => sum + d.predicted_revenue, 0) || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Predicted Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {getTrendIcon(model_info?.trend_slope > 0 ? 'increasing' : 'decreasing')}
                </p>
                <p className="text-sm text-muted-foreground">Trend</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getConfidenceColor(forecast?.[0]?.confidence || 0)}`}>
                  {getConfidenceLabel(forecast?.[0]?.confidence || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Confidence</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUserBehavior = () => {
    if (!predictions?.user_behavior) return null;

    const { predictions: behavior, segments } = predictions.user_behavior;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Behavior Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* User Segments */}
            <div>
              <h4 className="font-medium mb-3">User Segments</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {segments?.map((segment: any) => (
                  <div key={segment.name} className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold">{segment.count}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {segment.name.replace('_', ' ')}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {segment.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Predictions */}
            <div>
              <h4 className="font-medium mb-3">Expected Purchases</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {behavior?.expected_purchases?.high_value || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">High Value Users</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-lg font-bold text-blue-600">
                    {behavior?.expected_purchases?.regular || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Regular Users</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-lg font-bold text-purple-600">
                    {behavior?.expected_purchases?.new || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">New Users</p>
                </div>
              </div>
            </div>

            {/* Churn Risk */}
            {behavior?.churn_risk && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{behavior.churn_risk.users_at_risk}</strong> users are at risk of churning. 
                  Predicted churn: <strong>{behavior.churn_risk.predicted_churn}</strong> users.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMarketTrends = () => {
    if (!predictions?.market_trends) return null;

    const { category_trends, platform_trends, market_insights } = predictions.market_trends;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Category Trends */}
            <div>
              <h4 className="font-medium mb-3">Category Growth</h4>
              <div className="space-y-2">
                {category_trends?.slice(0, 5).map((category: any) => (
                  <div key={category.category} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(category.trend)}
                      <span className={`font-medium ${
                        category.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.growth_rate > 0 ? '+' : ''}{category.growth_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insights */}
            {market_insights && market_insights.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Market Insights</h4>
                <div className="space-y-2">
                  {market_insights.map((insight: any, index: number) => (
                    <Alert key={index}>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>{insight.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDeveloperPredictions = () => {
    if (userRole !== 'developer') return null;

    return (
      <div className="space-y-6">
        {/* Revenue Forecast */}
        {predictions?.revenue_forecast && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(predictions.revenue_forecast.total_predicted_revenue || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Predicted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(predictions.revenue_forecast.current_weekly_average || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Weekly Average</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {getTrendIcon(predictions.revenue_forecast.trend_direction)}
                  </p>
                  <p className="text-sm text-muted-foreground">Trend</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {predictions.revenue_forecast.predictions?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Weeks</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={predictions.revenue_forecast.predictions || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="predicted_revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* App Performance */}
        {predictions?.app_performance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                App Performance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.app_performance.slice(0, 5).map((app: any) => (
                  <div key={app.app_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{app.app_name}</h4>
                      <Badge variant={
                        app.predicted_trend === 'strong_growth' ? 'default' :
                        app.predicted_trend === 'moderate_growth' ? 'secondary' : 'outline'
                      }>
                        {app.predicted_trend.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Performance Score</span>
                        <span className="font-medium">{(app.current_performance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${app.current_performance * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {app.recommendations && app.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Recommendations:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {app.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and forecasting for the next {horizon} days
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={horizon} onValueChange={setHorizon}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadPredictions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Predictions */}
      <div className="space-y-6">
        {renderSalesForecast()}
        
        {userRole === 'admin' && (
          <>
            {renderUserBehavior()}
            {renderMarketTrends()}
          </>
        )}
        
        {renderDeveloperPredictions()}
      </div>
    </div>
  );
}
