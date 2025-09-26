import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  createReview,
  getAppReviews,
  getReviewStats,
  markReviewHelpful
} from '@/lib/reviews/review-system';

// GET /api/reviews - Get reviews for an app
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('app_id');
    const rating = searchParams.get('rating');
    const verified_only = searchParams.get('verified_only') === 'true';
    const sort_by = searchParams.get('sort_by') as any;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!appId) {
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      );
    }

    const filters = {
      rating: rating ? parseInt(rating) : undefined,
      verified_only,
      sort_by: sort_by || 'newest',
      limit,
      offset,
    };

    const reviews = await getAppReviews(appId, filters);

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error: any) {
    console.error('Error getting reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { app_id, rating, title, content } = body;

      // Validate required fields
      if (!app_id || !rating || !title || !content) {
        return NextResponse.json(
          { error: 'App ID, rating, title, and content are required' },
          { status: 400 }
        );
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }

      // Validate content length
      if (title.trim().length === 0 || title.length > 200) {
        return NextResponse.json(
          { error: 'Title must be between 1 and 200 characters' },
          { status: 400 }
        );
      }

      if (content.trim().length < 10 || content.length > 2000) {
        return NextResponse.json(
          { error: 'Content must be between 10 and 2000 characters' },
          { status: 400 }
        );
      }

      // Create review
      const review = await createReview(
        user.id,
        app_id,
        rating,
        title.trim(),
        content.trim()
      );

      return NextResponse.json({
        success: true,
        review,
        message: 'Review created successfully',
      });
    } catch (error: any) {
      console.error('Error creating review:', error);
      
      // Handle specific error cases
      if (error.message === 'You have already reviewed this app') {
        return NextResponse.json(
          { error: 'You have already reviewed this app' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create review' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
