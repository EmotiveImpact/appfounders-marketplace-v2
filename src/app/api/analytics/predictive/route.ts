import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/analytics/predictive - Get predictive analytics
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const model = searchParams.get('model') || 'all';
      const horizon = parseInt(searchParams.get('horizon') || '30'); // Days to predict
      const developerId = searchParams.get('developer_id');

      const predictions: any = {
        timestamp: new Date().toISOString(),
        horizon_days: horizon,
      };

      // Role-based access control
      if (user.role === 'admin') {
        // Admins get all platform predictions
        if (model === 'all' || model === 'sales') {
          predictions.sales_forecast = await generateSalesForecast(horizon);
        }
        if (model === 'all' || model === 'user_behavior') {
          predictions.user_behavior = await predictUserBehavior(horizon);
        }
        if (model === 'all' || model === 'market_trends') {
          predictions.market_trends = await analyzeMarketTrends(horizon);
        }
        if (model === 'all' || model === 'churn') {
          predictions.churn_prediction = await predictUserChurn();
        }
      } else if (user.role === 'developer') {
        // Developers get their own app predictions
        const targetDeveloperId = developerId || user.id;
        if (targetDeveloperId !== user.id && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        if (model === 'all' || model === 'sales') {
          predictions.sales_forecast = await generateDeveloperSalesForecast(targetDeveloperId, horizon);
        }
        if (model === 'all' || model === 'app_performance') {
          predictions.app_performance = await predictAppPerformance(targetDeveloperId, horizon);
        }
        if (model === 'all' || model === 'revenue') {
          predictions.revenue_forecast = await predictDeveloperRevenue(targetDeveloperId, horizon);
        }
      } else {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        predictions,
      });
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate predictions' },
        { status: 500 }
      );
    }
  }
);

// Sales forecasting using linear regression and seasonal patterns
async function generateSalesForecast(horizonDays: number) {
  try {
    // Get historical sales data
    const historicalData = await neonClient.sql(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(amount) as revenue,
        COUNT(DISTINCT user_id) as unique_buyers
      FROM purchases
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    if (historicalData.length < 7) {
      return { error: 'Insufficient historical data for forecasting' };
    }

    // Simple linear regression for trend
    const trend = calculateLinearTrend(historicalData.map((d, i) => ({ x: i, y: d.sales_count })));
    
    // Seasonal patterns (day of week effect)
    const seasonalPatterns = await calculateSeasonalPatterns();

    // Get average order value
    const avgOrderValue = await getAverageOrderValue();

    // Generate predictions
    const predictions = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    for (let i = 1; i <= horizonDays; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      
      const dayOfWeek = futureDate.getDay();
      const seasonalMultiplier = seasonalPatterns[dayOfWeek] || 1;
      
      const basePrediction = trend.slope * (historicalData.length + i) + trend.intercept;
      const adjustedPrediction = Math.max(0, basePrediction * seasonalMultiplier);
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_sales: Math.round(adjustedPrediction),
        predicted_revenue: Math.round(adjustedPrediction * avgOrderValue),
        confidence: Math.max(0.5, 1 - (i / horizonDays) * 0.5), // Decreasing confidence over time
      });
    }

    return {
      predictions,
      model_info: {
        type: 'linear_regression_with_seasonality',
        trend_slope: trend.slope,
        r_squared: trend.rSquared,
        data_points: historicalData.length,
      },
      historical_data: historicalData.slice(-30), // Last 30 days for context
    };
  } catch (error) {
    console.error('Error in sales forecasting:', error);
    return { error: 'Failed to generate sales forecast' };
  }
}

// User behavior prediction
async function predictUserBehavior(horizonDays: number) {
  try {
    // Analyze user engagement patterns
    const userSegments = await neonClient.sql(`
      SELECT 
        u.id,
        u.role,
        u.created_at as registration_date,
        COUNT(DISTINCT p.id) as total_purchases,
        COUNT(DISTINCT ual.id) as activity_count,
        MAX(ual.created_at) as last_activity,
        AVG(CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN p.amount END) as avg_recent_spend
      FROM users u
      LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
      LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
      WHERE u.created_at >= NOW() - INTERVAL '180 days'
      GROUP BY u.id, u.role, u.created_at
    `);

    // Segment users based on behavior
    const segments = {
      high_value: userSegments.filter(u => u.total_purchases >= 5 && u.avg_recent_spend > 5000),
      regular: userSegments.filter(u => u.total_purchases >= 2 && u.total_purchases < 5),
      new: userSegments.filter(u => u.total_purchases < 2 && new Date(u.registration_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      at_risk: userSegments.filter(u => u.last_activity && new Date(u.last_activity) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
    };

    // Predict future behavior for each segment
    const predictions = {
      expected_new_users: Math.round(segments.new.length * 1.2), // 20% growth assumption
      expected_purchases: {
        high_value: Math.round(segments.high_value.length * 0.8 * (horizonDays / 30)),
        regular: Math.round(segments.regular.length * 0.4 * (horizonDays / 30)),
        new: Math.round(segments.new.length * 0.1 * (horizonDays / 30)),
      },
      churn_risk: {
        users_at_risk: segments.at_risk.length,
        predicted_churn: Math.round(segments.at_risk.length * 0.3),
      },
      engagement_forecast: await predictEngagementTrends(horizonDays),
    };

    return {
      predictions,
      segments: Object.keys(segments).map(key => ({
        name: key,
        count: (segments as any)[key].length,
        percentage: ((segments as any)[key].length / userSegments.length * 100).toFixed(1),
      })),
      total_users: userSegments.length,
    };
  } catch (error) {
    console.error('Error in user behavior prediction:', error);
    return { error: 'Failed to predict user behavior' };
  }
}

// Market trends analysis
async function analyzeMarketTrends(horizonDays: number) {
  try {
    // Analyze category performance trends
    const categoryTrends = await neonClient.sql(`
      SELECT 
        a.category,
        DATE_TRUNC('week', p.created_at) as week,
        COUNT(p.id) as sales,
        SUM(p.amount) as revenue,
        COUNT(DISTINCT p.user_id) as unique_buyers
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY a.category, DATE_TRUNC('week', p.created_at)
      ORDER BY week, category
    `);

    // Calculate growth rates for each category
    const categoryGrowth: any = {};
    const categories = Array.from(new Set(categoryTrends.map(t => t.category)));
    
    categories.forEach(category => {
      const categoryData = categoryTrends.filter(t => t.category === category);
      if (categoryData.length >= 2) {
        const recent = categoryData.slice(-4); // Last 4 weeks
        const older = categoryData.slice(-8, -4); // Previous 4 weeks
        
        const recentAvg = recent.reduce((sum, d) => sum + d.sales, 0) / recent.length;
        const olderAvg = older.reduce((sum, d) => sum + d.sales, 0) / older.length;
        
        categoryGrowth[category] = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      }
    });

    // Platform trends
    const platformTrends = await neonClient.sql(`
      SELECT 
        platform,
        COUNT(*) as app_count,
        AVG(rating_average) as avg_rating,
        SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as recent_submissions
      FROM apps
      WHERE status = 'approved'
      GROUP BY platform
      ORDER BY app_count DESC
    `);

    // Price trend analysis
    const priceTrends = await neonClient.sql(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        AVG(price) as avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
        COUNT(*) as app_count
      FROM apps
      WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    return {
      category_trends: categories.map(cat => ({
        category: cat,
        growth_rate: categoryGrowth[cat] || 0,
        trend: categoryGrowth[cat] > 5 ? 'growing' : categoryGrowth[cat] < -5 ? 'declining' : 'stable',
      })),
      platform_trends: platformTrends,
      price_trends: priceTrends,
      market_insights: generateMarketInsights(categoryGrowth, platformTrends),
    };
  } catch (error) {
    console.error('Error in market trends analysis:', error);
    return { error: 'Failed to analyze market trends' };
  }
}

// User churn prediction
async function predictUserChurn() {
  try {
    const users = await neonClient.sql(`
      SELECT 
        u.id,
        u.created_at as registration_date,
        COUNT(DISTINCT p.id) as total_purchases,
        COUNT(DISTINCT ual.id) as activity_count,
        MAX(ual.created_at) as last_activity,
        EXTRACT(DAYS FROM NOW() - MAX(ual.created_at)) as days_since_activity,
        AVG(p.amount) as avg_purchase_amount
      FROM users u
      LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
      LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
      WHERE u.role IN ('developer', 'tester')
      GROUP BY u.id, u.created_at
      HAVING MAX(ual.created_at) IS NOT NULL
    `);

    // Simple churn prediction based on activity patterns
    const churnPredictions = users.map(user => {
      let churnScore = 0;
      
      // Days since last activity (higher = more likely to churn)
      if (user.days_since_activity > 30) churnScore += 0.4;
      else if (user.days_since_activity > 14) churnScore += 0.2;
      
      // Purchase behavior
      if (user.total_purchases === 0) churnScore += 0.3;
      else if (user.total_purchases < 2) churnScore += 0.1;
      
      // Activity level
      if (user.activity_count < 10) churnScore += 0.2;
      else if (user.activity_count < 5) churnScore += 0.3;
      
      // Account age (very new users might churn)
      const accountAge = (Date.now() - new Date(user.registration_date).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge < 7) churnScore += 0.1;
      
      return {
        user_id: user.id,
        churn_probability: Math.min(1, churnScore),
        risk_level: churnScore > 0.7 ? 'high' : churnScore > 0.4 ? 'medium' : 'low',
        days_since_activity: user.days_since_activity,
        total_purchases: user.total_purchases,
      };
    });

    const highRisk = churnPredictions.filter(p => p.risk_level === 'high');
    const mediumRisk = churnPredictions.filter(p => p.risk_level === 'medium');

    return {
      total_users_analyzed: users.length,
      high_risk_users: highRisk.length,
      medium_risk_users: mediumRisk.length,
      churn_predictions: churnPredictions.slice(0, 100), // Limit response size
      recommendations: generateChurnRecommendations(highRisk, mediumRisk),
    };
  } catch (error) {
    console.error('Error in churn prediction:', error);
    return { error: 'Failed to predict user churn' };
  }
}

// Helper functions
function calculateLinearTrend(data: { x: number; y: number }[]) {
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumXX = data.reduce((sum, d) => sum + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = data.reduce((sum, d) => {
    const predicted = slope * d.x + intercept;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.y - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  return { slope, intercept, rSquared };
}

async function calculateSeasonalPatterns() {
  const dayPatterns = await neonClient.sql(`
    SELECT 
      EXTRACT(DOW FROM created_at) as day_of_week,
      COUNT(*) as sales_count
    FROM purchases
    WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '90 days'
    GROUP BY EXTRACT(DOW FROM created_at)
  `);

  const avgSales = dayPatterns.reduce((sum, d) => sum + d.sales_count, 0) / dayPatterns.length;
  const patterns: any = {};
  
  dayPatterns.forEach(d => {
    patterns[d.day_of_week] = d.sales_count / avgSales;
  });

  return patterns;
}

async function getAverageOrderValue() {
  const result = await neonClient.sql(`
    SELECT AVG(amount) as avg_order_value
    FROM purchases
    WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
  `);

  return result[0]?.avg_order_value || 5000; // Default $50
}

async function predictEngagementTrends(horizonDays: number) {
  // Simple engagement prediction based on historical patterns
  const engagement = await neonClient.sql(`
    SELECT 
      DATE(created_at) as date,
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as total_actions
    FROM user_activity_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `);

  const avgDailyUsers = engagement.reduce((sum, d) => sum + d.active_users, 0) / engagement.length;
  const trend = calculateLinearTrend(engagement.map((d, i) => ({ x: i, y: d.active_users })));

  return {
    current_daily_average: Math.round(avgDailyUsers),
    predicted_daily_average: Math.round(trend.slope * horizonDays + avgDailyUsers),
    trend_direction: trend.slope > 0 ? 'increasing' : 'decreasing',
    confidence: Math.max(0.6, trend.rSquared),
  };
}

function generateMarketInsights(categoryGrowth: any, platformTrends: any) {
  const insights = [];

  // Category insights
  const growingCategories = Object.entries(categoryGrowth)
    .filter(([_, growth]: [string, any]) => growth > 10)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b - a);

  if (growingCategories.length > 0) {
    insights.push({
      type: 'opportunity',
      message: `${growingCategories[0][0]} category is showing strong growth (${(growingCategories[0][1] as number).toFixed(1)}%)`,
    });
  }

  // Platform insights
  const topPlatform = platformTrends[0];
  if (topPlatform) {
    insights.push({
      type: 'trend',
      message: `${topPlatform.platform} is the dominant platform with ${topPlatform.app_count} apps`,
    });
  }

  return insights;
}

function generateChurnRecommendations(highRisk: any[], mediumRisk: any[]) {
  const recommendations = [];

  if (highRisk.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'immediate_engagement',
      message: `${highRisk.length} users are at high risk of churning. Consider targeted re-engagement campaigns.`,
    });
  }

  if (mediumRisk.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'proactive_outreach',
      message: `${mediumRisk.length} users show medium churn risk. Implement proactive support and engagement.`,
    });
  }

  return recommendations;
}

// Developer-specific prediction functions
async function generateDeveloperSalesForecast(developerId: string, horizonDays: number) {
  const historicalData = await neonClient.sql(`
    SELECT 
      DATE(p.created_at) as date,
      COUNT(*) as sales_count,
      SUM(p.developer_payout) as revenue
    FROM purchases p
    JOIN apps a ON p.app_id = a.id
    WHERE a.developer_id = $1 AND p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '60 days'
    GROUP BY DATE(p.created_at)
    ORDER BY date
  `, [developerId]);

  if (historicalData.length < 5) {
    return { error: 'Insufficient historical data for forecasting' };
  }

  const trend = calculateLinearTrend(historicalData.map((d, i) => ({ x: i, y: d.sales_count })));
  
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= horizonDays; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(lastDate.getDate() + i);
    
    const basePrediction = trend.slope * (historicalData.length + i) + trend.intercept;
    const adjustedPrediction = Math.max(0, basePrediction);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predicted_sales: Math.round(adjustedPrediction),
      predicted_revenue: Math.round(adjustedPrediction * (historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.reduce((sum, d) => sum + d.sales_count, 0))),
      confidence: Math.max(0.5, 1 - (i / horizonDays) * 0.5),
    });
  }

  return {
    predictions,
    historical_data: historicalData,
    model_info: {
      type: 'linear_regression',
      trend_slope: trend.slope,
      r_squared: trend.rSquared,
    },
  };
}

async function predictAppPerformance(developerId: string, horizonDays: number) {
  const apps = await neonClient.sql(`
    SELECT 
      a.id,
      a.name,
      a.category,
      a.price,
      a.rating_average,
      a.rating_count,
      COUNT(p.id) as total_sales,
      COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_sales
    FROM apps a
    LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed'
    WHERE a.developer_id = $1 AND a.status = 'approved'
    GROUP BY a.id, a.name, a.category, a.price, a.rating_average, a.rating_count
  `, [developerId]);

  return apps.map(app => {
    // Simple performance prediction based on current metrics
    let performanceScore = 0;
    
    // Rating impact
    if (app.rating_average >= 4.5) performanceScore += 0.3;
    else if (app.rating_average >= 4.0) performanceScore += 0.2;
    else if (app.rating_average >= 3.5) performanceScore += 0.1;
    
    // Sales momentum
    if (app.recent_sales > app.total_sales * 0.3) performanceScore += 0.3; // 30% of sales in last month
    else if (app.recent_sales > app.total_sales * 0.1) performanceScore += 0.2;
    
    // Price positioning
    if (app.price < 2000) performanceScore += 0.2; // Under $20
    else if (app.price < 5000) performanceScore += 0.1; // Under $50
    
    // Review count
    if (app.rating_count > 50) performanceScore += 0.2;
    else if (app.rating_count > 10) performanceScore += 0.1;

    return {
      app_id: app.id,
      app_name: app.name,
      current_performance: performanceScore,
      predicted_trend: performanceScore > 0.6 ? 'strong_growth' : performanceScore > 0.4 ? 'moderate_growth' : 'stable',
      recommendations: generateAppRecommendations(app, performanceScore),
    };
  });
}

async function predictDeveloperRevenue(developerId: string, horizonDays: number) {
  const revenueData = await neonClient.sql(`
    SELECT 
      DATE_TRUNC('week', p.created_at) as week,
      SUM(p.developer_payout) as revenue,
      COUNT(p.id) as sales_count
    FROM purchases p
    JOIN apps a ON p.app_id = a.id
    WHERE a.developer_id = $1 AND p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', p.created_at)
    ORDER BY week
  `, [developerId]);

  if (revenueData.length < 3) {
    return { error: 'Insufficient revenue data for forecasting' };
  }

  const trend = calculateLinearTrend(revenueData.map((d, i) => ({ x: i, y: d.revenue })));
  const avgWeeklyRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length;

  const weeksToPredict = Math.ceil(horizonDays / 7);
  const predictions = [];

  for (let i = 1; i <= weeksToPredict; i++) {
    const predictedRevenue = Math.max(0, trend.slope * (revenueData.length + i) + trend.intercept);
    predictions.push({
      week: i,
      predicted_revenue: Math.round(predictedRevenue),
      confidence: Math.max(0.5, 1 - (i / weeksToPredict) * 0.4),
    });
  }

  return {
    predictions,
    current_weekly_average: Math.round(avgWeeklyRevenue),
    trend_direction: trend.slope > 0 ? 'increasing' : 'decreasing',
    total_predicted_revenue: Math.round(predictions.reduce((sum, p) => sum + p.predicted_revenue, 0)),
  };
}

function generateAppRecommendations(app: any, performanceScore: number) {
  const recommendations = [];

  if (app.rating_average < 4.0) {
    recommendations.push('Focus on improving app quality to increase ratings');
  }

  if (app.rating_count < 10) {
    recommendations.push('Encourage more users to leave reviews');
  }

  if (app.recent_sales < 5) {
    recommendations.push('Consider marketing campaigns to boost visibility');
  }

  if (app.price > 10000) { // Over $100
    recommendations.push('Consider price optimization or value proposition enhancement');
  }

  return recommendations;
}
