import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  getFileInfo, 
  deleteFile, 
  getPresignedDownloadUrl 
} from '@/lib/storage/s3-service';

// GET /api/files/[key] - Get file information or download URL
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { key: string } }) => {
    try {
      const { key } = params;
      const { searchParams } = new URL(req.url);
      const action = searchParams.get('action'); // 'info' or 'download'

      if (!key) {
        return NextResponse.json(
          { error: 'File key is required' },
          { status: 400 }
        );
      }

      // Decode the key (it might be URL encoded)
      const decodedKey = decodeURIComponent(key);

      // Extract user ID from key to check ownership
      const keyParts = decodedKey.split('/');
      const fileUserId = keyParts[1]; // Structure: category/userId/...

      // Check if user owns this file or is admin
      if (fileUserId !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (action === 'download') {
        // Generate presigned download URL
        const downloadUrl = await getPresignedDownloadUrl(decodedKey, 3600); // 1 hour
        
        return NextResponse.json({
          success: true,
          downloadUrl,
          expiresIn: 3600,
        });
      } else {
        // Get file information
        const fileInfo = await getFileInfo(decodedKey);
        
        return NextResponse.json({
          success: true,
          ...fileInfo,
        });
      }
    } catch (error: any) {
      console.error('Error handling file request:', error);
      
      if (error.message.includes('NoSuchKey') || error.message.includes('Not Found')) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to process file request' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// DELETE /api/files/[key] - Delete a file
export const DELETE = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { key: string } }) => {
    try {
      const { key } = params;

      if (!key) {
        return NextResponse.json(
          { error: 'File key is required' },
          { status: 400 }
        );
      }

      // Decode the key
      const decodedKey = decodeURIComponent(key);

      // Extract user ID from key to check ownership
      const keyParts = decodedKey.split('/');
      const fileUserId = keyParts[1];

      // Check if user owns this file or is admin
      if (fileUserId !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Delete the file from S3
      await deleteFile(decodedKey);

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      
      if (error.message.includes('NoSuchKey') || error.message.includes('Not Found')) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to delete file' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
