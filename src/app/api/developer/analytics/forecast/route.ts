import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [(session.user as any).id]
    );

    if (userCheck.length === 0 || userCheck[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const forecastPeriod = parseInt(searchParams.get('period') || '90'); // days to forecast
    const appId = searchParams.get('app_id');

    // Build app filter
    let appFilter = '';
    const params = [(session.user as any).id];
    if (appId) {
      appFilter = 'AND p.app_id = $2';
      params.push(appId);
    }

    // Get historical data for the last 180 days (double the forecast period for better accuracy)
    const historicalDays = Math.max(180, forecastPeriod * 2);
    
    const historicalDataQuery = `
      SELECT 
        DATE(p.purchased_at) as date,
        COUNT(*) as daily_sales,
        COALESCE(SUM(p.developer_payout), 0) as daily_revenue,
        COUNT(DISTINCT p.user_id) as unique_customers,
        COALESCE(AVG(p.amount), 0) as average_order_value
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND p.purchased_at >= NOW() - INTERVAL '${historicalDays} days'
      ${appFilter}
      GROUP BY DATE(p.purchased_at)
      ORDER BY date ASC
    `;

    const historicalResult = await neonClient.query(historicalDataQuery, params);

    if (historicalResult.length < 7) {
      return NextResponse.json({
        error: 'Insufficient historical data for forecasting. Need at least 7 days of sales data.',
        available_days: historicalResult.length,
      }, { status: 400 });
    }

    // Calculate trends and patterns
    const historicalData = historicalResult.map(row => ({
      date: row.date,
      sales: parseInt(row.daily_sales),
      revenue: parseInt(row.daily_revenue),
      customers: parseInt(row.unique_customers),
      aov: parseFloat(row.average_order_value),
    }));

    // Simple linear regression for trend analysis
    const { slope: salesSlope, intercept: salesIntercept } = calculateLinearRegression(
      historicalData.map((d, i) => ({ x: i, y: d.sales }))
    );

    const { slope: revenueSlope, intercept: revenueIntercept } = calculateLinearRegression(
      historicalData.map((d, i) => ({ x: i, y: d.revenue }))
    );

    // Calculate moving averages for smoothing
    const salesMA7 = calculateMovingAverage(historicalData.map(d => d.sales), 7);
    const revenueMA7 = calculateMovingAverage(historicalData.map(d => d.revenue), 7);

    // Seasonal analysis (day of week patterns)
    const dayOfWeekPatterns = calculateDayOfWeekPatterns(historicalData);

    // Generate forecast
    const forecast = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < forecastPeriod; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const seasonalMultiplier = dayOfWeekPatterns[dayOfWeek] || 1;

      // Base forecast using linear trend
      const baseSales = Math.max(0, salesSlope * (historicalData.length + i) + salesIntercept);
      const baseRevenue = Math.max(0, revenueSlope * (historicalData.length + i) + revenueIntercept);

      // Apply seasonal adjustment
      const forecastSales = Math.round(baseSales * seasonalMultiplier);
      const forecastRevenue = Math.round(baseRevenue * seasonalMultiplier);

      // Calculate confidence intervals (simplified)
      const salesVariance = calculateVariance(historicalData.map(d => d.sales));
      const revenueVariance = calculateVariance(historicalData.map(d => d.revenue));
      
      const salesStdDev = Math.sqrt(salesVariance);
      const revenueStdDev = Math.sqrt(revenueVariance);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        forecast_sales: forecastSales,
        forecast_revenue: forecastRevenue,
        sales_confidence_lower: Math.max(0, Math.round(forecastSales - salesStdDev)),
        sales_confidence_upper: Math.round(forecastSales + salesStdDev),
        revenue_confidence_lower: Math.max(0, Math.round(forecastRevenue - revenueStdDev)),
        revenue_confidence_upper: Math.round(forecastRevenue + revenueStdDev),
        day_of_week: dayOfWeek,
        seasonal_multiplier: seasonalMultiplier,
      });
    }

    // Calculate forecast summary
    const totalForecastSales = forecast.reduce((sum, day) => sum + day.forecast_sales, 0);
    const totalForecastRevenue = forecast.reduce((sum, day) => sum + day.forecast_revenue, 0);
    const avgDailySales = totalForecastSales / forecastPeriod;
    const avgDailyRevenue = totalForecastRevenue / forecastPeriod;

    // Historical performance for comparison
    const recentPeriodData = historicalData.slice(-forecastPeriod);
    const recentTotalSales = recentPeriodData.reduce((sum, day) => sum + day.sales, 0);
    const recentTotalRevenue = recentPeriodData.reduce((sum, day) => sum + day.revenue, 0);

    // Growth projections
    const projectedGrowth = {
      sales_growth: recentTotalSales > 0 
        ? ((totalForecastSales - recentTotalSales) / recentTotalSales * 100).toFixed(2)
        : 0,
      revenue_growth: recentTotalRevenue > 0 
        ? ((totalForecastRevenue - recentTotalRevenue) / recentTotalRevenue * 100).toFixed(2)
        : 0,
    };

    // Market insights and recommendations
    const insights = generateInsights(historicalData, forecast, dayOfWeekPatterns);

    return NextResponse.json({
      forecast_period: forecastPeriod,
      app_id: appId,
      historical_data_points: historicalData.length,
      forecast: forecast,
      summary: {
        total_forecast_sales: totalForecastSales,
        total_forecast_revenue: totalForecastRevenue,
        avg_daily_sales: Math.round(avgDailySales * 100) / 100,
        avg_daily_revenue: Math.round(avgDailyRevenue),
        projected_growth: projectedGrowth,
      },
      trends: {
        sales_trend: salesSlope > 0 ? 'increasing' : salesSlope < 0 ? 'decreasing' : 'stable',
        revenue_trend: revenueSlope > 0 ? 'increasing' : revenueSlope < 0 ? 'decreasing' : 'stable',
        sales_slope: salesSlope,
        revenue_slope: revenueSlope,
      },
      seasonal_patterns: dayOfWeekPatterns,
      insights: insights,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating revenue forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate revenue forecast' },
      { status: 500 }
    );
  }
}

function calculateLinearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

function calculateMovingAverage(data: number[], window: number): number[] {
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

function calculateDayOfWeekPatterns(data: { date: string; sales: number; revenue: number }[]): number[] {
  const dayTotals = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  data.forEach(day => {
    const dayOfWeek = new Date(day.date).getDay();
    dayTotals[dayOfWeek] += day.sales;
    dayCounts[dayOfWeek]++;
  });

  const dayAverages = dayTotals.map((total, i) => dayCounts[i] > 0 ? total / dayCounts[i] : 0);
  const overallAverage = dayAverages.reduce((sum, avg) => sum + avg, 0) / 7;

  // Return multipliers relative to overall average
  return dayAverages.map(avg => overallAverage > 0 ? avg / overallAverage : 1);
}

function calculateVariance(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / data.length;
}

function generateInsights(
  historical: any[], 
  forecast: any[], 
  dayPatterns: number[]
): string[] {
  const insights = [];

  // Trend insights
  const recentTrend = historical.slice(-14);
  const earlyTrend = historical.slice(0, 14);
  
  if (recentTrend.length > 0 && earlyTrend.length > 0) {
    const recentAvg = recentTrend.reduce((sum, d) => sum + d.revenue, 0) / recentTrend.length;
    const earlyAvg = earlyTrend.reduce((sum, d) => sum + d.revenue, 0) / earlyTrend.length;
    
    if (recentAvg > earlyAvg * 1.1) {
      insights.push('Revenue is trending upward - consider increasing marketing spend');
    } else if (recentAvg < earlyAvg * 0.9) {
      insights.push('Revenue is declining - review app performance and user feedback');
    }
  }

  // Seasonal insights
  const bestDay = dayPatterns.indexOf(Math.max(...dayPatterns));
  const worstDay = dayPatterns.indexOf(Math.min(...dayPatterns));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  insights.push(`${dayNames[bestDay]} is your strongest sales day`);
  insights.push(`Consider promotional campaigns on ${dayNames[worstDay]} to boost weaker performance`);

  // Forecast insights
  const totalForecastRevenue = forecast.reduce((sum, day) => sum + day.forecast_revenue, 0);
  if (totalForecastRevenue > 100000) { // $1000
    insights.push('Strong revenue forecast - consider expanding your app portfolio');
  }

  // Volatility insights
  const revenueVariance = calculateVariance(historical.map(d => d.revenue));
  if (revenueVariance > 50000) { // High variance
    insights.push('Revenue shows high volatility - consider strategies to stabilize income');
  }

  return insights;
}
