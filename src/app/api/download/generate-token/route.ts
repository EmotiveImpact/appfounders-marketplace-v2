import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { generateSecureDownloadToken, validateDownloadAccess } from '@/lib/download/secure-delivery';
import { neonClient } from '@/lib/database/neon-client';

interface TokenRequest {
  fileKey: string;
  appId?: string;
  category?: string;
  expiresIn?: number; // seconds
}

// POST /api/download/generate-token - Generate secure download token
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { fileKey, appId, category, expiresIn = 3600 } = await req.json() as TokenRequest;

      if (!fileKey) {
        return NextResponse.json(
          { error: 'File key is required' },
          { status: 400 }
        );
      }

      // Validate download access
      const hasAccess = await validateDownloadAccess(user.id, fileKey, appId, category);
      
      if (!hasAccess.allowed) {
        return NextResponse.json(
          { error: hasAccess.reason || 'Access denied' },
          { status: 403 }
        );
      }

      // Generate secure download token
      const tokenData = await generateSecureDownloadToken(
        user.id,
        fileKey,
        expiresIn,
        {
          appId,
          category,
          userAgent: req.headers.get('user-agent') || undefined,
          ipAddress: req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown',
        }
      );

      // Log token generation
      await neonClient.sql`
        INSERT INTO download_access_logs (
          user_id,
          file_key,
          action,
          ip_address,
          user_agent,
          metadata,
          created_at
        )
        VALUES (
          ${user.id},
          ${fileKey},
          'token_generated',
          ${tokenData.metadata.ipAddress},
          ${tokenData.metadata.userAgent || null},
          ${JSON.stringify({ appId, category, expiresIn })},
          NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        downloadUrl: `/api/download/${tokenData.token}`,
        token: tokenData.token,
        expiresIn,
        expiresAt: tokenData.expiresAt,
        metadata: {
          fileName: hasAccess.fileInfo?.fileName,
          fileSize: hasAccess.fileInfo?.fileSize,
          fileType: hasAccess.fileInfo?.fileType,
        },
      });
    } catch (error: any) {
      console.error('Error generating download token:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate download token' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// GET /api/download/generate-token - Get download token info (for debugging)
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const token = searchParams.get('token');

      if (!token) {
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 400 }
        );
      }

      // Get token info from database
      const result = await neonClient.sql`
        SELECT 
          dt.*,
          dal.action,
          dal.created_at as last_access
        FROM download_tokens dt
        LEFT JOIN download_access_logs dal ON dt.file_key = dal.file_key 
          AND dal.user_id = dt.user_id
        WHERE dt.token = ${token}
        AND dt.user_id = ${user.id}
        ORDER BY dal.created_at DESC
        LIMIT 1
      `;

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Token not found or access denied' },
          { status: 404 }
        );
      }

      const tokenInfo = result[0];
      const now = new Date();
      const expiresAt = new Date(tokenInfo.expires_at);
      const isExpired = now > expiresAt;

      return NextResponse.json({
        success: true,
        token: tokenInfo.token,
        fileKey: tokenInfo.file_key,
        isExpired,
        expiresAt: tokenInfo.expires_at,
        downloadCount: tokenInfo.download_count,
        maxDownloads: tokenInfo.max_downloads,
        lastAccess: tokenInfo.last_access,
        metadata: tokenInfo.metadata,
      });
    } catch (error: any) {
      console.error('Error getting token info:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get token info' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
