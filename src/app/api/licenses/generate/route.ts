import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';
import crypto from 'crypto';

interface LicenseGenerationRequest {
  purchase_id: string;
  license_type?: 'standard' | 'premium' | 'enterprise';
  custom_data?: Record<string, any>;
}

// POST /api/licenses/generate - Generate a license key for a purchase
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { purchase_id, license_type = 'standard', custom_data }: LicenseGenerationRequest = await req.json();

      if (!purchase_id) {
        return NextResponse.json(
          { error: 'Purchase ID is required' },
          { status: 400 }
        );
      }

      // Verify the purchase belongs to the user and is completed
      const purchaseQuery = `
        SELECT 
          p.*,
          a.name as app_name,
          a.developer_id,
          a.requires_license,
          u.name as user_name,
          u.email as user_email
        FROM purchases p
        JOIN apps a ON p.app_id = a.id
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1 AND p.user_id = $2 AND p.status = 'completed'
      `;

      const purchaseResult = await neonClient.sql(purchaseQuery, [purchase_id, user.id]);

      if (purchaseResult.length === 0) {
        return NextResponse.json(
          { error: 'Purchase not found or not completed' },
          { status: 404 }
        );
      }

      const purchase = purchaseResult[0];

      // Check if app requires license keys
      if (!purchase.requires_license) {
        return NextResponse.json(
          { error: 'This app does not require license keys' },
          { status: 400 }
        );
      }

      // Check if license already exists for this purchase
      const existingLicenseQuery = `
        SELECT * FROM app_licenses 
        WHERE purchase_id = $1 AND status = 'active'
      `;

      const existingLicense = await neonClient.sql(existingLicenseQuery, [purchase_id]);

      if (existingLicense.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'License already exists for this purchase',
          license: existingLicense[0],
        });
      }

      // Generate unique license key
      const licenseKey = generateLicenseKey(purchase.app_id, user.id, license_type);

      // Create license record
      const licenseQuery = `
        INSERT INTO app_licenses (
          purchase_id,
          app_id,
          user_id,
          license_key,
          license_type,
          custom_data,
          status,
          issued_at,
          expires_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW())
        RETURNING *
      `;

      // Set expiration based on license type (null for lifetime licenses)
      let expiresAt = null;
      if (license_type === 'premium') {
        // Premium licenses expire in 2 years
        expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
      } else if (license_type === 'enterprise') {
        // Enterprise licenses expire in 5 years
        expiresAt = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      const license = await neonClient.sql(licenseQuery, [
        purchase_id,
        purchase.app_id,
        user.id,
        licenseKey,
        license_type,
        custom_data ? JSON.stringify(custom_data) : null,
        'active',
        expiresAt,
      ]);

      // Log license generation activity
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
        'license_generated',
        JSON.stringify({
          license_id: license[0].id,
          app_id: purchase.app_id,
          app_name: purchase.app_name,
          license_type,
          license_key: licenseKey,
        }),
      ]);

      // Send license key email
      try {
        await sendEmail({
          to: purchase.user_email,
          subject: `🔑 Your license key for ${purchase.app_name}`,
          template: 'license-key-delivery',
          data: {
            user_name: purchase.user_name,
            app_name: purchase.app_name,
            license_key: licenseKey,
            license_type,
            expires_at: expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never',
            activation_instructions: `Use this license key to activate ${purchase.app_name}. Keep this key secure and do not share it with others.`,
            support_url: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
          },
        });
      } catch (emailError) {
        console.error('Failed to send license key email:', emailError);
        // Don't fail the license generation if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'License key generated successfully',
        license: license[0],
      });
    } catch (error: any) {
      console.error('Error generating license key:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate license key' },
        { status: 500 }
      );
    }
  }
);

// Helper function to generate license keys
function generateLicenseKey(appId: string, userId: string, licenseType: string): string {
  // Create a unique identifier combining app, user, and timestamp
  const timestamp = Date.now().toString();
  const data = `${appId}-${userId}-${timestamp}-${licenseType}`;
  
  // Generate hash
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Format as license key (XXXX-XXXX-XXXX-XXXX)
  const key = hash.substring(0, 16).toUpperCase();
  return `${key.substring(0, 4)}-${key.substring(4, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}`;
}

// GET /api/licenses/generate - Get license information for a purchase
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const purchaseId = searchParams.get('purchase_id');

      if (!purchaseId) {
        return NextResponse.json(
          { error: 'Purchase ID is required' },
          { status: 400 }
        );
      }

      // Get license information
      const licenseQuery = `
        SELECT 
          l.*,
          a.name as app_name,
          a.requires_license
        FROM app_licenses l
        JOIN apps a ON l.app_id = a.id
        WHERE l.purchase_id = $1 AND l.user_id = $2
      `;

      const license = await neonClient.sql(licenseQuery, [purchaseId, user.id]);

      if (license.length === 0) {
        return NextResponse.json({
          success: false,
          has_license: false,
          message: 'No license found for this purchase',
        });
      }

      return NextResponse.json({
        success: true,
        has_license: true,
        license: license[0],
      });
    } catch (error: any) {
      console.error('Error fetching license information:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch license information' },
        { status: 500 }
      );
    }
  }
);
