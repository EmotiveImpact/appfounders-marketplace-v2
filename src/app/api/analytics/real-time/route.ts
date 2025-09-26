import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/analytics/real-time - Get real-time analytics data
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const timeframe = searchParams.get('timeframe') || '24h';
      const metric = searchParams.get('metric') || 'all';

      // Calculate time range based on timeframe
      let timeInterval = '';
      let groupBy = '';
      
      switch (timeframe) {
        case '1h':
          timeInterval = "NOW() - INTERVAL '1 hour'";
          groupBy = "DATE_TRUNC('minute', created_at)";
          break;
        case '24h':
          timeInterval = "NOW() - INTERVAL '24 hours'";
          groupBy = "DATE_TRUNC('hour', created_at)";
          break;
        case '7d':
          timeInterval = "NOW() - INTERVAL '7 days'";
          groupBy = "DATE_TRUNC('day', created_at)";
          break;
        case '30d':
          timeInterval = "NOW() - INTERVAL '30 days'";
          groupBy = "DATE_TRUNC('day', created_at)";
          break;
        default:
          timeInterval = "NOW() - INTERVAL '24 hours'";
          groupBy = "DATE_TRUNC('hour', created_at)";
      }

      const analytics = {
        timestamp: new Date().toISOString(),
        timeframe,
      };

      // Real-time metrics based on user role
      if (user.role === 'admin') {
        // Admin gets all platform metrics
        analytics.platform = await getPlatformMetrics(timeInterval, groupBy);
        analytics.revenue = await getRevenueMetrics(timeInterval, groupBy);
        analytics.users = await getUserMetrics(timeInterval, groupBy);
        analytics.apps = await getAppMetrics(timeInterval, groupBy);
      } else if (user.role === 'developer') {
        // Developers get their own app metrics
        analytics.developer = await getDeveloperMetrics(user.id, timeInterval, groupBy);
        analytics.apps = await getDeveloperAppMetrics(user.id, timeInterval, groupBy);
        analytics.revenue = await getDeveloperRevenueMetrics(user.id, timeInterval, groupBy);
      } else {
        // Regular users get limited metrics
        analytics.activity = await getUserActivityMetrics(user.id, timeInterval, groupBy);
      }

      return NextResponse.json({
        success: true,
        analytics,
      });
    } catch (error: any) {
      console.error('Error getting real-time analytics:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get analytics' },
        { status: 500 }
      );
    }
  }
);

// Platform-wide metrics for admins
async function getPlatformMetrics(timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // Active users
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(DISTINCT user_id) as active_users
      FROM user_activity_logs
      WHERE created_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
    
    // New registrations
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
    
    // App submissions
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(*) as submissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM apps
      WHERE submitted_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
    
    // Current totals
    neonClient.sql(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'developer') as total_developers,
        (SELECT COUNT(*) FROM users WHERE role = 'tester') as total_testers,
        (SELECT COUNT(*) FROM apps WHERE status = 'approved') as total_apps,
        (SELECT COUNT(*) FROM purchases WHERE status = 'completed') as total_purchases
    `),
  ]);

  return {
    active_users: queries[0],
    new_users: queries[1],
    app_submissions: queries[2],
    totals: queries[3][0],
  };
}

// Revenue metrics
async function getRevenueMetrics(timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // Revenue over time
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        SUM(amount) as total_revenue,
        SUM(platform_fee) as platform_revenue,
        SUM(developer_payout) as developer_revenue,
        COUNT(*) as transaction_count
      FROM purchases
      WHERE created_at >= ${timeInterval} AND status = 'completed'
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
    
    // Top performing apps
    neonClient.sql(`
      SELECT 
        a.name,
        a.id,
        SUM(p.amount) as revenue,
        COUNT(p.id) as sales_count
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE p.created_at >= ${timeInterval} AND p.status = 'completed'
      GROUP BY a.id, a.name
      ORDER BY revenue DESC
      LIMIT 10
    `),
    
    // Revenue by category
    neonClient.sql(`
      SELECT 
        a.category,
        SUM(p.amount) as revenue,
        COUNT(p.id) as sales_count
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE p.created_at >= ${timeInterval} AND p.status = 'completed'
      GROUP BY a.category
      ORDER BY revenue DESC
    `),
  ]);

  return {
    timeline: queries[0],
    top_apps: queries[1],
    by_category: queries[2],
  };
}

// User metrics
async function getUserMetrics(timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // User activity
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_actions
      FROM user_activity_logs
      WHERE created_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
    
    // User engagement by action
    neonClient.sql(`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_activity_logs
      WHERE created_at >= ${timeInterval}
      GROUP BY action
      ORDER BY count DESC
    `),
    
    // Geographic distribution (if available)
    neonClient.sql(`
      SELECT 
        location,
        COUNT(*) as user_count
      FROM users
      WHERE created_at >= ${timeInterval} AND location IS NOT NULL
      GROUP BY location
      ORDER BY user_count DESC
      LIMIT 10
    `),
  ]);

  return {
    activity: queries[0],
    engagement: queries[1],
    geographic: queries[2],
  };
}

// App metrics
async function getAppMetrics(timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // App performance
    neonClient.sql(`
      SELECT 
        a.id,
        a.name,
        a.category,
        COALESCE(a.rating_average, 0) as rating,
        a.rating_count,
        COUNT(p.id) as recent_purchases,
        COUNT(r.id) as recent_reviews
      FROM apps a
      LEFT JOIN purchases p ON a.id = p.app_id AND p.created_at >= ${timeInterval}
      LEFT JOIN reviews r ON a.id = r.app_id AND r.created_at >= ${timeInterval}
      WHERE a.status = 'approved'
      GROUP BY a.id, a.name, a.category, a.rating_average, a.rating_count
      ORDER BY recent_purchases DESC, rating DESC
      LIMIT 20
    `),
    
    // Download activity
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(*) as downloads,
        COUNT(DISTINCT user_id) as unique_downloaders,
        COUNT(DISTINCT app_id) as apps_downloaded
      FROM download_logs
      WHERE downloaded_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `),
  ]);

  return {
    performance: queries[0],
    downloads: queries[1],
  };
}

// Developer-specific metrics
async function getDeveloperMetrics(developerId: string, timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // Developer stats
    neonClient.sql(`
      SELECT 
        COUNT(DISTINCT a.id) as total_apps,
        COUNT(DISTINCT p.id) as total_sales,
        SUM(p.developer_payout) as total_earnings,
        AVG(a.rating_average) as avg_rating
      FROM apps a
      LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed'
      WHERE a.developer_id = $1
    `, [developerId]),
    
    // Recent activity
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(DISTINCT p.id) as sales,
        SUM(p.developer_payout) as earnings
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE a.developer_id = $1 AND p.created_at >= ${timeInterval} AND p.status = 'completed'
      GROUP BY time_bucket
      ORDER BY time_bucket
    `, [developerId]),
  ]);

  return {
    overview: queries[0][0],
    timeline: queries[1],
  };
}

// Developer app metrics
async function getDeveloperAppMetrics(developerId: string, timeInterval: string, groupBy: string) {
  const query = await neonClient.sql(`
    SELECT 
      a.id,
      a.name,
      a.status,
      COALESCE(a.rating_average, 0) as rating,
      a.rating_count,
      COUNT(p.id) as recent_sales,
      SUM(p.developer_payout) as recent_earnings,
      COUNT(r.id) as recent_reviews
    FROM apps a
    LEFT JOIN purchases p ON a.id = p.app_id AND p.created_at >= ${timeInterval} AND p.status = 'completed'
    LEFT JOIN reviews r ON a.id = r.app_id AND r.created_at >= ${timeInterval}
    WHERE a.developer_id = $1
    GROUP BY a.id, a.name, a.status, a.rating_average, a.rating_count
    ORDER BY recent_sales DESC, rating DESC
  `, [developerId]);

  return query;
}

// Developer revenue metrics
async function getDeveloperRevenueMetrics(developerId: string, timeInterval: string, groupBy: string) {
  const query = await neonClient.sql(`
    SELECT 
      ${groupBy} as time_bucket,
      SUM(p.developer_payout) as earnings,
      COUNT(p.id) as sales_count,
      AVG(p.developer_payout) as avg_sale_value
    FROM purchases p
    JOIN apps a ON p.app_id = a.id
    WHERE a.developer_id = $1 AND p.created_at >= ${timeInterval} AND p.status = 'completed'
    GROUP BY time_bucket
    ORDER BY time_bucket
  `, [developerId]);

  return query;
}

// User activity metrics
async function getUserActivityMetrics(userId: string, timeInterval: string, groupBy: string) {
  const queries = await Promise.all([
    // User's activity
    neonClient.sql(`
      SELECT 
        ${groupBy} as time_bucket,
        COUNT(*) as actions
      FROM user_activity_logs
      WHERE user_id = $1 AND created_at >= ${timeInterval}
      GROUP BY time_bucket
      ORDER BY time_bucket
    `, [userId]),
    
    // User's purchases
    neonClient.sql(`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(amount) as total_spent
      FROM purchases
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]),
  ]);

  return {
    activity: queries[0],
    purchases: queries[1][0],
  };
}
