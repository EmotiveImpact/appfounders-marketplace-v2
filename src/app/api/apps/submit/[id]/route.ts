import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  getSubmission,
  updateAppSubmission,
  validateSubmission,
  submitForReview
} from '@/lib/app/submission-workflow';

// GET /api/apps/submit/[id] - Get specific submission
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const submission = await getSubmission(id);

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      // Check ownership (developers can only see their own, admins can see all)
      if (user.role !== 'admin' && submission.developer_id !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        submission,
      });
    } catch (error: any) {
      console.error('Error getting submission:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get submission' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// PUT /api/apps/submit/[id] - Update submission
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await req.json();

      // Verify submission exists and user has access
      const existingSubmission = await getSubmission(id);
      if (!existingSubmission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      if (existingSubmission.developer_id !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Check if submission can be edited
      if (['submitted', 'under_review', 'approved', 'published'].includes(existingSubmission.status)) {
        return NextResponse.json(
          { error: 'Cannot edit submission in current status' },
          { status: 400 }
        );
      }

      // Update submission
      const updatedSubmission = await updateAppSubmission(id, user.id, body);

      return NextResponse.json({
        success: true,
        submission: updatedSubmission,
        message: 'Submission updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating submission:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update submission' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// POST /api/apps/submit/[id]/validate - Validate submission
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { action } = body;

      if (action === 'validate') {
        // Validate submission
        const validation = await validateSubmission(id);

        return NextResponse.json({
          success: true,
          validation,
        });
      } else if (action === 'submit') {
        // Submit for review
        const submission = await submitForReview(id, user.id);

        return NextResponse.json({
          success: true,
          submission,
          message: 'App submitted for review successfully',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('Error processing submission action:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to process action' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);
