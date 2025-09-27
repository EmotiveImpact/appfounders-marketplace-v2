import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface AccessRevocationRequest {
  purchase_id?: string;
  user_id?: string;
  app_id?: string;
  reason: string;
  revocation_type: 'purchase' | 'user_app_access' | 'user_all_access' | 'license';
  license_id?: string;
  notify_user?: boolean;
}

// POST /api/admin/access/revoke - Revoke access for purchases, licenses, or users
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const {
        purchase_id,
        user_id,
        app_id,
        reason,
        revocation_type,
        license_id,
        notify_user = true,
      }: AccessRevocationRequest = await req.json();

      if (!reason || !revocation_type) {
        return NextResponse.json(
          { error: 'Reason and revocation type are required' },
          { status: 400 }
        );
      }

      let affectedRecords = [];
      let notificationData: any = {};

      switch (revocation_type) {
        case 'purchase':
          if (!purchase_id) {
            return NextResponse.json(
              { error: 'Purchase ID is required for purchase revocation' },
              { status: 400 }
            );
          }

          // Get purchase information
          const purchaseResult = await neonClient.sql`
            SELECT
              p.*,
              a.name as app_name,
              u.name as user_name,
              u.email as user_email
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ${purchase_id}
          `;

          if (purchaseResult.length === 0) {
            return NextResponse.json(
              { error: 'Purchase not found' },
              { status: 404 }
            );
          }

          const purchase = purchaseResult[0];

          // Revoke purchase access
          await neonClient.sql`
            UPDATE purchases
            SET status = 'revoked', revoked_at = NOW(), revocation_reason = ${reason}
            WHERE id = ${purchase_id}
          `;

          // Revoke associated licenses
          await neonClient.sql`
            UPDATE app_licenses
            SET status = 'revoked', updated_at = NOW()
            WHERE purchase_id = ${purchase_id}
          `;

          affectedRecords.push(purchase);
          notificationData = {
            user_name: purchase.user_name,
            user_email: purchase.user_email,
            app_name: purchase.app_name,
            type: 'purchase',
          };
          break;

        case 'user_app_access':
          if (!user_id || !app_id) {
            return NextResponse.json(
              { error: 'User ID and App ID are required for user app access revocation' },
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

          // Revoke all purchases for this user and app
          const revokedPurchases = await neonClient.sql`
            UPDATE purchases
            SET status = 'revoked', revoked_at = NOW(), revocation_reason = ${reason}
            WHERE user_id = ${user_id} AND app_id = ${app_id} AND status != 'revoked'
            RETURNING *
          `;

          // Revoke associated licenses
          await neonClient.sql`
            UPDATE app_licenses
            SET status = 'revoked', updated_at = NOW()
            WHERE user_id = ${user_id} AND app_id = ${app_id}
          `;

          affectedRecords = revokedPurchases;
          notificationData = {
            user_name: userApp.user_name,
            user_email: userApp.user_email,
            app_name: userApp.app_name,
            type: 'user_app_access',
          };
          break;

        case 'user_all_access':
          if (!user_id) {
            return NextResponse.json(
              { error: 'User ID is required for user all access revocation' },
              { status: 400 }
            );
          }

          // Get user information
          const userResult = await neonClient.sql`
            SELECT name, email FROM users WHERE id = ${user_id}
          `;

          if (userResult.length === 0) {
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }

          const userData = userResult[0];

          // Revoke all purchases for this user
          const allRevokedPurchases = await neonClient.sql`
            UPDATE purchases
            SET status = 'revoked', revoked_at = NOW(), revocation_reason = ${reason}
            WHERE user_id = ${user_id} AND status != 'revoked'
            RETURNING *
          `;

          // Revoke all licenses for this user
          await neonClient.sql`
            UPDATE app_licenses
            SET status = 'revoked', updated_at = NOW()
            WHERE user_id = ${user_id}
          `;

          affectedRecords = allRevokedPurchases;
          notificationData = {
            user_name: userData.name,
            user_email: userData.email,
            type: 'user_all_access',
          };
          break;

        case 'license':
          if (!license_id) {
            return NextResponse.json(
              { error: 'License ID is required for license revocation' },
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
            WHERE l.id = ${license_id}
          `;

          if (licenseResult.length === 0) {
            return NextResponse.json(
              { error: 'License not found' },
              { status: 404 }
            );
          }

          const licenseData = licenseResult[0];

          // Revoke license
          await neonClient.sql`
            UPDATE app_licenses
            SET status = 'revoked', updated_at = NOW()
            WHERE id = ${license_id}
          `;

          affectedRecords.push(licenseData);
          notificationData = {
            user_name: licenseData.user_name,
            user_email: licenseData.user_email,
            app_name: licenseData.app_name,
            license_key: licenseData.license_key,
            type: 'license',
          };
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid revocation type' },
            { status: 400 }
          );
      }

      // Log the revocation activity
      await neonClient.sql`
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES (
          ${user.id},
          'access_revoked',
          ${JSON.stringify({
            revocation_type,
            reason,
            affected_records: affectedRecords.length,
            purchase_id,
            user_id,
            app_id,
            license_id,
            revoked_by: user.name,
          })},
          NOW()
        )
      `;

      // Send notification email to affected user
      if (notify_user && notificationData.user_email) {
        try {
          let emailSubject = '';
          let emailTemplate = '';

          switch (revocation_type) {
            case 'purchase':
              emailSubject = `Access revoked for ${notificationData.app_name}`;
              emailTemplate = 'access-revoked-purchase';
              break;
            case 'user_app_access':
              emailSubject = `Access revoked for ${notificationData.app_name}`;
              emailTemplate = 'access-revoked-app';
              break;
            case 'user_all_access':
              emailSubject = 'Account access has been revoked';
              emailTemplate = 'access-revoked-all';
              break;
            case 'license':
              emailSubject = `License revoked for ${notificationData.app_name}`;
              emailTemplate = 'access-revoked-license';
              break;
          }

          await sendEmail({
            to: notificationData.user_email,
            subject: emailSubject,
            html: `
              <h2>${emailSubject}</h2>
              <p>Your access has been revoked.</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Revocation Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p>If you believe this is an error, please <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">contact support</a>.</p>
            `,
            text: `Your access has been revoked. Reason: ${reason}. Revocation Date: ${new Date().toLocaleDateString()}`
          });
        } catch (emailError) {
          console.error('Failed to send revocation notification email:', emailError);
          // Don't fail the revocation if email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Access revoked successfully`,
        revocation_type,
        affected_records: affectedRecords.length,
        reason,
      });
    } catch (error: any) {
      console.error('Error revoking access:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to revoke access' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
