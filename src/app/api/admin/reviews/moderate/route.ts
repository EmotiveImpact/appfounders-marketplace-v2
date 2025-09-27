import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface ReviewModerationRequest {
  review_id: string;
  action: 'approve' | 'reject' | 'flag' | 'unflag';
  reason?: string;
  notify_user?: boolean;
}

// POST /api/admin/reviews/moderate - Moderate a review
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { review_id, action, reason, notify_user = true }: ReviewModerationRequest = await req.json();

      if (!review_id || !action) {
        return NextResponse.json(
          { error: 'Review ID and action are required' },
          { status: 400 }
        );
      }

      if (!['approve', 'reject', 'flag', 'unflag'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }

      if ((action === 'reject' || action === 'flag') && !reason) {
        return NextResponse.json(
          { error: 'Reason is required for reject and flag actions' },
          { status: 400 }
        );
      }

      // Get review information
      const reviewQuery = `
        SELECT 
          r.*,
          a.name as app_name,
          u.name as reviewer_name,
          u.email as reviewer_email
        FROM reviews r
        JOIN apps a ON r.app_id = a.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `;

      const reviewResult = // await neonClient.sql(reviewQuery, [review_id]);

      if (reviewResult.length === 0) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }

      const review = reviewResult[0];

      // Update review based on action
      let updateQuery = '';
      let updateParams: any[] = [];
      let newStatus = review.status;

      switch (action) {
        case 'approve':
          updateQuery = `
            UPDATE reviews 
            SET 
              status = 'approved',
              moderated_by = $1,
              moderated_at = NOW(),
              moderation_reason = NULL,
              updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
          updateParams = [user.id, review_id];
          newStatus = 'approved';
          break;

        case 'reject':
          updateQuery = `
            UPDATE reviews 
            SET 
              status = 'rejected',
              moderated_by = $1,
              moderated_at = NOW(),
              moderation_reason = $2,
              updated_at = NOW()
            WHERE id = $3
            RETURNING *
          `;
          updateParams = [user.id, reason, review_id];
          newStatus = 'rejected';
          break;

        case 'flag':
          updateQuery = `
            UPDATE reviews 
            SET 
              status = 'flagged',
              moderated_by = $1,
              moderated_at = NOW(),
              moderation_reason = $2,
              updated_at = NOW()
            WHERE id = $3
            RETURNING *
          `;
          updateParams = [user.id, reason, review_id];
          newStatus = 'flagged';
          break;

        case 'unflag':
          updateQuery = `
            UPDATE reviews 
            SET 
              status = 'approved',
              moderated_by = $1,
              moderated_at = NOW(),
              moderation_reason = NULL,
              updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
          updateParams = [user.id, review_id];
          newStatus = 'approved';
          break;
      }

      const updatedReview = // await neonClient.sql(updateQuery, updateParams);

      // Update app rating if review was approved or rejected
      if (action === 'approve' || action === 'reject') {
        await updateAppRating(review.app_id);
      }

      // Log moderation activity
      const activityQuery = `
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      // await neonClient.sql(activityQuery, [
        user.id,
        'review_moderated',
        JSON.stringify({
          review_id,
          app_id: review.app_id,
          app_name: review.app_name,
          reviewer_id: review.user_id,
          reviewer_name: review.reviewer_name,
          action,
          reason,
          previous_status: review.status,
          new_status: newStatus,
        }),
      ]);

      // Send notification email to reviewer if needed
      if (notify_user && (action === 'reject' || action === 'flag')) {
        try {
          const emailSubject = action === 'reject' 
            ? `Your review for ${review.app_name} was not approved`
            : `Your review for ${review.app_name} has been flagged`;

          const emailTemplate = action === 'reject' ? 'review-rejected' : 'review-flagged';

          await sendEmail({
            to: review.reviewer_email,
            subject: emailSubject,
            template: emailTemplate,
            data: {
              reviewer_name: review.reviewer_name,
              app_name: review.app_name,
              review_content: review.content,
              reason,
              moderation_date: new Date().toLocaleDateString(),
              guidelines_url: `${process.env.NEXT_PUBLIC_APP_URL}/guidelines`,
              support_url: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
            },
          });
        } catch (emailError) {
          console.error('Failed to send moderation notification email:', emailError);
          // Don't fail the moderation if email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Review ${action}ed successfully`,
        review: updatedReview[0],
      });
    } catch (error: any) {
      console.error('Error moderating review:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to moderate review' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);

// Helper function to update app rating
async function updateAppRating(appId: string) {
  try {
    const ratingQuery = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as review_count
      FROM reviews 
      WHERE app_id = $1 AND status = 'approved'
    `;

    const ratingResult = // await neonClient.sql(ratingQuery, [appId]);
    const { average_rating, review_count } = ratingResult[0];

    // await neonClient.sql(
      'UPDATE apps SET rating_average = $1, rating_count = $2 WHERE id = $3',
      [
        average_rating ? parseFloat(average_rating).toFixed(2) : 0,
        parseInt(review_count) || 0,
        appId,
      ]
    );
  } catch (error) {
    console.error('Error updating app rating:', error);
  }
}

// GET /api/admin/reviews/moderate - Get reviews that need moderation
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || 'pending';
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const reviewsQuery = `
        SELECT 
          r.*,
          a.name as app_name,
          u.name as reviewer_name,
          u.email as reviewer_email,
          moderator.name as moderator_name
        FROM reviews r
        JOIN apps a ON r.app_id = a.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN users moderator ON r.moderated_by = moderator.id
        WHERE r.status = $1
        ORDER BY r.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const reviews = // await neonClient.sql(reviewsQuery, [status, limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews
        WHERE status = $1
      `;

      const countResult = // await neonClient.sql(countQuery, [status]);
      const total = parseInt(countResult[0]?.total || '0');

      return NextResponse.json({
        success: true,
        reviews,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error: any) {
      console.error('Error fetching reviews for moderation:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch reviews for moderation' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
