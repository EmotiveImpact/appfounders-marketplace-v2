import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
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
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y, all
    const appId = searchParams.get('app_id');

    // Calculate date range
    let dateFilter = '';
    const params = [(session.user as any).id];

    switch (period) {
      case '7d':
        dateFilter = "AND p.purchased_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND p.purchased_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "AND p.purchased_at >= NOW() - INTERVAL '90 days'";
        break;
      case '1y':
        dateFilter = "AND p.purchased_at >= NOW() - INTERVAL '1 year'";
        break;
      case 'all':
      default:
        dateFilter = '';
        break;
    }

    let appFilter = '';
    if (appId) {
      appFilter = 'AND p.app_id = $2';
      params.push(appId);
    }

    // Revenue overview
    const overviewQuery = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COALESCE(SUM(p.platform_fee), 0) as platform_fees,
        COALESCE(AVG(p.amount), 0) as average_order_value,
        COUNT(DISTINCT p.user_id) as unique_customers,
        COUNT(DISTINCT p.app_id) as apps_sold
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      ${dateFilter}
      ${appFilter}
    `;

    const overviewResult = await neonClient.query(overviewQuery, params);

    // Revenue by time period (daily for last 30 days, weekly for longer periods)
    const timeGrouping = period === '7d' || period === '30d' ? 'day' : 'week';
    const timeSeriesQuery = `
      SELECT 
        DATE_TRUNC('${timeGrouping}', p.purchased_at) as period,
        COUNT(*) as sales_count,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COUNT(DISTINCT p.user_id) as unique_customers
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      ${dateFilter}
      ${appFilter}
      GROUP BY DATE_TRUNC('${timeGrouping}', p.purchased_at)
      ORDER BY period ASC
    `;

    const timeSeriesResult = await neonClient.query(timeSeriesQuery, params);

    // Revenue by app
    const appRevenueQuery = `
      SELECT 
        a.id,
        a.name,
        a.category,
        COUNT(p.id) as sales_count,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COALESCE(AVG(p.amount), 0) as average_price,
        COUNT(DISTINCT p.user_id) as unique_customers
      FROM apps a
      LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed' AND p.developer_id = $1 ${dateFilter}
      WHERE a.developer_id = $1
      ${appId ? 'AND a.id = $2' : ''}
      GROUP BY a.id, a.name, a.category
      ORDER BY net_revenue DESC
    `;

    const appRevenueResult = await neonClient.query(appRevenueQuery, params);

    // Revenue by category
    const categoryRevenueQuery = `
      SELECT 
        a.category,
        COUNT(p.id) as sales_count,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COUNT(DISTINCT a.id) as apps_count
      FROM apps a
      LEFT JOIN purchases p ON a.id = p.app_id AND p.status = 'completed' AND p.developer_id = $1 ${dateFilter}
      WHERE a.developer_id = $1
      ${appId ? 'AND a.id = $2' : ''}
      GROUP BY a.category
      ORDER BY net_revenue DESC
    `;

    const categoryRevenueResult = await neonClient.query(categoryRevenueQuery, params);

    // Top customers
    const topCustomersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(p.id) as purchase_count,
        COALESCE(SUM(p.amount), 0) as total_spent,
        MAX(p.purchased_at) as last_purchase,
        MIN(p.purchased_at) as first_purchase
      FROM users u
      JOIN purchases p ON u.id = p.user_id
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      ${dateFilter}
      ${appFilter}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_spent DESC
      LIMIT 10
    `;

    const topCustomersResult = await neonClient.query(topCustomersQuery, params);

    // Refund analytics
    const refundQuery = `
      SELECT 
        COUNT(*) as refund_count,
        COALESCE(SUM(p.refund_amount), 0) as total_refunded,
        ROUND(
          (COUNT(*) * 100.0 / NULLIF(
            (SELECT COUNT(*) FROM purchases WHERE developer_id = $1 AND status IN ('completed', 'refunded') ${dateFilter} ${appFilter}), 
            0
          )), 2
        ) as refund_rate
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'refunded'
      ${dateFilter}
      ${appFilter}
    `;

    const refundResult = await neonClient.query(refundQuery, params);

    // Growth metrics (compare with previous period)
    let previousPeriodFilter = '';
    switch (period) {
      case '7d':
        previousPeriodFilter = "AND p.purchased_at >= NOW() - INTERVAL '14 days' AND p.purchased_at < NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        previousPeriodFilter = "AND p.purchased_at >= NOW() - INTERVAL '60 days' AND p.purchased_at < NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        previousPeriodFilter = "AND p.purchased_at >= NOW() - INTERVAL '180 days' AND p.purchased_at < NOW() - INTERVAL '90 days'";
        break;
      case '1y':
        previousPeriodFilter = "AND p.purchased_at >= NOW() - INTERVAL '2 years' AND p.purchased_at < NOW() - INTERVAL '1 year'";
        break;
      default:
        previousPeriodFilter = '';
    }

    let growthMetrics = null;
    if (previousPeriodFilter && period !== 'all') {
      const previousPeriodQuery = `
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(p.developer_payout), 0) as net_revenue,
          COUNT(DISTINCT p.user_id) as unique_customers
        FROM purchases p
        WHERE p.developer_id = $1 
        AND p.status = 'completed'
        ${previousPeriodFilter}
        ${appFilter}
      `;

      const previousPeriodResult = await neonClient.query(previousPeriodQuery, params);
      const current = overviewResult[0];
      const previous = previousPeriodResult[0];

      growthMetrics = {
        sales_growth: previous.total_sales > 0 
          ? ((current.total_sales - previous.total_sales) / previous.total_sales * 100).toFixed(2)
          : current.total_sales > 0 ? 100 : 0,
        revenue_growth: previous.net_revenue > 0 
          ? ((current.net_revenue - previous.net_revenue) / previous.net_revenue * 100).toFixed(2)
          : current.net_revenue > 0 ? 100 : 0,
        customer_growth: previous.unique_customers > 0 
          ? ((current.unique_customers - previous.unique_customers) / previous.unique_customers * 100).toFixed(2)
          : current.unique_customers > 0 ? 100 : 0,
      };
    }

    // Payout summary
    const payoutQuery = `
      SELECT 
        COUNT(*) as total_payouts,
        COALESCE(SUM(amount_cents), 0) as total_paid_out,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) as pending_payouts,
        MAX(processed_at) as last_payout_date
      FROM payouts
      WHERE user_id = $1
      ${period !== 'all' ? dateFilter.replace('p.purchased_at', 'created_at') : ''}
    `;

    const payoutResult = await neonClient.query(payoutQuery, [(session.user as any).id]);

    return NextResponse.json({
      overview: overviewResult[0],
      time_series: timeSeriesResult,
      app_breakdown: appRevenueResult,
      category_breakdown: categoryRevenueResult,
      top_customers: topCustomersResult,
      refund_analytics: refundResult[0],
      growth_metrics: growthMetrics,
      payout_summary: payoutResult[0],
      period,
      app_id: appId,
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
