import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { logDownloadAccess } from '@/lib/download/secure-delivery';

interface LogRequest {
  fileKey: string;
  fileName?: string;
  appId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// POST /api/download/log - Log download activity
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { 
        fileKey, 
        fileName, 
        appId, 
        action = 'download_completed',
        metadata = {} 
      } = await req.json() as LogRequest;

      if (!fileKey) {
        return NextResponse.json(
          { error: 'File key is required' },
          { status: 400 }
        );
      }

      // Get client information
      const userAgent = req.headers.get('user-agent') || 'unknown';
      const ipAddress = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';

      // Log the download activity
      await logDownloadAccess(
        user.id,
        fileKey,
        action,
        ipAddress,
        userAgent,
        {
          fileName,
          appId,
          ...metadata,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Download activity logged successfully',
      });
    } catch (error: any) {
      console.error('Error logging download activity:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to log download activity' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// GET /api/download/log - Get download logs (admin only)
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const fileKey = searchParams.get('fileKey');
      const userId = searchParams.get('userId');
      const action = searchParams.get('action');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (fileKey) {
        conditions.push(`file_key = $${paramIndex}`);
        params.push(fileKey);
        paramIndex++;
      }

      if (userId) {
        conditions.push(`user_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      }

      if (action) {
        conditions.push(`action = $${paramIndex}`);
        params.push(action);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get download logs
      const { neonClient } = await import('@/lib/database/neon-client');
      
      const logsQuery = `
        SELECT 
          dal.*,
          u.name as user_name,
          u.email as user_email
        FROM download_access_logs dal
        LEFT JOIN users u ON dal.user_id = u.id
        ${whereClause}
        ORDER BY dal.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const logs = // await neonClient.sql(logsQuery, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM download_access_logs dal
        ${whereClause}
      `;

      const countResult = // await neonClient.sql(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult[0]?.total || '0');

      return NextResponse.json({
        success: true,
        logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error: any) {
      console.error('Error fetching download logs:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch download logs' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
