import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendNotification } from '@/lib/notifications/service';

interface RouteParams {
  params: {
    id: string;
  };
}

interface ReviewRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

// POST /api/admin/verifications/[id]/review - Review a developer verification
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: RouteParams) => {
    try {
      const { id: verificationId } = params;
      const { action, rejection_reason }: ReviewRequest = await req.json();

      if (!verificationId) {
        return NextResponse.json(
          { error: 'Verification ID is required' },
          { status: 400 }
        );
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Valid action (approve/reject) is required' },
          { status: 400 }
        );
      }

      if (action === 'reject' && !rejection_reason?.trim()) {
        return NextResponse.json(
          { error: 'Rejection reason is required when rejecting' },
          { status: 400 }
        );
      }

      // Get verification details
      const verificationResult = await neonClient.sql`
        SELECT 
          dv.*,
          u.name as user_name,
          u.email as user_email
        FROM developer_verifications dv
        JOIN users u ON dv.user_id = u.id
        WHERE dv.id = ${verificationId}
        LIMIT 1
      `;

      if (verificationResult.length === 0) {
        return NextResponse.json(
          { error: 'Verification not found' },
          { status: 404 }
        );
      }

      const verification = verificationResult[0];

      // Check if verification is in a reviewable state
      if (!['pending', 'in_review'].includes(verification.verification_status)) {
        return NextResponse.json(
          { error: 'Verification is not in a reviewable state' },
          { status: 400 }
        );
      }

      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      const now = new Date().toISOString();

      // Update verification status
      await neonClient.sql`
        UPDATE developer_verifications
        SET 
          verification_status = ${newStatus},
          verified_by = ${user.id},
          verified_at = ${action === 'approve' ? now : null},
          rejection_reason = ${action === 'reject' ? rejection_reason : null},
          updated_at = NOW()
        WHERE id = ${verificationId}
      `;

      // Log the admin action
      await neonClient.sql`
        INSERT INTO user_activity_logs (
          user_id,
          action,
          details,
          created_at
        )
        VALUES (
          ${user.id},
          'verification_reviewed',
          ${JSON.stringify({
            verification_id: verificationId,
            developer_user_id: verification.user_id,
            developer_name: verification.legal_name,
            action,
            rejection_reason: action === 'reject' ? rejection_reason : undefined,
          })},
          NOW()
        )
      `;

      // Send notification to developer
      try {
        const notificationTitle = action === 'approve' 
          ? 'Developer Verification Approved!' 
          : 'Developer Verification Rejected';
        
        const notificationMessage = action === 'approve'
          ? 'Congratulations! Your developer verification has been approved. You can now publish apps and receive payments on the platform.'
          : `Your developer verification has been rejected. Reason: ${rejection_reason}. Please review the feedback and resubmit with corrections.`;

        await sendNotification(
          verification.user_id,
          action === 'approve' ? 'verification_approved' : 'verification_rejected',
          notificationTitle,
          notificationMessage,
          {
            type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
            verification_id: verificationId,
            rejection_reason: action === 'reject' ? rejection_reason : undefined,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send verification notification:', notificationError);
        // Don't fail the review if notification fails
      }

      // If approved, update user's verification status
      if (action === 'approve') {
        await neonClient.sql`
          UPDATE users
          SET 
            developer_verified = true,
            developer_verified_at = NOW(),
            updated_at = NOW()
          WHERE id = ${verification.user_id}
        `;
      }

      return NextResponse.json({
        success: true,
        message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        verification: {
          id: verificationId,
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: now,
          rejection_reason: action === 'reject' ? rejection_reason : null,
        },
      });
    } catch (error: any) {
      console.error('Error reviewing verification:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to review verification' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
