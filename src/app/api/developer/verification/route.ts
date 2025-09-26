import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendNotification } from '@/lib/notifications/service';

interface VerificationData {
  legal_name: string;
  date_of_birth: string;
  phone_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  business_type: 'individual' | 'business';
  business_name?: string;
  business_registration_number?: string;
  business_address?: any;
  tax_id: string;
  tax_id_type: 'ssn' | 'ein' | 'itin' | 'other';
  tax_country: string;
  identity_document_type: 'passport' | 'drivers_license' | 'national_id';
  identity_document_front?: string;
  identity_document_back?: string;
  bank_account: {
    account_holder_name: string;
    account_number: string;
    routing_number: string;
    bank_name: string;
    account_type: 'checking' | 'savings';
  };
  verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
  submitted_at?: string;
}

// POST /api/developer/verification - Submit developer verification
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const data: VerificationData = await req.json();

      // Validate required fields
      if (!data.legal_name || !data.date_of_birth || !data.phone_number) {
        return NextResponse.json(
          { error: 'Personal information is required' },
          { status: 400 }
        );
      }

      if (!data.tax_id || !data.tax_id_type) {
        return NextResponse.json(
          { error: 'Tax information is required' },
          { status: 400 }
        );
      }

      if (!data.identity_document_front) {
        return NextResponse.json(
          { error: 'Identity document is required' },
          { status: 400 }
        );
      }

      if (!data.bank_account.account_holder_name || !data.bank_account.account_number) {
        return NextResponse.json(
          { error: 'Banking information is required' },
          { status: 400 }
        );
      }

      // Check if user is a developer
      if (user.role !== 'developer') {
        return NextResponse.json(
          { error: 'Only developers can submit verification' },
          { status: 403 }
        );
      }

      // Check if verification already exists
      const existingVerification = await neonClient.sql`
        SELECT id, verification_status 
        FROM developer_verifications 
        WHERE user_id = ${user.id}
        LIMIT 1
      `;

      if (existingVerification.length > 0) {
        const status = existingVerification[0].verification_status;
        if (status === 'verified') {
          return NextResponse.json(
            { error: 'Developer is already verified' },
            { status: 400 }
          );
        }
        if (status === 'in_review') {
          return NextResponse.json(
            { error: 'Verification is already under review' },
            { status: 400 }
          );
        }
      }

      // Encrypt sensitive data (in production, use proper encryption)
      const encryptedTaxId = Buffer.from(data.tax_id).toString('base64');
      const encryptedBankAccount = Buffer.from(JSON.stringify(data.bank_account)).toString('base64');

      // Insert or update verification data
      if (existingVerification.length > 0) {
        await neonClient.sql`
          UPDATE developer_verifications
          SET 
            legal_name = ${data.legal_name},
            date_of_birth = ${data.date_of_birth},
            phone_number = ${data.phone_number},
            address = ${JSON.stringify(data.address)},
            business_type = ${data.business_type},
            business_name = ${data.business_name || null},
            business_registration_number = ${data.business_registration_number || null},
            business_address = ${JSON.stringify(data.business_address || {})},
            tax_id_encrypted = ${encryptedTaxId},
            tax_id_type = ${data.tax_id_type},
            tax_country = ${data.tax_country},
            identity_document_type = ${data.identity_document_type},
            identity_document_front = ${data.identity_document_front},
            identity_document_back = ${data.identity_document_back || null},
            bank_account_encrypted = ${encryptedBankAccount},
            verification_status = 'in_review',
            submitted_at = NOW(),
            updated_at = NOW()
          WHERE user_id = ${user.id}
        `;
      } else {
        await neonClient.sql`
          INSERT INTO developer_verifications (
            user_id,
            legal_name,
            date_of_birth,
            phone_number,
            address,
            business_type,
            business_name,
            business_registration_number,
            business_address,
            tax_id_encrypted,
            tax_id_type,
            tax_country,
            identity_document_type,
            identity_document_front,
            identity_document_back,
            bank_account_encrypted,
            verification_status,
            submitted_at,
            created_at,
            updated_at
          )
          VALUES (
            ${user.id},
            ${data.legal_name},
            ${data.date_of_birth},
            ${data.phone_number},
            ${JSON.stringify(data.address)},
            ${data.business_type},
            ${data.business_name || null},
            ${data.business_registration_number || null},
            ${JSON.stringify(data.business_address || {})},
            ${encryptedTaxId},
            ${data.tax_id_type},
            ${data.tax_country},
            ${data.identity_document_type},
            ${data.identity_document_front},
            ${data.identity_document_back || null},
            ${encryptedBankAccount},
            'in_review',
            NOW(),
            NOW(),
            NOW()
          )
        `;
      }

      // Log the submission
      await neonClient.sql`
        INSERT INTO user_activity_logs (
          user_id,
          action,
          details,
          created_at
        )
        VALUES (
          ${user.id},
          'verification_submitted',
          ${JSON.stringify({
            business_type: data.business_type,
            tax_country: data.tax_country,
            identity_document_type: data.identity_document_type,
          })},
          NOW()
        )
      `;

      // Send notification to user
      try {
        await sendNotification(
          user.id,
          'verification_submitted',
          'Verification Submitted',
          'Your developer verification has been submitted and is under review. We will notify you within 2-3 business days.',
          {
            type: 'verification_submitted',
            business_type: data.business_type,
          }
        );
      } catch (notificationError) {
        console.error('Failed to send verification notification:', notificationError);
      }

      // Notify admins about new verification
      try {
        const adminUsers = await neonClient.sql`
          SELECT id FROM users WHERE role = 'admin'
        `;

        for (const admin of adminUsers) {
          await sendNotification(
            admin.id,
            'new_verification',
            'New Developer Verification',
            `${data.legal_name} has submitted developer verification and requires review.`,
            {
              type: 'admin_verification_review',
              user_id: user.id,
              user_name: data.legal_name,
              business_type: data.business_type,
            }
          );
        }
      } catch (adminNotificationError) {
        console.error('Failed to send admin notification:', adminNotificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Verification submitted successfully',
        verification: {
          status: 'in_review',
          submitted_at: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to submit verification' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// GET /api/developer/verification - Get verification status
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const verification = await neonClient.sql`
        SELECT 
          verification_status,
          submitted_at,
          verified_at,
          rejection_reason,
          legal_name,
          business_type,
          business_name,
          created_at
        FROM developer_verifications
        WHERE user_id = ${user.id}
        LIMIT 1
      `;

      if (verification.length === 0) {
        return NextResponse.json({
          success: true,
          verification: null,
        });
      }

      const verificationData = verification[0];

      return NextResponse.json({
        success: true,
        verification: {
          status: verificationData.verification_status,
          submitted_at: verificationData.submitted_at,
          verified_at: verificationData.verified_at,
          rejection_reason: verificationData.rejection_reason,
          legal_name: verificationData.legal_name,
          business_type: verificationData.business_type,
          business_name: verificationData.business_name,
          created_at: verificationData.created_at,
        },
      });
    } catch (error: any) {
      console.error('Error fetching verification status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch verification status' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);
