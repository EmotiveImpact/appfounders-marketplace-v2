import { NextRequest, NextResponse } from 'next/server';
import { neonClient } from '@/lib/database/neon-client';

interface LicenseValidationRequest {
  license_key: string;
  app_id: string;
  machine_id?: string;
  user_info?: Record<string, any>;
}

// POST /api/licenses/validate - Validate a license key
export async function POST(req: NextRequest) {
  try {
    const { license_key, app_id, machine_id, user_info }: LicenseValidationRequest = await req.json();

    if (!license_key || !app_id) {
      return NextResponse.json(
        { error: 'License key and app ID are required' },
        { status: 400 }
      );
    }

    // Get license information
    const licenseQuery = `
      SELECT 
        l.*,
        a.name as app_name,
        a.status as app_status,
        u.name as user_name,
        u.email as user_email,
        p.status as purchase_status
      FROM app_licenses l
      JOIN apps a ON l.app_id = a.id
      JOIN users u ON l.user_id = u.id
      JOIN purchases p ON l.purchase_id = p.id
      WHERE l.license_key = $1 AND l.app_id = $2
    `;

    const licenseResult = // await neonClient.sql(licenseQuery, [license_key, app_id]);

    if (licenseResult.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid license key',
        error_code: 'INVALID_LICENSE',
      }, { status: 400 });
    }

    const license = licenseResult[0];

    // Check if license is active
    if (license.status !== 'active') {
      return NextResponse.json({
        valid: false,
        error: 'License is not active',
        error_code: 'LICENSE_INACTIVE',
        status: license.status,
      }, { status: 400 });
    }

    // Check if license has expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      // Update license status to expired
      // await neonClient.sql(
        'UPDATE app_licenses SET status = $1 WHERE id = $2',
        ['expired', license.id]
      );

      return NextResponse.json({
        valid: false,
        error: 'License has expired',
        error_code: 'LICENSE_EXPIRED',
        expires_at: license.expires_at,
      }, { status: 400 });
    }

    // Check if app is still available
    if (license.app_status !== 'approved') {
      return NextResponse.json({
        valid: false,
        error: 'App is no longer available',
        error_code: 'APP_UNAVAILABLE',
      }, { status: 400 });
    }

    // Check if purchase is still valid
    if (license.purchase_status !== 'completed') {
      return NextResponse.json({
        valid: false,
        error: 'Purchase is not valid',
        error_code: 'INVALID_PURCHASE',
      }, { status: 400 });
    }

    // Log license validation
    const validationQuery = `
      INSERT INTO license_validations (
        license_id,
        app_id,
        user_id,
        machine_id,
        user_info,
        validation_result,
        validated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    // await neonClient.sql(validationQuery, [
      license.id,
      app_id,
      license.user_id,
      machine_id,
      user_info ? JSON.stringify(user_info) : null,
      'success',
    ]);

    // Update last validated timestamp
    // await neonClient.sql(
      'UPDATE app_licenses SET last_validated_at = NOW() WHERE id = $1',
      [license.id]
    );

    return NextResponse.json({
      valid: true,
      license: {
        id: license.id,
        license_key: license.license_key,
        license_type: license.license_type,
        issued_at: license.issued_at,
        expires_at: license.expires_at,
        custom_data: license.custom_data,
      },
      app: {
        id: license.app_id,
        name: license.app_name,
      },
      user: {
        id: license.user_id,
        name: license.user_name,
        email: license.user_email,
      },
      validation_timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error validating license:', error);
    
    // Log failed validation attempt
    try {
      const { license_key, app_id } = await req.json();
      // await neonClient.sql(
        `INSERT INTO license_validations (
          license_id, app_id, validation_result, error_message, validated_at
        ) VALUES (NULL, $1, $2, $3, NOW())`,
        [app_id, 'error', error.message]
      );
    } catch (logError) {
      console.error('Failed to log validation error:', logError);
    }

    return NextResponse.json(
      { 
        valid: false,
        error: 'License validation failed',
        error_code: 'VALIDATION_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET /api/licenses/validate - Get license validation history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const licenseKey = searchParams.get('license_key');
    const appId = searchParams.get('app_id');

    if (!licenseKey || !appId) {
      return NextResponse.json(
        { error: 'License key and app ID are required' },
        { status: 400 }
      );
    }

    // Get license validation history
    const historyQuery = `
      SELECT 
        lv.*,
        l.license_type,
        a.name as app_name
      FROM license_validations lv
      LEFT JOIN app_licenses l ON lv.license_id = l.id
      LEFT JOIN apps a ON lv.app_id = a.id
      WHERE l.license_key = $1 AND lv.app_id = $2
      ORDER BY lv.validated_at DESC
      LIMIT 50
    `;

    const history = // await neonClient.sql(historyQuery, [licenseKey, appId]);

    return NextResponse.json({
      success: true,
      validation_history: history,
    });
  } catch (error: any) {
    console.error('Error fetching validation history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch validation history' },
      { status: 500 }
    );
  }
}
