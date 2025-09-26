import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  updateReview,
  deleteReview,
  markReviewHelpful,
  addDeveloperResponse
} from '@/lib/reviews/review-system';

// PUT /api/reviews/[id] - Update a review
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { rating, title, content } = body;

      // Validate required fields
      if (!rating || !title || !content) {
        return NextResponse.json(
          { error: 'Rating, title, and content are required' },
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

      // Update review
      const review = await updateReview(
        id,
        user.id,
        rating,
        title.trim(),
        content.trim()
      );

      return NextResponse.json({
        success: true,
        review,
        message: 'Review updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating review:', error);
      
      if (error.message === 'Review not found or access denied') {
        return NextResponse.json(
          { error: 'Review not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to update review' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// DELETE /api/reviews/[id] - Delete a review
export const DELETE = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;

      await deleteReview(id, user.id);

      return NextResponse.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      
      if (error.message === 'Review not found or access denied') {
        return NextResponse.json(
          { error: 'Review not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to delete review' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// POST /api/reviews/[id] - Mark as helpful or add developer response
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { action, content } = body;

      if (action === 'helpful') {
        // Mark review as helpful
        await markReviewHelpful(id, user.id);

        return NextResponse.json({
          success: true,
          message: 'Review helpfulness updated',
        });
      } else if (action === 'respond') {
        // Add developer response
        if (!content || content.trim().length === 0) {
          return NextResponse.json(
            { error: 'Response content is required' },
            { status: 400 }
          );
        }

        if (content.length > 1000) {
          return NextResponse.json(
            { error: 'Response must be 1000 characters or less' },
            { status: 400 }
          );
        }

        const response = await addDeveloperResponse(
          id,
          user.id,
          content.trim()
        );

        return NextResponse.json({
          success: true,
          response,
          message: 'Developer response added successfully',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Error processing review action:', error);
      
      if (error.message === 'Access denied or review not found') {
        return NextResponse.json(
          { error: 'Access denied or review not found' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to process action' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
