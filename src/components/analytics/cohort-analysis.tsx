'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  RefreshCw,
  Info,
  Target,
  Zap,
  Heart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { toast } from 'sonner';

interface CohortAnalysisProps {
  userRole: 'admin' | 'developer';
  developerId?: string;
  className?: string;
}

export function CohortAnalysis({ userRole, developerId, className }: CohortAnalysisProps) {
  const [cohortData, setCohortData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState('retention');
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    loadCohortData();
  }, [analysisType, period, developerId]);

  const loadCohortData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        type: analysisType,
        period,
      });

      if (developerId) {
        params.set('developer_id', developerId);
      }

      const response = await fetch(`/api/analytics/cohorts?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setCohortData(data.cohort_analysis);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load cohort data');
      }
    } catch (error) {
      console.error('Error loading cohort data:', error);
      toast.error('Failed to load cohort data');
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return '#22c55e'; // Green
    if (rate >= 60) return '#eab308'; // Yellow
    if (rate >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const renderRetentionHeatmap = () => {
    if (!cohortData?.data?.cohort_table) return null;

    const { cohort_table, periods } = cohortData.data;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Retention Cohort Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Cohort</th>
                  <th className="text-left p-2 border-b">Size</th>
                  {periods.map((period: number) => (
                    <th key={period} className="text-center p-2 border-b">
                      {period === 0 ? 'P0' : `P${period}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohort_table.map((cohort: any) => (
                  <tr key={cohort.cohort_period}>
                    <td className="p-2 border-b font-medium">
                      {new Date(cohort.cohort_period).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short' 
                      })}
                    </td>
                    <td className="p-2 border-b">{cohort.cohort_size}</td>
                    {periods.map((period: number) => {
                      const data = cohort.retention_rates[period];
                      if (!data) return <td key={period} className="p-2 border-b text-center">-</td>;
                      
                      return (
                        <td 
                          key={period} 
                          className="p-2 border-b text-center"
                          style={{ 
                            backgroundColor: `${getRetentionColor(data.retention_rate)}20`,
                            color: getRetentionColor(data.retention_rate)
                          }}
                        >
                          <div className="font-medium">{formatPercentage(data.retention_rate)}</div>
                          <div className="text-xs opacity-75">({data.users})</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Average Retention Chart */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Average Retention Across All Cohorts</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={periods.map((p: any) => ({
                period: p === 0 ? 'P0' : `P${p}`,
                retention: cohortData.data.average_retention[p] || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Retention Rate']} />
                <Line type="monotone" dataKey="retention" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRevenueCohorts = () => {
    if (!cohortData?.data?.revenue_cohorts) return null;

    const { revenue_cohorts, summary } = cohortData.data;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cohorts</p>
                  <p className="text-2xl font-bold">{summary.total_cohorts}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Cohort</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.avg_revenue_per_cohort || 0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Analysis Period</p>
                  <p className="text-2xl font-bold capitalize">{period}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Cohort Table */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Cohort Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue_cohorts.slice(0, 10).map((cohort: any) => (
                <div key={cohort.cohort_period} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">
                      {new Date(cohort.cohort_period).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </h4>
                    <Badge variant="outline">
                      {cohort.cohort_size} users
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(cohort.periods).map(([periodNum, data]: [string, any]) => (
                      <div key={periodNum} className="text-center p-2 border rounded">
                        <p className="font-medium">Period {periodNum}</p>
                        <p className="text-green-600">{formatCurrency(data.total_revenue)}</p>
                        <p className="text-muted-foreground">{data.purchasing_users} buyers</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLTVAnalysis = () => {
    if (!cohortData?.data?.cohort_ltv) return null;

    const { cohort_ltv, overall_metrics, insights } = cohortData.data;

    return (
      <div className="space-y-6">
        {/* Overall LTV Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average LTV</p>
                  <p className="text-2xl font-bold">{formatCurrency(overall_metrics.avg_ltv || 0)}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Median LTV</p>
                  <p className="text-2xl font-bold">{formatCurrency(overall_metrics.median_ltv || 0)}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">90th Percentile</p>
                  <p className="text-2xl font-bold">{formatCurrency(overall_metrics.p90_ltv || 0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max LTV</p>
                  <p className="text-2xl font-bold">{formatCurrency(overall_metrics.max_ltv || 0)}</p>
                </div>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LTV Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>LTV Trend by Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohort_ltv}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="cohort_month" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Average LTV']}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
                <Line type="monotone" dataKey="avg_ltv" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="median_ltv" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                LTV Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight: any, index: number) => (
                  <Alert key={index}>
                    <div className="flex items-start gap-2">
                      {insight.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />}
                      {insight.type === 'warning' && <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />}
                      {insight.type === 'opportunity' && <Target className="w-4 h-4 text-blue-600 mt-0.5" />}
                      <div>
                        <AlertDescription>
                          <strong>{insight.message}</strong>
                          {insight.value && <span className="ml-2 text-muted-foreground">({insight.value})</span>}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderEngagementCohorts = () => {
    if (!cohortData?.data?.engagement_cohorts) return null;

    const { engagement_cohorts, summary } = cohortData.data;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Engagement Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.avg_engagement_rate || 0)}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Engagement Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.avg_high_engagement_rate || 0)}</p>
                </div>
                <Heart className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cohorts</p>
                  <p className="text-2xl font-bold">{summary.total_cohorts}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rates by Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagement_cohorts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="cohort_period" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}%`, 
                    name === 'engagement_rate' ? 'Engagement Rate' : 'High Engagement Rate'
                  ]}
                />
                <Bar dataKey="engagement_rate" fill="#8884d8" />
                <Bar dataKey="high_engagement_rate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Cohort Data */}
        <Card>
          <CardHeader>
            <CardTitle>Cohort Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cohort</th>
                    <th className="text-right p-2">Size</th>
                    <th className="text-right p-2">Avg Active Days</th>
                    <th className="text-right p-2">Avg Actions</th>
                    <th className="text-right p-2">Engagement Rate</th>
                    <th className="text-right p-2">High Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {engagement_cohorts.map((cohort: any) => (
                    <tr key={cohort.cohort_period} className="border-b">
                      <td className="p-2 font-medium">
                        {new Date(cohort.cohort_period).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short' 
                        })}
                      </td>
                      <td className="p-2 text-right">{cohort.cohort_size}</td>
                      <td className="p-2 text-right">{cohort.avg_active_days?.toFixed(1)}</td>
                      <td className="p-2 text-right">{cohort.avg_total_actions?.toFixed(0)}</td>
                      <td className="p-2 text-right">{formatPercentage(cohort.engagement_rate)}</td>
                      <td className="p-2 text-right">{formatPercentage(cohort.high_engagement_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
          <h1 className="text-2xl font-bold">Cohort Analysis</h1>
          <p className="text-muted-foreground">
            Analyze user behavior and lifetime value across different cohorts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadCohortData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Analysis Tabs */}
      <Tabs value={analysisType} onValueChange={setAnalysisType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="mt-6">
          {renderRetentionHeatmap()}
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          {renderRevenueCohorts()}
        </TabsContent>

        <TabsContent value="ltv" className="mt-6">
          {renderLTVAnalysis()}
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          {renderEngagementCohorts()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
