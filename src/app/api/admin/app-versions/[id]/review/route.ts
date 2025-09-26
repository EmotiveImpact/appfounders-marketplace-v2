import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface VersionReviewRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
  auto_update_app?: boolean; // Whether to update the main app record with this version
}

// POST /api/admin/app-versions/[id]/review - Review an app version
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { action, rejection_reason, auto_update_app = false }: VersionReviewRequest = await req.json();
      const versionId = params.id;

      // Validate input
      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      if (action === 'reject' && (!rejection_reason || rejection_reason.trim().length === 0)) {
        return NextResponse.json(
          { error: 'Rejection reason is required when rejecting a version' },
          { status: 400 }
        );
      }

      // Get the app version with app and developer information
      const versionQuery = `
        SELECT 
          av.*,
          a.name as app_name,
          a.developer_id,
          u.name as developer_name,
          u.email as developer_email
        FROM app_versions av
        JOIN apps a ON av.app_id = a.id
        JOIN users u ON a.developer_id = u.id
        WHERE av.id = $1
      `;

      const versionResult = await neonClient.sql(versionQuery, [versionId]);

      if (versionResult.length === 0) {
        return NextResponse.json(
          { error: 'App version not found' },
          { status: 404 }
        );
      }

      const version = versionResult[0];

      // Check if version is in a reviewable state
      if (version.status !== 'pending') {
        return NextResponse.json(
          { error: 'App version cannot be reviewed in its current state' },
          { status: 400 }
        );
      }

      // Update version status
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const updateVersionQuery = `
        UPDATE app_versions 
        SET 
          status = $1,
          reviewed_at = NOW(),
          reviewed_by = $2,
          rejection_reason = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const updatedVersion = await neonClient.sql(updateVersionQuery, [
        newStatus,
        user.id,
        action === 'reject' ? rejection_reason : null,
        versionId,
      ]);

      // If approved and auto_update_app is true, update the main app record
      if (action === 'approve' && auto_update_app) {
        const updateAppQuery = `
          UPDATE apps 
          SET 
            version = $1,
            app_file_url = COALESCE($2, app_file_url),
            screenshots = COALESCE($3, screenshots),
            minimum_os_version = COALESCE($4, minimum_os_version),
            updated_at = NOW()
          WHERE id = $5
        `;

        await neonClient.sql(updateAppQuery, [
          version.version,
          version.app_file_url,
          version.screenshots,
          version.minimum_os_version,
          version.app_id,
        ]);
      }

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
        'app_version_review',
        JSON.stringify({
          version_id: versionId,
          app_id: version.app_id,
          app_name: version.app_name,
          version: version.version,
          action,
          rejection_reason: action === 'reject' ? rejection_reason : null,
          auto_updated_app: auto_update_app,
        }),
      ]);

      // Send notification email to developer
      try {
        const emailTemplate = action === 'approve' ? 'app-version-approved' : 'app-version-rejected';
        const emailSubject = action === 'approve' 
          ? `✅ Version ${version.version} of "${version.app_name}" approved!`
          : `📝 Version ${version.version} of "${version.app_name}" needs revision`;

        const emailData = {
          developer_name: version.developer_name,
          app_name: version.app_name,
          version: version.version,
          changelog: version.changelog,
          rejection_reason: action === 'reject' ? rejection_reason : undefined,
          review_date: new Date().toLocaleDateString(),
          reviewer_name: user.name,
          breaking_changes: version.breaking_changes,
          app_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${version.app_id}`,
        };

        await sendEmail({
          to: version.developer_email,
          subject: emailSubject,
          template: emailTemplate,
          data: emailData,
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't fail the request if email fails
      }

      // If approved, notify users who have purchased the app
      if (action === 'approve') {
        try {
          // Get users who have purchased this app and want update notifications
          const purchasersQuery = `
            SELECT DISTINCT u.id, u.email, u.name
            FROM users u
            JOIN purchases p ON u.id = p.user_id
            WHERE p.app_id = $1 AND p.status = 'completed'
            AND u.notification_preferences->>'app_updates' = 'true'
          `;

          const purchasers = await neonClient.sql(purchasersQuery, [version.app_id]);

          // Send update notifications (async, don't wait)
          if (purchasers.length > 0) {
            Promise.all(
              purchasers.map(async (purchaser) => {
                try {
                  await sendEmail({
                    to: purchaser.email,
                    subject: `📱 ${version.app_name} v${version.version} is now available!`,
                    template: 'app-update-available',
                    data: {
                      user_name: purchaser.name,
                      app_name: version.app_name,
                      version: version.version,
                      changelog: version.changelog,
                      breaking_changes: version.breaking_changes,
                      release_notes: version.release_notes,
                      app_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${version.app_id}`,
                    },
                  });
                } catch (error) {
                  console.error(`Failed to send update notification to ${purchaser.email}:`, error);
                }
              })
            ).catch(console.error);
          }

          // Log developer activity
          await neonClient.sql(activityQuery, [
            version.developer_id,
            'app_version_approved',
            JSON.stringify({
              version_id: versionId,
              app_id: version.app_id,
              app_name: version.app_name,
              version: version.version,
              approved_by: user.name,
              notified_users: purchasers.length,
            }),
          ]);
        } catch (error) {
          console.error('Failed to send update notifications:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `App version ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        version: updatedVersion[0],
      });
    } catch (error: any) {
      console.error('Error reviewing app version:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to review app version' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
