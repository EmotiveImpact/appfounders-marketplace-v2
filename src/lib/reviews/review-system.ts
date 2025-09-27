import { neonClient } from '@/lib/database/neon-client';
import { sendNotification } from '@/lib/notifications/service';

export interface Review {
  id: string;
  user_id: string;
  app_id: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  verified_purchase: boolean;
  status: 'active' | 'hidden' | 'flagged' | 'deleted';
  created_at: Date;
  updated_at: Date;
  user_name?: string;
  user_avatar?: string;
  developer_response?: DeveloperResponse;
}

export interface DeveloperResponse {
  id: string;
  review_id: string;
  developer_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: Review[];
}

export interface ReviewFilters {
  rating?: number;
  verified_only?: boolean;
  sort_by?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
  limit?: number;
  offset?: number;
}

/**
 * Create a new review
 */
export async function createReview(
  userId: string,
  appId: string,
  rating: number,
  title: string,
  content: string
): Promise<Review> {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has purchased the app
    const purchaseResult = await neonClient.sql`
      SELECT id FROM purchases
      WHERE user_id = ${userId} 
      AND app_id = ${appId} 
      AND status = 'completed'
      LIMIT 1
    `;

    const verifiedPurchase = purchaseResult.length > 0;

    // Check if user has already reviewed this app
    const existingReviewResult = await neonClient.sql`
      SELECT id FROM reviews
      WHERE user_id = ${userId} AND app_id = ${appId}
      LIMIT 1
    `;

    if (existingReviewResult.length > 0) {
      throw new Error('You have already reviewed this app');
    }

    // Create review
    const result = await neonClient.sql`
      INSERT INTO reviews (
        user_id, app_id, rating, title, content, 
        verified_purchase, status, created_at, updated_at
      )
      VALUES (
        ${userId}, ${appId}, ${rating}, ${title}, ${content},
        ${verifiedPurchase}, 'active', NOW(), NOW()
      )
      RETURNING *
    `;

    const review = result[0] as Review;

    // Update app's average rating
    await updateAppRating(appId);

    // Notify app developer
    const appResult = await neonClient.sql`
      SELECT developer_id, name FROM apps WHERE id = ${appId} LIMIT 1
    `;

    if (appResult.length > 0) {
      const app = appResult[0];
      await sendNotification(
        app.developer_id,
        'new_review' as any,
        'New Review Received',
        `Your app "${app.name}" received a ${rating}-star review.`,
        { app_id: appId, review_id: review.id, rating }
      );
    }

    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Update an existing review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  rating: number,
  title: string,
  content: string
): Promise<Review> {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Verify ownership
    const ownershipResult = await neonClient.sql`
      SELECT app_id FROM reviews 
      WHERE id = ${reviewId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (ownershipResult.length === 0) {
      throw new Error('Review not found or access denied');
    }

    const appId = ownershipResult[0].app_id;

    // Update review
    const result = await neonClient.sql`
      UPDATE reviews 
      SET 
        rating = ${rating},
        title = ${title},
        content = ${content},
        updated_at = NOW()
      WHERE id = ${reviewId}
      RETURNING *
    `;

    const review = result[0] as Review;

    // Update app's average rating
    await updateAppRating(appId);

    return review;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  try {
    // Verify ownership
    const ownershipResult = await neonClient.sql`
      SELECT app_id FROM reviews 
      WHERE id = ${reviewId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (ownershipResult.length === 0) {
      throw new Error('Review not found or access denied');
    }

    const appId = ownershipResult[0].app_id;

    // Soft delete review
    await neonClient.sql`
      UPDATE reviews 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = ${reviewId}
    `;

    // Update app's average rating
    await updateAppRating(appId);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

/**
 * Get reviews for an app
 */
export async function getAppReviews(
  appId: string,
  filters: ReviewFilters = {}
): Promise<Review[]> {
  try {
    const {
      rating,
      verified_only = false,
      sort_by = 'newest',
      limit = 20,
      offset = 0
    } = filters;

    // Build WHERE clause
    let whereClause = `WHERE r.app_id = $1 AND r.status = 'active'`;
    const params: any[] = [appId];
    let paramIndex = 2;

    if (rating) {
      whereClause += ` AND r.rating = $${paramIndex}`;
      params.push(rating);
      paramIndex++;
    }

    if (verified_only) {
      whereClause += ` AND r.verified_purchase = true`;
    }

    // Build ORDER BY clause
    let orderClause = '';
    switch (sort_by) {
      case 'newest':
        orderClause = 'ORDER BY r.created_at DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY r.created_at ASC';
        break;
      case 'highest_rated':
        orderClause = 'ORDER BY r.rating DESC, r.created_at DESC';
        break;
      case 'lowest_rated':
        orderClause = 'ORDER BY r.rating ASC, r.created_at DESC';
        break;
      case 'most_helpful':
        orderClause = 'ORDER BY r.helpful_count DESC, r.created_at DESC';
        break;
    }

    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await neonClient.sql(query, params);
    const reviews = result as Review[];

    // Get developer responses for each review
    for (const review of reviews) {
      const responseResult = await neonClient.sql`
        SELECT * FROM developer_responses
        WHERE review_id = ${review.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (responseResult.length > 0) {
        review.developer_response = responseResult[0] as DeveloperResponse;
      }
    }

    return reviews;
  } catch (error) {
    console.error('Error getting app reviews:', error);
    throw new Error('Failed to get app reviews');
  }
}

/**
 * Get review statistics for an app
 */
export async function getReviewStats(appId: string): Promise<ReviewStats> {
  try {
    // Get total reviews and average rating
    const statsResult = await neonClient.sql`
      SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews
      WHERE app_id = ${appId} AND status = 'active'
    `;

    const stats = statsResult[0];

    // Get rating distribution
    const distributionResult = await neonClient.sql`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE app_id = ${appId} AND status = 'active'
      GROUP BY rating
      ORDER BY rating
    `;

    const rating_distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distributionResult) {
      rating_distribution[row.rating as keyof typeof rating_distribution] = parseInt(row.count);
    }

    // Get recent reviews
    const recent_reviews = await getAppReviews(appId, { limit: 5, sort_by: 'newest' });

    return {
      total_reviews: parseInt(stats.total_reviews),
      average_rating: parseFloat(stats.average_rating),
      rating_distribution,
      recent_reviews,
    };
  } catch (error) {
    console.error('Error getting review stats:', error);
    throw new Error('Failed to get review stats');
  }
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  userId: string
): Promise<void> {
  try {
    // Check if user has already marked this review as helpful
    const existingResult = await neonClient.sql`
      SELECT id FROM review_helpful
      WHERE review_id = ${reviewId} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existingResult.length > 0) {
      // Remove helpful mark
      await neonClient.sql`
        DELETE FROM review_helpful
        WHERE review_id = ${reviewId} AND user_id = ${userId}
      `;

      await neonClient.sql`
        UPDATE reviews
        SET helpful_count = helpful_count - 1
        WHERE id = ${reviewId}
      `;
    } else {
      // Add helpful mark
      await neonClient.sql`
        INSERT INTO review_helpful (review_id, user_id, created_at)
        VALUES (${reviewId}, ${userId}, NOW())
      `;

      await neonClient.sql`
        UPDATE reviews
        SET helpful_count = helpful_count + 1
        WHERE id = ${reviewId}
      `;
    }
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    throw new Error('Failed to mark review as helpful');
  }
}

/**
 * Add developer response to review
 */
export async function addDeveloperResponse(
  reviewId: string,
  developerId: string,
  content: string
): Promise<DeveloperResponse> {
  try {
    // Verify the developer owns the app
    const verificationResult = await neonClient.sql`
      SELECT a.id FROM apps a
      JOIN reviews r ON a.id = r.app_id
      WHERE r.id = ${reviewId} AND a.developer_id = ${developerId}
      LIMIT 1
    `;

    if (verificationResult.length === 0) {
      throw new Error('Access denied or review not found');
    }

    // Check if response already exists
    const existingResult = await neonClient.sql`
      SELECT id FROM developer_responses
      WHERE review_id = ${reviewId}
      LIMIT 1
    `;

    if (existingResult.length > 0) {
      // Update existing response
      const result = await neonClient.sql`
        UPDATE developer_responses
        SET content = ${content}, updated_at = NOW()
        WHERE review_id = ${reviewId}
        RETURNING *
      `;
      return result[0] as DeveloperResponse;
    } else {
      // Create new response
      const result = await neonClient.sql`
        INSERT INTO developer_responses (
          review_id, developer_id, content, created_at, updated_at
        )
        VALUES (
          ${reviewId}, ${developerId}, ${content}, NOW(), NOW()
        )
        RETURNING *
      `;

      const response = result[0] as DeveloperResponse;

      // Notify the reviewer
      const reviewResult = await neonClient.sql`
        SELECT user_id FROM reviews WHERE id = ${reviewId} LIMIT 1
      `;

      if (reviewResult.length > 0) {
        await sendNotification(
          reviewResult[0].user_id,
          'developer_response' as any,
          'Developer Responded to Your Review',
          'The developer has responded to your review.',
          { review_id: reviewId, response_id: response.id }
        );
      }

      return response;
    }
  } catch (error) {
    console.error('Error adding developer response:', error);
    throw error;
  }
}

/**
 * Update app's average rating
 */
async function updateAppRating(appId: string): Promise<void> {
  try {
    const result = await neonClient.sql`
      SELECT 
        COUNT(*) as review_count,
        COALESCE(AVG(rating), 0) as average_rating
      FROM reviews
      WHERE app_id = ${appId} AND status = 'active'
    `;

    const stats = result[0];

    await neonClient.sql`
      UPDATE apps
      SET 
        average_rating = ${parseFloat(stats.average_rating)},
        review_count = ${parseInt(stats.review_count)},
        updated_at = NOW()
      WHERE id = ${appId}
    `;
  } catch (error) {
    console.error('Error updating app rating:', error);
    // Don't throw error as this is a background operation
  }
}
