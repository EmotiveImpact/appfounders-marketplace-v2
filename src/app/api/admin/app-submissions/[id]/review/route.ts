import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface ReviewRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

// POST /api/admin/app-submissions/[id]/review - Review an app submission
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { action, rejection_reason }: ReviewRequest = await req.json();
      const submissionId = params.id;

      // Validate input
      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      if (action === 'reject' && (!rejection_reason || rejection_reason.trim().length === 0)) {
        return NextResponse.json(
          { error: 'Rejection reason is required when rejecting an app' },
          { status: 400 }
        );
      }

      // Get the app submission
      const appQuery = `
        SELECT 
          a.*,
          u.name as developer_name,
          u.email as developer_email
        FROM apps a
        JOIN users u ON a.developer_id = u.id
        WHERE a.id = $1
      `;

      const appResult = await neonClient.sql(appQuery, [submissionId]);

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App submission not found' },
          { status: 404 }
        );
      }

      const app = appResult[0];

      // Check if app is in a reviewable state
      if (!['pending', 'in_review'].includes(app.status)) {
        return NextResponse.json(
          { error: 'App submission cannot be reviewed in its current state' },
          { status: 400 }
        );
      }

      // Update app status
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const updateQuery = `
        UPDATE apps 
        SET 
          status = $1,
          reviewed_at = NOW(),
          reviewed_by = $2,
          rejection_reason = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await neonClient.sql(updateQuery, [
        newStatus,
        user.id,
        action === 'reject' ? rejection_reason : null,
        submissionId,
      ]);

      const updatedApp = updateResult[0];

      // Log the review activity
      const activityQuery = `
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      await neonClient.sql(activityQuery, [
        user.id,
        'app_review',
        JSON.stringify({
          app_id: submissionId,
          app_name: app.name,
          action,
          rejection_reason: action === 'reject' ? rejection_reason : null,
        }),
      ]);

      // Send notification email to developer
      try {
        const emailTemplate = action === 'approve' ? 'app-approved' : 'app-rejected';
        const emailSubject = action === 'approve' 
          ? `🎉 Your app "${app.name}" has been approved!`
          : `📝 Your app "${app.name}" needs revision`;

        const emailData = {
          developer_name: app.developer_name,
          app_name: app.name,
          app_id: submissionId,
          rejection_reason: action === 'reject' ? rejection_reason : undefined,
          review_date: new Date().toLocaleDateString(),
          reviewer_name: user.name,
          marketplace_url: process.env.NEXT_PUBLIC_APP_URL || 'https://appfounders.com',
        };

        await sendEmail({
          to: app.developer_email,
          subject: emailSubject,
          template: emailTemplate,
          data: emailData,
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }

      // If approved, also log developer activity
      if (action === 'approve') {
        try {
          await neonClient.sql(activityQuery, [
            app.developer_id,
            'app_approved',
            JSON.stringify({
              app_id: submissionId,
              app_name: app.name,
              approved_by: user.name,
            }),
          ]);
        } catch (error) {
          console.error('Failed to log developer activity:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `App ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        app: updatedApp,
      });
    } catch (error: any) {
      console.error('Error reviewing app submission:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to review app submission' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);

// GET /api/admin/app-submissions/[id]/review - Get review details for an app
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const submissionId = params.id;

      // Get the app submission with review history
      const appQuery = `
        SELECT 
          a.*,
          u.name as developer_name,
          u.email as developer_email,
          reviewed_by_user.name as reviewed_by_name
        FROM apps a
        JOIN users u ON a.developer_id = u.id
        LEFT JOIN users reviewed_by_user ON a.reviewed_by = reviewed_by_user.id
        WHERE a.id = $1
      `;

      const appResult = await neonClient.sql(appQuery, [submissionId]);

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App submission not found' },
          { status: 404 }
        );
      }

      const app = appResult[0];

      // Get review history from activities
      const historyQuery = `
        SELECT 
          ua.*,
          u.name as reviewer_name
        FROM user_activities ua
        JOIN users u ON ua.user_id = u.id
        WHERE ua.activity_type = 'app_review'
        AND ua.activity_data->>'app_id' = $1
        ORDER BY ua.created_at DESC
      `;

      const reviewHistory = await neonClient.sql(historyQuery, [submissionId]);

      return NextResponse.json({
        success: true,
        app,
        reviewHistory,
      });
    } catch (error: any) {
      console.error('Error fetching app review details:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch app review details' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
