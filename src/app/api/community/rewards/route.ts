import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // points, badges, leaderboard
    const period = searchParams.get('period') || 'all'; // week, month, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (type === 'points') {
      // Get user's points and recent point activities
      const userPointsQuery = `
        SELECT 
          COALESCE(SUM(points), 0) as total_points,
          COUNT(*) as total_activities
        FROM user_points 
        WHERE user_id = $1
      `;

      const userPointsResult = await neonClient.query(userPointsQuery, [(session.user as any).id]);

      // Get recent point activities
      let periodFilter = '';
      if (period === 'week') {
        periodFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
      } else if (period === 'month') {
        periodFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
      }

      const activitiesQuery = `
        SELECT *
        FROM user_points
        WHERE user_id = $1 ${periodFilter}
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const activitiesResult = await neonClient.query(activitiesQuery, [
        (session.user as any).id,
        limit,
        offset,
      ]);

      return NextResponse.json({
        user_points: userPointsResult[0],
        activities: activitiesResult,
        period,
      });
    } else if (type === 'badges') {
      // Get user's badges
      const badgesQuery = `
        SELECT 
          ub.*,
          b.name,
          b.description,
          b.icon,
          b.color,
          b.rarity
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
        LIMIT $2 OFFSET $3
      `;

      const badgesResult = await neonClient.query(badgesQuery, [
        (session.user as any).id,
        limit,
        offset,
      ]);

      // Get available badges (not yet earned)
      const availableBadgesQuery = `
        SELECT *
        FROM badges
        WHERE id NOT IN (
          SELECT badge_id 
          FROM user_badges 
          WHERE user_id = $1
        )
        AND is_active = true
        ORDER BY rarity ASC, name ASC
        LIMIT 10
      `;

      const availableBadgesResult = await neonClient.query(availableBadgesQuery, [(session.user as any).id]);

      return NextResponse.json({
        earned_badges: badgesResult,
        available_badges: availableBadgesResult,
      });
    } else if (type === 'leaderboard') {
      // Get leaderboard
      let periodFilter = '';
      if (period === 'week') {
        periodFilter = "AND up.created_at >= NOW() - INTERVAL '7 days'";
      } else if (period === 'month') {
        periodFilter = "AND up.created_at >= NOW() - INTERVAL '30 days'";
      }

      const leaderboardQuery = `
        SELECT 
          u.id,
          u.name,
          u.avatar_url,
          u.role,
          COALESCE(SUM(up.points), 0) as total_points,
          COUNT(ub.id) as badge_count,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
        FROM users u
        LEFT JOIN user_points up ON u.id = up.user_id ${periodFilter}
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        GROUP BY u.id, u.name, u.avatar_url, u.role
        HAVING COALESCE(SUM(up.points), 0) > 0
        ORDER BY total_points DESC
        LIMIT $1 OFFSET $2
      `;

      const leaderboardResult = await neonClient.query(leaderboardQuery, [limit, offset]);

      // Get current user's rank
      const userRankQuery = `
        WITH ranked_users AS (
          SELECT 
            u.id,
            COALESCE(SUM(up.points), 0) as total_points,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
          FROM users u
          LEFT JOIN user_points up ON u.id = up.user_id ${periodFilter}
          GROUP BY u.id
          HAVING COALESCE(SUM(up.points), 0) > 0
        )
        SELECT rank, total_points
        FROM ranked_users
        WHERE id = $1
      `;

      const userRankResult = await neonClient.query(userRankQuery, [(session.user as any).id]);

      return NextResponse.json({
        leaderboard: leaderboardResult,
        user_rank: userRankResult[0] || { rank: null, total_points: 0 },
        period,
      });
    } else {
      // Get overview data
      const overviewQuery = `
        SELECT 
          (SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = $1) as total_points,
          (SELECT COUNT(*) FROM user_badges WHERE user_id = $1) as badge_count,
          (SELECT COUNT(*) FROM user_points WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days') as weekly_activities,
          (SELECT COUNT(*) FROM user_points WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days') as monthly_activities
      `;

      const overviewResult = await neonClient.query(overviewQuery, [(session.user as any).id]);

      // Get recent badges
      const recentBadgesQuery = `
        SELECT 
          ub.*,
          b.name,
          b.description,
          b.icon,
          b.color
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
        LIMIT 5
      `;

      const recentBadgesResult = await neonClient.query(recentBadgesQuery, [(session.user as any).id]);

      return NextResponse.json({
        overview: overviewResult[0],
        recent_badges: recentBadgesResult,
      });
    }
  } catch (error) {
    console.error('Error fetching rewards data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, points, activity_type, description, metadata = {} } = body;

    if (action === 'award_points') {
      if (!points || !activity_type) {
        return NextResponse.json(
          { error: 'Points and activity type are required' },
          { status: 400 }
        );
      }

      // Award points to user
      const pointsResult = await neonClient.query(
        `INSERT INTO user_points (
          user_id, points, activity_type, description, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [(session.user as any).id, points, activity_type, description, JSON.stringify(metadata)]
      );

      // Check for badge eligibility
      await checkBadgeEligibility((session.user as any).id, activity_type, points);

      return NextResponse.json({
        message: 'Points awarded successfully',
        points_awarded: pointsResult[0],
      });
    } else if (action === 'redeem_reward') {
      const { reward_id, cost } = body;

      if (!reward_id || !cost) {
        return NextResponse.json(
          { error: 'Reward ID and cost are required' },
          { status: 400 }
        );
      }

      // Check if user has enough points
      const userPointsResult = await neonClient.query(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM user_points WHERE user_id = $1',
        [(session.user as any).id]
      );

      const totalPoints = parseInt(userPointsResult[0].total_points);

      if (totalPoints < cost) {
        return NextResponse.json(
          { error: 'Insufficient points' },
          { status: 400 }
        );
      }

      // Deduct points
      await neonClient.query(
        `INSERT INTO user_points (
          user_id, points, activity_type, description, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          (session.user as any).id,
          -cost,
          'reward_redemption',
          `Redeemed reward: ${reward_id}`,
          JSON.stringify({ reward_id }),
        ]
      );

      // Record redemption
      await neonClient.query(
        `INSERT INTO reward_redemptions (
          user_id, reward_id, points_cost, status
        ) VALUES ($1, $2, $3, $4)`,
        [(session.user as any).id, reward_id, cost, 'pending']
      );

      return NextResponse.json({
        message: 'Reward redeemed successfully',
        remaining_points: totalPoints - cost,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing rewards action:', error);
    return NextResponse.json(
      { error: 'Failed to process rewards action' },
      { status: 500 }
    );
  }
}

async function checkBadgeEligibility(userId: string, activityType: string, points: number) {
  try {
    // Get user's total points
    const totalPointsResult = await neonClient.query(
      'SELECT COALESCE(SUM(points), 0) as total_points FROM user_points WHERE user_id = $1',
      [userId]
    );

    const totalPoints = parseInt(totalPointsResult[0].total_points);

    // Get activity-specific counts
    const activityCountResult = await neonClient.query(
      'SELECT COUNT(*) as count FROM user_points WHERE user_id = $1 AND activity_type = $2',
      [userId, activityType]
    );

    const activityCount = parseInt(activityCountResult[0].count);

    // Check for eligible badges
    const eligibleBadgesQuery = `
      SELECT *
      FROM badges
      WHERE is_active = true
      AND id NOT IN (
        SELECT badge_id 
        FROM user_badges 
        WHERE user_id = $1
      )
      AND (
        (criteria->>'type' = 'total_points' AND (criteria->>'threshold')::int <= $2) OR
        (criteria->>'type' = 'activity_count' AND criteria->>'activity_type' = $3 AND (criteria->>'threshold')::int <= $4)
      )
    `;

    const eligibleBadgesResult = await neonClient.query(eligibleBadgesQuery, [
      userId,
      totalPoints,
      activityType,
      activityCount,
    ]);

    // Award eligible badges
    for (const badge of eligibleBadgesResult) {
      await neonClient.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)`,
        [userId, badge.id]
      );

      // Award bonus points for earning badge
      await neonClient.query(
        `INSERT INTO user_points (
          user_id, points, activity_type, description, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          badge.bonus_points || 0,
          'badge_earned',
          `Earned badge: ${badge.name}`,
          JSON.stringify({ badge_id: badge.id }),
        ]
      );
    }
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
  }
}
