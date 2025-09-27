import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface AccessRestorationRequest {
  purchase_id?: string;
  license_id?: string;
  user_id?: string;
  app_id?: string;
  restoration_type: 'purchase' | 'license' | 'user_app_access';
  reason: string;
  notify_user?: boolean;
}

// POST /api/admin/access/restore - Restore access for purchases or licenses
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const {
        purchase_id,
        license_id,
        user_id,
        app_id,
        restoration_type,
        reason,
        notify_user = true,
      }: AccessRestorationRequest = await req.json();

      if (!reason || !restoration_type) {
        return NextResponse.json(
          { error: 'Reason and restoration type are required' },
          { status: 400 }
        );
      }

      let affectedRecords = [];
      let notificationData: any = {};

      switch (restoration_type) {
        case 'purchase':
          if (!purchase_id) {
            return NextResponse.json(
              { error: 'Purchase ID is required for purchase restoration' },
              { status: 400 }
            );
          }

          // Get purchase information
          const purchaseQuery = `
            SELECT 
              p.*,
              a.name as app_name,
              u.name as user_name,
              u.email as user_email
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            JOIN users u ON p.user_id = u.id
            WHERE p.id = $1 AND p.status = 'revoked'
          `;

          const purchaseResult = await neonClient.sql`
            SELECT p.*, a.name as app_name
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            WHERE p.id = ${purchase_id}
          `;

          if (purchaseResult.length === 0) {
            return NextResponse.json(
              { error: 'Revoked purchase not found' },
              { status: 404 }
            );
          }

          const purchase = purchaseResult[0];

          // Restore purchase access
          await neonClient.sql`
            UPDATE purchases
            SET status = 'completed', revoked_at = NULL, revocation_reason = NULL
            WHERE id = ${purchase_id}
          `;

          // Restore associated licenses
          await neonClient.sql`
            UPDATE app_licenses
            SET status = 'active', updated_at = NOW()
            WHERE purchase_id = ${purchase_id} AND status = 'revoked'
          `;

          affectedRecords.push(purchase);
          notificationData = {
            user_name: purchase.user_name,
            user_email: purchase.user_email,
            app_name: purchase.app_name,
            type: 'purchase',
          };
          break;

        case 'license':
          if (!license_id) {
            return NextResponse.json(
              { error: 'License ID is required for license restoration' },
              { status: 400 }
            );
          }

          // Get license information
          const licenseResult = await neonClient.sql`
            SELECT
              l.*,
              a.name as app_name,
              u.name as user_name,
              u.email as user_email
            FROM app_licenses l
            JOIN apps a ON l.app_id = a.id
            JOIN users u ON l.user_id = u.id
            WHERE l.id = ${license_id} AND l.status = 'revoked'
          `;

          if (licenseResult.length === 0) {
            return NextResponse.json(
              { error: 'Revoked license not found' },
              { status: 404 }
            );
          }

          const licenseData = licenseResult[0];

          // Check if license has expired
          const isExpired = licenseData.expires_at && new Date(licenseData.expires_at) < new Date();
          const newStatus = isExpired ? 'expired' : 'active';

          // Restore license
          await neonClient.sql`
            UPDATE app_licenses
            SET status = ${newStatus}, updated_at = NOW()
            WHERE id = ${license_id}
          `;

          affectedRecords.push(licenseData);
          notificationData = {
            user_name: licenseData.user_name,
            user_email: licenseData.user_email,
            app_name: licenseData.app_name,
            license_key: licenseData.license_key,
            type: 'license',
            status: newStatus,
          };
          break;

        case 'user_app_access':
          if (!user_id || !app_id) {
            return NextResponse.json(
              { error: 'User ID and App ID are required for user app access restoration' },
              { status: 400 }
            );
          }

          // Get user and app information
          const userAppResult = await neonClient.sql`
            SELECT
              u.name as user_name,
              u.email as user_email,
              a.name as app_name
            FROM users u, apps a
            WHERE u.id = ${user_id} AND a.id = ${app_id}
          `;

          if (userAppResult.length === 0) {
            return NextResponse.json(
              { error: 'User or app not found' },
              { status: 404 }
            );
          }

          const userApp = userAppResult[0];

          // Restore all revoked purchases for this user and app
          const restoredPurchases = await neonClient.sql`
            UPDATE purchases
            SET status = 'completed', revoked_at = NULL, revocation_reason = NULL
            WHERE user_id = ${user_id} AND app_id = ${app_id} AND status = 'revoked'
            RETURNING *
          `;

          // Restore associated licenses
          await neonClient.sql`
            UPDATE app_licenses
            SET status = CASE
              WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
              ELSE 'active'
            END,
            updated_at = NOW()
            WHERE user_id = ${user_id} AND app_id = ${app_id} AND status = 'revoked'
          `;

          affectedRecords = restoredPurchases;
          notificationData = {
            user_name: userApp.user_name,
            user_email: userApp.user_email,
            app_name: userApp.app_name,
            type: 'user_app_access',
          };
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid restoration type' },
            { status: 400 }
          );
      }

      // Log the restoration activity
      await neonClient.sql`
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES (
          ${user.id},
          'access_restored',
          ${JSON.stringify({
            restoration_type,
            reason,
            affected_records: affectedRecords.length,
            purchase_id,
            license_id,
            user_id,
            app_id,
            restored_by: user.name,
          })},
          NOW()
        )
      `;

      // Send notification email to affected user
      if (notify_user && notificationData.user_email) {
        try {
          let emailSubject = '';
          let emailTemplate = '';

          switch (restoration_type) {
            case 'purchase':
              emailSubject = `Access restored for ${notificationData.app_name}`;
              emailTemplate = 'access-restored-purchase';
              break;
            case 'license':
              emailSubject = `License restored for ${notificationData.app_name}`;
              emailTemplate = 'access-restored-license';
              break;
            case 'user_app_access':
              emailSubject = `Access restored for ${notificationData.app_name}`;
              emailTemplate = 'access-restored-app';
              break;
          }

          await sendEmail({
            to: notificationData.user_email,
            subject: emailSubject,
            html: `
              <h2>${emailSubject}</h2>
              <p>Your access has been restored.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Restoration Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${app_id || 'apps'}">Visit App</a></p>
            `,
            text: `Your access has been restored. Reason: ${reason}. Restoration Date: ${new Date().toLocaleDateString()}`
          });
        } catch (emailError) {
          console.error('Failed to send restoration notification email:', emailError);
          // Don't fail the restoration if email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Access restored successfully`,
        restoration_type,
        affected_records: affectedRecords.length,
        reason,
      });
    } catch (error: any) {
      console.error('Error restoring access:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to restore access' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
