import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { getPresignedDownloadUrl } from '@/lib/aws/s3-config';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    fileKey: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileKey: key } = params;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Missing file key' },
        { status: 400 }
      );
    }

    // Decode the key (it might be URL encoded)
    const decodedKey = decodeURIComponent(key);

    // Get authenticated user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the S3 key to extract information
    const keyParts = decodedKey.split('/');
    if (keyParts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid file key format' },
        { status: 400 }
      );
    }

    const category = keyParts[0];
    const fileOwnerId = keyParts[1];
    const fileName = keyParts.slice(2).join('/');

    // Check access permissions
    const hasAccess = await checkDownloadAccess(user.id, decodedKey, category, fileOwnerId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate presigned download URL
    const downloadUrl = await getPresignedDownloadUrl(decodedKey, 3600); // 1 hour expiry

    // Log the download for analytics (optional)
    await logDownload(user.id, decodedKey, fileName);

    // Return the presigned URL
    return NextResponse.json({
      downloadUrl,
      fileName,
      expiresIn: 3600,
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}

async function checkDownloadAccess(
  userId: string, 
  fileKey: string, 
  category: string, 
  fileOwnerId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Admin users have access to all files
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userData?.role === 'admin') {
      return true;
    }

    // Users can access their own files
    if (fileOwnerId === userId) {
      return true;
    }

    // For app-related files, check if user has purchased the app
    if (category === 'app-binaries' || category === 'app-screenshots') {
      // Extract app ID from file key or metadata
      // This is a simplified check - in production, you'd store file metadata in database
      const { data: purchases } = await supabase
        .from('purchases')
        .select('app_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (purchases && purchases.length > 0) {
        // Check if the file belongs to any of the purchased apps
        // This would require storing file-to-app relationships in the database
        return true; // Simplified for demo
      }
    }

    // For public files (like app screenshots for preview), allow access
    if (category === 'app-screenshots' && fileKey.includes('preview')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Access check error:', error);
    return false;
  }
}

async function logDownload(userId: string, fileKey: string, fileName: string): Promise<void> {
  try {
    const supabase = createClient();
    
    // Log the download for analytics
    await supabase
      .from('download_logs')
      .insert({
        user_id: userId,
        file_key: fileKey,
        file_name: fileName,
        downloaded_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Download logging error:', error);
    // Don't fail the download if logging fails
  }
}

// Alternative endpoint for direct file streaming (for smaller files)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileKey: key } = params;
    const { stream = false } = await request.json();

    if (!stream) {
      return NextResponse.json(
        { error: 'This endpoint is for file streaming only' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check access (same logic as GET)
    const decodedKey = decodeURIComponent(key);
    const keyParts = decodedKey.split('/');
    const category = keyParts[0];
    const fileOwnerId = keyParts[1];

    const hasAccess = await checkDownloadAccess(user.id, decodedKey, category, fileOwnerId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // For streaming, you would fetch the file from S3 and stream it
    // This is a simplified response - actual implementation would stream the file
    return NextResponse.json({
      message: 'File streaming not implemented in this demo',
      key: decodedKey,
    });

  } catch (error: any) {
    console.error('File streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to stream file' },
      { status: 500 }
    );
  }
}
