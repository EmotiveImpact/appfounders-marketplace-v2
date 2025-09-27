import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/analytics/cohorts - Get cohort analysis data
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const analysisType = searchParams.get('type') || 'retention';
      const cohortPeriod = searchParams.get('period') || 'monthly';
      const developerId = searchParams.get('developer_id');

      // Role-based access control
      if (user.role === 'developer' && developerId && developerId !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      let cohortData: any = {};

      switch (analysisType) {
        case 'retention':
          cohortData = await generateRetentionCohorts(cohortPeriod, developerId || undefined);
          break;
        case 'revenue':
          cohortData = await generateRevenueCohorts(cohortPeriod, developerId || undefined);
          break;
        case 'ltv':
          cohortData = await calculateLifetimeValue(cohortPeriod, developerId || undefined);
          break;
        case 'engagement':
          cohortData = await analyzeEngagementCohorts(cohortPeriod, developerId || undefined);
          break;
        default:
          cohortData = await generateRetentionCohorts(cohortPeriod, developerId || undefined);
      }

      return NextResponse.json({
        success: true,
        cohort_analysis: {
          type: analysisType,
          period: cohortPeriod,
          data: cohortData,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error generating cohort analysis:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate cohort analysis' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
    resourceType: 'analytics',
    action: 'read',
  }
);

// Generate retention cohort analysis
async function generateRetentionCohorts(period: string, developerId?: string) {
  try {
    const periodFormat = period === 'weekly' ? 'week' : 'month';
    const intervalDays = period === 'weekly' ? 7 : 30;

    // Get user cohorts based on registration date
    let cohortQuery = `
      WITH user_cohorts AS (
        SELECT 
          u.id as user_id,
          DATE_TRUNC('${periodFormat}', u.created_at) as cohort_period,
          u.created_at as registration_date
        FROM users u
        WHERE u.role IN ('developer', 'tester')
          AND u.created_at >= NOW() - INTERVAL '12 months'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (developerId) {
      // For developers, analyze their app users
      cohortQuery += `
          AND u.id IN (
            SELECT DISTINCT p.user_id 
            FROM purchases p 
            JOIN apps a ON p.app_id = a.id 
            WHERE a.developer_id = $${paramIndex}
          )
      `;
      queryParams.push(developerId);
      paramIndex++;
    }

    cohortQuery += `
      ),
      user_activity AS (
        SELECT 
          uc.user_id,
          uc.cohort_period,
          uc.registration_date,
          DATE_TRUNC('${periodFormat}', ual.created_at) as activity_period,
          EXTRACT(EPOCH FROM (DATE_TRUNC('${periodFormat}', ual.created_at) - uc.cohort_period)) / (${intervalDays} * 24 * 3600) as period_number
        FROM user_cohorts uc
        LEFT JOIN user_activity_logs ual ON uc.user_id = ual.user_id
        WHERE ual.created_at IS NOT NULL
      ),
      cohort_table AS (
        SELECT 
          cohort_period,
          period_number,
          COUNT(DISTINCT user_id) as users
        FROM user_activity
        WHERE period_number >= 0 AND period_number <= 12
        GROUP BY cohort_period, period_number
      ),
      cohort_sizes AS (
        SELECT 
          cohort_period,
          COUNT(DISTINCT user_id) as cohort_size
        FROM user_cohorts
        GROUP BY cohort_period
      )
      SELECT 
        ct.cohort_period,
        cs.cohort_size,
        ct.period_number,
        ct.users,
        ROUND((ct.users::DECIMAL / cs.cohort_size) * 100, 2) as retention_rate
      FROM cohort_table ct
      JOIN cohort_sizes cs ON ct.cohort_period = cs.cohort_period
      ORDER BY ct.cohort_period, ct.period_number
    `;

    const cohortData = await neonClient.sql(cohortQuery, queryParams);

    // Transform data into cohort table format
    const cohortTable: any = {};
    const periods = Array.from(new Set(cohortData.map(row => row.period_number))).sort((a, b) => a - b);
    
    cohortData.forEach(row => {
      const cohortKey = row.cohort_period;
      if (!cohortTable[cohortKey]) {
        cohortTable[cohortKey] = {
          cohort_period: cohortKey,
          cohort_size: row.cohort_size,
          retention_rates: {},
        };
      }
      cohortTable[cohortKey].retention_rates[row.period_number] = {
        users: row.users,
        retention_rate: row.retention_rate,
      };
    });

    // Calculate average retention rates across all cohorts
    const avgRetention: any = {};
    periods.forEach(period => {
      const rates = Object.values(cohortTable)
        .map((cohort: any) => cohort.retention_rates[period]?.retention_rate)
        .filter(rate => rate !== undefined);
      
      if (rates.length > 0) {
        avgRetention[period] = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      }
    });

    return {
      cohort_table: Object.values(cohortTable),
      average_retention: avgRetention,
      periods,
      total_cohorts: Object.keys(cohortTable).length,
    };
  } catch (error) {
    console.error('Error generating retention cohorts:', error);
    throw new Error('Failed to generate retention cohorts');
  }
}

// Generate revenue cohort analysis
async function generateRevenueCohorts(period: string, developerId?: string) {
  try {
    const periodFormat = period === 'weekly' ? 'week' : 'month';
    const intervalDays = period === 'weekly' ? 7 : 30;

    let revenueQuery = `
      WITH user_cohorts AS (
        SELECT 
          u.id as user_id,
          DATE_TRUNC('${periodFormat}', u.created_at) as cohort_period
        FROM users u
        WHERE u.role IN ('developer', 'tester')
          AND u.created_at >= NOW() - INTERVAL '12 months'
      ),
      purchase_data AS (
        SELECT 
          uc.user_id,
          uc.cohort_period,
          p.amount,
          DATE_TRUNC('${periodFormat}', p.created_at) as purchase_period,
          EXTRACT(EPOCH FROM (DATE_TRUNC('${periodFormat}', p.created_at) - uc.cohort_period)) / (${intervalDays} * 24 * 3600) as period_number
        FROM user_cohorts uc
        JOIN purchases p ON uc.user_id = p.user_id
        WHERE p.status = 'completed'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (developerId) {
      revenueQuery += `
          AND p.app_id IN (
            SELECT id FROM apps WHERE developer_id = $${paramIndex}
          )
      `;
      queryParams.push(developerId);
      paramIndex++;
    }

    revenueQuery += `
      ),
      cohort_revenue AS (
        SELECT 
          cohort_period,
          period_number,
          SUM(amount) as total_revenue,
          COUNT(DISTINCT user_id) as purchasing_users,
          AVG(amount) as avg_purchase_value
        FROM purchase_data
        WHERE period_number >= 0 AND period_number <= 12
        GROUP BY cohort_period, period_number
      ),
      cohort_sizes AS (
        SELECT 
          cohort_period,
          COUNT(DISTINCT user_id) as cohort_size
        FROM user_cohorts
        GROUP BY cohort_period
      )
      SELECT 
        cr.cohort_period,
        cs.cohort_size,
        cr.period_number,
        cr.total_revenue,
        cr.purchasing_users,
        cr.avg_purchase_value,
        ROUND(cr.total_revenue::DECIMAL / cs.cohort_size, 2) as revenue_per_user
      FROM cohort_revenue cr
      JOIN cohort_sizes cs ON cr.cohort_period = cs.cohort_period
      ORDER BY cr.cohort_period, cr.period_number
    `;

    const revenueData = await neonClient.sql(revenueQuery, queryParams);

    // Transform data
    const revenueCohorts: any = {};
    revenueData.forEach(row => {
      const cohortKey = row.cohort_period;
      if (!revenueCohorts[cohortKey]) {
        revenueCohorts[cohortKey] = {
          cohort_period: cohortKey,
          cohort_size: row.cohort_size,
          periods: {},
        };
      }
      revenueCohorts[cohortKey].periods[row.period_number] = {
        total_revenue: row.total_revenue,
        purchasing_users: row.purchasing_users,
        avg_purchase_value: row.avg_purchase_value,
        revenue_per_user: row.revenue_per_user,
      };
    });

    return {
      revenue_cohorts: Object.values(revenueCohorts),
      summary: {
        total_cohorts: Object.keys(revenueCohorts).length,
        avg_revenue_per_cohort: Object.values(revenueCohorts).reduce((sum: number, cohort: any) => {
          const totalRevenue = Object.values(cohort.periods).reduce((periodSum: number, period: any) => periodSum + period.total_revenue, 0);
          return sum + totalRevenue;
        }, 0) / Object.keys(revenueCohorts).length,
      },
    };
  } catch (error) {
    console.error('Error generating revenue cohorts:', error);
    throw new Error('Failed to generate revenue cohorts');
  }
}

// Calculate lifetime value
async function calculateLifetimeValue(period: string, developerId?: string) {
  try {
    let ltvQuery = `
      WITH user_metrics AS (
        SELECT 
          u.id as user_id,
          u.created_at as registration_date,
          COUNT(DISTINCT p.id) as total_purchases,
          SUM(p.amount) as total_spent,
          MAX(p.created_at) as last_purchase_date,
          EXTRACT(DAYS FROM (COALESCE(MAX(p.created_at), NOW()) - u.created_at)) as customer_lifespan_days
        FROM users u
        LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (developerId) {
      ltvQuery += `
        LEFT JOIN apps a ON p.app_id = a.id
        WHERE (a.developer_id = $${paramIndex} OR p.id IS NULL)
      `;
      queryParams.push(developerId);
      paramIndex++;
    } else {
      ltvQuery += ' WHERE u.role IN (\'developer\', \'tester\')';
    }

    ltvQuery += `
        GROUP BY u.id, u.created_at
      ),
      ltv_calculations AS (
        SELECT 
          user_id,
          registration_date,
          total_purchases,
          total_spent,
          customer_lifespan_days,
          CASE 
            WHEN customer_lifespan_days > 0 THEN total_spent::DECIMAL / customer_lifespan_days * 365
            ELSE 0
          END as estimated_annual_value,
          CASE 
            WHEN total_purchases > 0 THEN total_spent::DECIMAL / total_purchases
            ELSE 0
          END as avg_order_value,
          CASE 
            WHEN customer_lifespan_days > 0 THEN total_purchases::DECIMAL / customer_lifespan_days * 365
            ELSE 0
          END as estimated_annual_frequency
        FROM user_metrics
      ),
      cohort_ltv AS (
        SELECT 
          DATE_TRUNC('month', registration_date) as cohort_month,
          COUNT(*) as cohort_size,
          AVG(total_spent) as avg_ltv,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spent) as median_ltv,
          AVG(estimated_annual_value) as avg_annual_value,
          AVG(avg_order_value) as avg_order_value,
          AVG(estimated_annual_frequency) as avg_annual_frequency,
          AVG(customer_lifespan_days) as avg_lifespan_days
        FROM ltv_calculations
        WHERE registration_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', registration_date)
        ORDER BY cohort_month
      )
      SELECT * FROM cohort_ltv
    `;

    const ltvData = await neonClient.sql(ltvQuery, queryParams);

    // Calculate overall LTV metrics
    const overallMetrics = await neonClient.sql(`
      SELECT 
        COUNT(*) as total_users,
        AVG(total_spent) as avg_ltv,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spent) as median_ltv,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY total_spent) as p90_ltv,
        MAX(total_spent) as max_ltv
      FROM (
        SELECT 
          u.id,
          COALESCE(SUM(p.amount), 0) as total_spent
        FROM users u
        LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
        ${developerId ? 'LEFT JOIN apps a ON p.app_id = a.id' : ''}
        WHERE u.role IN ('developer', 'tester')
        ${developerId ? `AND (a.developer_id = $1 OR p.id IS NULL)` : ''}
        GROUP BY u.id
      ) user_totals
    `, developerId ? [developerId] : []);

    return {
      cohort_ltv: ltvData,
      overall_metrics: overallMetrics[0],
      insights: generateLTVInsights(ltvData, overallMetrics[0]),
    };
  } catch (error) {
    console.error('Error calculating lifetime value:', error);
    throw new Error('Failed to calculate lifetime value');
  }
}

// Analyze engagement cohorts
async function analyzeEngagementCohorts(period: string, developerId?: string) {
  try {
    const periodFormat = period === 'weekly' ? 'week' : 'month';

    let engagementQuery = `
      WITH user_cohorts AS (
        SELECT 
          u.id as user_id,
          DATE_TRUNC('${periodFormat}', u.created_at) as cohort_period
        FROM users u
        WHERE u.role IN ('developer', 'tester')
          AND u.created_at >= NOW() - INTERVAL '12 months'
      ),
      engagement_metrics AS (
        SELECT 
          uc.user_id,
          uc.cohort_period,
          COUNT(DISTINCT DATE(ual.created_at)) as active_days,
          COUNT(ual.id) as total_actions,
          COUNT(DISTINCT ual.action) as unique_actions,
          MAX(ual.created_at) as last_activity
        FROM user_cohorts uc
        LEFT JOIN user_activity_logs ual ON uc.user_id = ual.user_id
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (developerId) {
      // For developers, focus on engagement with their apps
      engagementQuery += `
        LEFT JOIN purchases p ON uc.user_id = p.user_id
        LEFT JOIN apps a ON p.app_id = a.id
        WHERE (a.developer_id = $${paramIndex} OR ual.id IS NULL)
      `;
      queryParams.push(developerId);
      paramIndex++;
    }

    engagementQuery += `
        GROUP BY uc.user_id, uc.cohort_period
      ),
      cohort_engagement AS (
        SELECT 
          cohort_period,
          COUNT(*) as cohort_size,
          AVG(active_days) as avg_active_days,
          AVG(total_actions) as avg_total_actions,
          AVG(unique_actions) as avg_unique_actions,
          COUNT(CASE WHEN active_days >= 7 THEN 1 END) as highly_engaged_users,
          COUNT(CASE WHEN active_days >= 1 THEN 1 END) as engaged_users
        FROM engagement_metrics
        GROUP BY cohort_period
        ORDER BY cohort_period
      )
      SELECT 
        *,
        ROUND((highly_engaged_users::DECIMAL / cohort_size) * 100, 2) as high_engagement_rate,
        ROUND((engaged_users::DECIMAL / cohort_size) * 100, 2) as engagement_rate
      FROM cohort_engagement
    `;

    const engagementData = await neonClient.sql(engagementQuery, queryParams);

    return {
      engagement_cohorts: engagementData,
      summary: {
        total_cohorts: engagementData.length,
        avg_engagement_rate: engagementData.reduce((sum, cohort) => sum + cohort.engagement_rate, 0) / engagementData.length,
        avg_high_engagement_rate: engagementData.reduce((sum, cohort) => sum + cohort.high_engagement_rate, 0) / engagementData.length,
      },
    };
  } catch (error) {
    console.error('Error analyzing engagement cohorts:', error);
    throw new Error('Failed to analyze engagement cohorts');
  }
}

// Generate LTV insights
function generateLTVInsights(cohortData: any[], overallMetrics: any) {
  const insights = [];

  // Trend analysis
  if (cohortData.length >= 3) {
    const recent = cohortData.slice(-3);
    const older = cohortData.slice(0, 3);
    
    const recentAvgLTV = recent.reduce((sum, cohort) => sum + cohort.avg_ltv, 0) / recent.length;
    const olderAvgLTV = older.reduce((sum, cohort) => sum + cohort.avg_ltv, 0) / older.length;
    
    if (recentAvgLTV > olderAvgLTV * 1.1) {
      insights.push({
        type: 'positive',
        message: 'LTV is trending upward in recent cohorts',
        value: `${((recentAvgLTV - olderAvgLTV) / olderAvgLTV * 100).toFixed(1)}% increase`,
      });
    } else if (recentAvgLTV < olderAvgLTV * 0.9) {
      insights.push({
        type: 'warning',
        message: 'LTV is declining in recent cohorts',
        value: `${((olderAvgLTV - recentAvgLTV) / olderAvgLTV * 100).toFixed(1)}% decrease`,
      });
    }
  }

  // High-value user identification
  if (overallMetrics.p90_ltv > overallMetrics.avg_ltv * 3) {
    insights.push({
      type: 'opportunity',
      message: 'Significant opportunity in high-value user segment',
      value: `Top 10% users have ${(overallMetrics.p90_ltv / overallMetrics.avg_ltv).toFixed(1)}x higher LTV`,
    });
  }

  return insights;
}
