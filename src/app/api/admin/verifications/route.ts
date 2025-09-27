import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/admin/verifications - Get all developer verifications for admin review
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Build query conditions
      let whereClause = '';
      const params: any[] = [];
      let paramIndex = 1;

      if (status && ['pending', 'in_review', 'verified', 'rejected'].includes(status)) {
        whereClause = `WHERE dv.verification_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get verifications with user information
      const verificationsQuery = `
        SELECT 
          dv.id,
          dv.user_id,
          u.name as user_name,
          u.email as user_email,
          dv.legal_name,
          dv.date_of_birth,
          dv.phone_number,
          dv.address,
          dv.business_type,
          dv.business_name,
          dv.business_registration_number,
          dv.business_address,
          dv.tax_id_type,
          dv.tax_country,
          dv.identity_document_type,
          dv.identity_document_front,
          dv.identity_document_back,
          dv.verification_status,
          dv.submitted_at,
          dv.verified_at,
          dv.verified_by,
          dv.rejection_reason,
          dv.created_at,
          dv.updated_at,
          verified_by_user.name as verified_by_name
        FROM developer_verifications dv
        JOIN users u ON dv.user_id = u.id
        LEFT JOIN users verified_by_user ON dv.verified_by = verified_by_user.id
        ${whereClause}
        ORDER BY 
          CASE dv.verification_status 
            WHEN 'in_review' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'rejected' THEN 3
            WHEN 'verified' THEN 4
          END,
          dv.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const verifications = // await neonClient.sql(verificationsQuery, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM developer_verifications dv
        ${whereClause}
      `;

      const countResult = // await neonClient.sql(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult[0]?.total || '0');

      // Get status counts
      const statusCountsQuery = `
        SELECT 
          verification_status,
          COUNT(*) as count
        FROM developer_verifications
        GROUP BY verification_status
      `;

      const statusCounts = // await neonClient.sql(statusCountsQuery);

      return NextResponse.json({
        success: true,
        verifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        statusCounts: statusCounts.reduce((acc, row) => {
          acc[row.verification_status] = parseInt(row.count);
          return acc;
        }, {}),
      });
    } catch (error: any) {
      console.error('Error fetching verifications:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch verifications' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
