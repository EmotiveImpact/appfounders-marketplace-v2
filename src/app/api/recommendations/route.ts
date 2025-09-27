import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

interface RecommendationRequest {
  user_id?: string;
  app_id?: string;
  limit?: number;
  type?: 'similar' | 'personalized' | 'trending' | 'category' | 'collaborative';
}

// GET /api/recommendations - Get personalized app recommendations
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const appId = searchParams.get('app_id');
      const limit = parseInt(searchParams.get('limit') || '10');
      const type = (searchParams.get('type') as any) || 'personalized';

      let recommendations = [];

      switch (type) {
        case 'similar':
          if (!appId) {
            return NextResponse.json(
              { error: 'app_id is required for similar recommendations' },
              { status: 400 }
            );
          }
          recommendations = await getSimilarApps(appId, limit);
          break;

        case 'personalized':
          recommendations = await getPersonalizedRecommendations(user.id, limit);
          break;

        case 'trending':
          recommendations = await getTrendingApps(limit);
          break;

        case 'category':
          recommendations = await getCategoryBasedRecommendations(user.id, limit);
          break;

        case 'collaborative':
          recommendations = await getCollaborativeRecommendations(user.id, limit);
          break;

        default:
          recommendations = await getPersonalizedRecommendations(user.id, limit);
      }

      return NextResponse.json({
        success: true,
        recommendations,
        type,
        user_id: user.id,
      });
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get recommendations' },
        { status: 500 }
      );
    }
  }
);

// Similar apps based on content similarity
async function getSimilarApps(appId: string, limit: number) {
  const query = `
    WITH target_app AS (
      SELECT category, platforms, tags, price
      FROM apps
      WHERE id = $1 AND status = 'approved'
    ),
    similarity_scores AS (
      SELECT 
        a.*,
        u.name as developer_name,
        u.developer_verified,
        -- Category similarity (40% weight)
        CASE WHEN a.category = ta.category THEN 0.4 ELSE 0 END +
        -- Platform overlap (30% weight)
        (CASE WHEN a.platforms && ta.platforms THEN 0.3 ELSE 0 END) +
        -- Tag similarity (20% weight)
        (CASE WHEN a.tags && ta.tags THEN 0.2 ELSE 0 END) +
        -- Price similarity (10% weight)
        (CASE 
          WHEN ABS(a.price - ta.price) <= 500 THEN 0.1
          WHEN ABS(a.price - ta.price) <= 1000 THEN 0.05
          ELSE 0
        END) as similarity_score
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      CROSS JOIN target_app ta
      WHERE a.id != $1 
        AND a.status = 'approved'
    )
    SELECT *
    FROM similarity_scores
    WHERE similarity_score > 0.2
    ORDER BY similarity_score DESC, rating_average DESC, rating_count DESC
    LIMIT $2
  `;

  return // await neonClient.sql(query, [appId, limit]);
}

// Personalized recommendations based on user behavior and preferences
async function getPersonalizedRecommendations(userId: string, limit: number) {
  const query = `
    WITH user_profile AS (
      -- Get user's purchase history and preferences
      SELECT 
        ARRAY_AGG(DISTINCT a.category) as purchased_categories,
        ARRAY_AGG(DISTINCT unnest(a.platforms)) as used_platforms,
        ARRAY_AGG(DISTINCT unnest(a.tags)) as interested_tags,
        AVG(a.price) as avg_price_range,
        COUNT(*) as total_purchases
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE p.user_id = $1 AND p.status = 'completed'
    ),
    user_ratings AS (
      -- Get user's rating patterns
      SELECT 
        ARRAY_AGG(DISTINCT a.category) as highly_rated_categories,
        AVG(r.rating) as avg_given_rating
      FROM reviews r
      JOIN apps a ON r.app_id = a.id
      WHERE r.user_id = $1 AND r.rating >= 4
    ),
    recommendation_scores AS (
      SELECT 
        a.*,
        u.name as developer_name,
        u.developer_verified,
        -- Category preference score (35% weight)
        (CASE
          WHEN up.purchased_categories IS NOT NULL AND a.category = ANY(up.purchased_categories) THEN 0.35
          WHEN ur.highly_rated_categories IS NOT NULL AND a.category = ANY(ur.highly_rated_categories) THEN 0.25
          ELSE 0.1
        END) +
        -- Platform compatibility (25% weight)
        (CASE
          WHEN up.used_platforms IS NOT NULL AND a.platforms && up.used_platforms THEN 0.25
          ELSE 0.05
        END) +
        -- Tag interest (20% weight)
        (CASE
          WHEN up.interested_tags IS NOT NULL AND a.tags && up.interested_tags THEN 0.2
          ELSE 0.05
        END) +
        -- Price compatibility (10% weight)
        (CASE 
          WHEN up.avg_price_range IS NULL THEN 0.1
          WHEN ABS(a.price - up.avg_price_range) <= 1000 THEN 0.1
          WHEN ABS(a.price - up.avg_price_range) <= 2000 THEN 0.05
          ELSE 0.02
        END) +
        -- Quality score (10% weight)
        (COALESCE(a.rating_average, 0) / 5.0 * 0.1) as recommendation_score
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      CROSS JOIN user_profile up
      LEFT JOIN user_ratings ur ON true
      WHERE a.status = 'approved'
        AND a.id NOT IN (
          SELECT app_id FROM purchases 
          WHERE user_id = $1 AND status = 'completed'
        )
    )
    SELECT *
    FROM recommendation_scores
    WHERE recommendation_score > 0.3
    ORDER BY recommendation_score DESC, rating_average DESC, rating_count DESC
    LIMIT $2
  `;

  return // await neonClient.sql(query, [userId, limit]);
}

// Trending apps based on recent activity
async function getTrendingApps(limit: number) {
  const query = `
    WITH trending_scores AS (
      SELECT 
        a.*,
        u.name as developer_name,
        u.developer_verified,
        -- Recent purchases (40% weight)
        COALESCE(recent_purchases.purchase_count, 0) * 0.4 +
        -- Recent reviews (30% weight)
        COALESCE(recent_reviews.review_count, 0) * 0.3 +
        -- Rating quality (20% weight)
        (COALESCE(a.rating_average, 0) / 5.0 * 0.2) +
        -- Recency bonus (10% weight)
        (CASE 
          WHEN a.created_at > NOW() - INTERVAL '30 days' THEN 0.1
          WHEN a.created_at > NOW() - INTERVAL '90 days' THEN 0.05
          ELSE 0
        END) as trending_score
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      LEFT JOIN (
        SELECT 
          app_id,
          COUNT(*) as purchase_count
        FROM purchases
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND status = 'completed'
        GROUP BY app_id
      ) recent_purchases ON a.id = recent_purchases.app_id
      LEFT JOIN (
        SELECT 
          app_id,
          COUNT(*) as review_count
        FROM reviews
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY app_id
      ) recent_reviews ON a.id = recent_reviews.app_id
      WHERE a.status = 'approved'
    )
    SELECT *
    FROM trending_scores
    ORDER BY trending_score DESC, rating_average DESC
    LIMIT $1
  `;

  return // await neonClient.sql(query, [limit]);
}

// Category-based recommendations
async function getCategoryBasedRecommendations(userId: string, limit: number) {
  const query = `
    WITH user_categories AS (
      SELECT 
        a.category,
        COUNT(*) as interaction_count,
        AVG(COALESCE(r.rating, 4)) as avg_rating
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      LEFT JOIN reviews r ON r.app_id = a.id AND r.user_id = p.user_id
      WHERE p.user_id = $1 AND p.status = 'completed'
      GROUP BY a.category
      ORDER BY interaction_count DESC, avg_rating DESC
      LIMIT 3
    )
    SELECT 
      a.*,
      u.name as developer_name,
      u.developer_verified,
      uc.interaction_count,
      uc.avg_rating as category_preference
    FROM apps a
    JOIN users u ON a.developer_id = u.id
    JOIN user_categories uc ON a.category = uc.category
    WHERE a.status = 'approved'
      AND a.id NOT IN (
        SELECT app_id FROM purchases 
        WHERE user_id = $1 AND status = 'completed'
      )
    ORDER BY 
      uc.interaction_count DESC,
      a.rating_average DESC,
      a.rating_count DESC
    LIMIT $2
  `;

  return // await neonClient.sql(query, [userId, limit]);
}

// Collaborative filtering recommendations
async function getCollaborativeRecommendations(userId: string, limit: number) {
  const query = `
    WITH similar_users AS (
      -- Find users with similar purchase patterns
      SELECT 
        p2.user_id,
        COUNT(*) as common_apps,
        AVG(ABS(r1.rating - r2.rating)) as rating_similarity
      FROM purchases p1
      JOIN purchases p2 ON p1.app_id = p2.app_id AND p1.user_id != p2.user_id
      LEFT JOIN reviews r1 ON r1.app_id = p1.app_id AND r1.user_id = p1.user_id
      LEFT JOIN reviews r2 ON r2.app_id = p2.app_id AND r2.user_id = p2.user_id
      WHERE p1.user_id = $1 
        AND p1.status = 'completed' 
        AND p2.status = 'completed'
      GROUP BY p2.user_id
      HAVING COUNT(*) >= 2
      ORDER BY common_apps DESC, rating_similarity ASC
      LIMIT 10
    ),
    collaborative_recommendations AS (
      SELECT 
        a.*,
        u.name as developer_name,
        u.developer_verified,
        COUNT(DISTINCT su.user_id) as similar_user_purchases,
        AVG(r.rating) as avg_rating_from_similar_users
      FROM similar_users su
      JOIN purchases p ON p.user_id = su.user_id
      JOIN apps a ON a.id = p.app_id
      JOIN users u ON a.developer_id = u.id
      LEFT JOIN reviews r ON r.app_id = a.id AND r.user_id = su.user_id
      WHERE p.status = 'completed'
        AND a.status = 'approved'
        AND a.id NOT IN (
          SELECT app_id FROM purchases 
          WHERE user_id = $1 AND status = 'completed'
        )
      GROUP BY a.id, u.id, u.name, u.developer_verified
    )
    SELECT *
    FROM collaborative_recommendations
    ORDER BY 
      similar_user_purchases DESC,
      avg_rating_from_similar_users DESC,
      rating_average DESC
    LIMIT $2
  `;

  return // await neonClient.sql(query, [userId, limit]);
}
