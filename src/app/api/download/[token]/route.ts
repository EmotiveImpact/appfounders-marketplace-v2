import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, logDownloadAccess } from '@/lib/download/secure-delivery';
import { getPresignedDownloadUrl } from '@/lib/storage/s3-service';

interface RouteParams {
  params: {
    token: string;
  };
}

// GET /api/download/[token] - Download file using secure token
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Download token is required' },
        { status: 400 }
      );
    }

    // Get client information
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Validate download token
    const validation = await validateDownloadToken(token, {
      userAgent,
      ipAddress,
    });

    if (!validation.valid) {
      // Log failed attempt
      await logDownloadAccess(
        validation.tokenData?.user_id || 'unknown',
        validation.tokenData?.file_key || token,
        'download_failed',
        ipAddress,
        userAgent,
        { reason: validation.reason, token }
      );

      return NextResponse.json(
        { error: validation.reason || 'Invalid or expired token' },
        { status: validation.reason?.includes('expired') ? 410 : 403 }
      );
    }

    const { tokenData, fileInfo } = validation;

    try {
      // Generate presigned download URL
      const downloadUrl = await getPresignedDownloadUrl(tokenData.file_key, 300); // 5 minutes

      // Log successful download
      await logDownloadAccess(
        tokenData.user_id,
        tokenData.file_key,
        'download_started',
        ipAddress,
        userAgent,
        {
          token,
          fileName: fileInfo?.fileName,
          fileSize: fileInfo?.fileSize,
        }
      );

      // Redirect to the actual file
      return NextResponse.redirect(downloadUrl);

    } catch (error: any) {
      console.error('Error generating download URL:', error);
      
      // Log error
      await logDownloadAccess(
        tokenData.user_id,
        tokenData.file_key,
        'download_error',
        ipAddress,
        userAgent,
        { error: error.message, token }
      );

      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Download token validation error:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}

// POST /api/download/[token] - Get download info without starting download
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params;
    const { action } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Download token is required' },
        { status: 400 }
      );
    }

    // Get client information
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Validate download token
    const validation = await validateDownloadToken(token, {
      userAgent,
      ipAddress,
      skipDownloadCount: action === 'info', // Don't increment download count for info requests
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'Invalid or expired token' },
        { status: validation.reason?.includes('expired') ? 410 : 403 }
      );
    }

    const { tokenData, fileInfo } = validation;

    if (action === 'info') {
      // Return file information without starting download
      return NextResponse.json({
        success: true,
        fileInfo: {
          fileName: fileInfo?.fileName,
          fileSize: fileInfo?.fileSize,
          fileType: fileInfo?.fileType,
          fileKey: tokenData.file_key,
        },
        tokenInfo: {
          expiresAt: tokenData.expires_at,
          downloadCount: tokenData.download_count,
          maxDownloads: tokenData.max_downloads,
          remainingDownloads: tokenData.max_downloads - tokenData.download_count,
        },
      });
    } else if (action === 'stream') {
      // For streaming downloads (future implementation)
      return NextResponse.json({
        error: 'Streaming downloads not yet implemented',
      }, { status: 501 });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "info" or "stream"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Download token info error:', error);
    return NextResponse.json(
      { error: 'Failed to get download info' },
      { status: 500 }
    );
  }
}
