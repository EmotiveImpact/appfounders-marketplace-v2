import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/user/account-info - Get user account information and statistics
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      // Get user's app count based on role
      let appsCountQuery;
      if (user.role === 'developer') {
        appsCountQuery = neonClient.sql`
          SELECT COUNT(*) as count
          FROM apps
          WHERE developer_id = ${user.id}
        `;
      } else {
        // For testers, count apps they've tested (purchased or reviewed)
        appsCountQuery = neonClient.sql`
          SELECT COUNT(DISTINCT app_id) as count
          FROM (
            SELECT app_id FROM purchases WHERE user_id = ${user.id}
            UNION
            SELECT app_id FROM reviews WHERE user_id = ${user.id}
          ) as tested_apps
        `;
      }

      // Get reviews count
      const reviewsCountQuery = neonClient.sql`
        SELECT COUNT(*) as count
        FROM reviews
        WHERE user_id = ${user.id}
      `;

      // Get financial information based on role
      let financialQuery;
      if (user.role === 'developer') {
        // Total earned from app sales
        financialQuery = neonClient.sql`
          SELECT COALESCE(SUM(amount * 0.8), 0) as total_amount
          FROM purchases p
          JOIN apps a ON p.app_id = a.id
          WHERE a.developer_id = ${user.id}
          AND p.status = 'completed'
        `;
      } else {
        // Total spent on app purchases
        financialQuery = neonClient.sql`
          SELECT COALESCE(SUM(amount), 0) as total_amount
          FROM purchases
          WHERE user_id = ${user.id}
          AND status = 'completed'
        `;
      }

      // Get last login from activity logs
      const lastLoginQuery = neonClient.sql`
        SELECT created_at
        FROM user_activity_logs
        WHERE user_id = ${user.id}
        AND action = 'login'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      // Execute all queries
      const [
        appsCountResult,
        reviewsCountResult,
        financialResult,
        lastLoginResult
      ] = await Promise.all([
        appsCountQuery,
        reviewsCountQuery,
        financialQuery,
        lastLoginQuery
      ]);

      // Get additional user statistics
      const userStatsQuery = neonClient.sql`
        SELECT 
          (SELECT COUNT(*) FROM purchases WHERE user_id = ${user.id} AND status = 'completed') as purchases_count,
          (SELECT COUNT(*) FROM download_access_logs WHERE user_id = ${user.id} AND action = 'download_completed') as downloads_count,
          (SELECT AVG(rating) FROM reviews WHERE user_id = ${user.id}) as average_rating_given,
          (SELECT COUNT(*) FROM review_helpful WHERE user_id = ${user.id}) as helpful_votes_given
      `;

      const userStatsResult = await userStatsQuery;
      const userStats = userStatsResult[0] || {};

      // Get developer-specific stats if applicable
      let developerStats = {};
      if (user.role === 'developer') {
        const developerStatsQuery = neonClient.sql`
          SELECT 
            (SELECT AVG(r.rating) FROM reviews r JOIN apps a ON r.app_id = a.id WHERE a.developer_id = ${user.id}) as average_rating_received,
            (SELECT COUNT(*) FROM reviews r JOIN apps a ON r.app_id = a.id WHERE a.developer_id = ${user.id}) as reviews_received,
            (SELECT COUNT(DISTINCT p.user_id) FROM purchases p JOIN apps a ON p.app_id = a.id WHERE a.developer_id = ${user.id} AND p.status = 'completed') as unique_customers
        `;

        const developerStatsResult = await developerStatsQuery;
        developerStats = developerStatsResult[0] || {};
      }

      const accountInfo = {
        apps_count: parseInt(appsCountResult[0]?.count || '0'),
        reviews_count: parseInt(reviewsCountResult[0]?.count || '0'),
        total_amount: parseFloat(financialResult[0]?.total_amount || '0').toFixed(2),
        last_login: lastLoginResult[0]?.created_at || null,
        purchases_count: parseInt(userStats.purchases_count || '0'),
        downloads_count: parseInt(userStats.downloads_count || '0'),
        average_rating_given: parseFloat(userStats.average_rating_given || '0').toFixed(1),
        helpful_votes_given: parseInt(userStats.helpful_votes_given || '0'),
        ...developerStats,
      };

      // Format developer-specific stats
      if (user.role === 'developer') {
        accountInfo.average_rating_received = parseFloat(developerStats.average_rating_received || '0').toFixed(1);
        accountInfo.reviews_received = parseInt(developerStats.reviews_received || '0');
        accountInfo.unique_customers = parseInt(developerStats.unique_customers || '0');
      }

      return NextResponse.json({
        success: true,
        accountInfo,
      });
    } catch (error: any) {
      console.error('Error fetching account info:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch account information' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
