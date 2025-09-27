import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/admin/app-submissions - Get all app submissions for admin review
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

      if (status && ['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
        whereClause = `WHERE a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get app submissions with developer information
      const submissionsQuery = `
        SELECT 
          a.id,
          a.name,
          a.description,
          a.short_description,
          a.category,
          a.price,
          a.platform,
          a.version,
          a.minimum_os_version,
          a.website_url,
          a.support_url,
          a.privacy_policy_url,
          a.terms_of_service_url,
          a.tags,
          a.features,
          a.status,
          a.icon_url,
          a.screenshots,
          a.app_file_url,
          a.developer_id,
          u.name as developer_name,
          u.email as developer_email,
          a.submitted_at,
          a.reviewed_at,
          a.reviewed_by,
          a.rejection_reason,
          a.created_at,
          a.updated_at,
          reviewed_by_user.name as reviewed_by_name
        FROM apps a
        JOIN users u ON a.developer_id = u.id
        LEFT JOIN users reviewed_by_user ON a.reviewed_by = reviewed_by_user.id
        ${whereClause}
        ORDER BY 
          CASE a.status 
            WHEN 'pending' THEN 1
            WHEN 'in_review' THEN 2
            WHEN 'approved' THEN 3
            WHEN 'rejected' THEN 4
          END,
          a.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      // For now, return mock data since we don't have a real database setup
      const submissions: any[] = [];

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM apps a
        ${whereClause}
      `;

      // For now, return mock data since we don't have a real database setup
      const total = 0;

      // Get status counts
      const statusCountsQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM apps
        GROUP BY status
      `;

      // For now, return mock data since we don't have a real database setup
      const statusCounts: any[] = [];

      return NextResponse.json({
        success: true,
        submissions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        statusCounts: statusCounts.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
      });
    } catch (error: any) {
      console.error('Error fetching app submissions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch app submissions' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
