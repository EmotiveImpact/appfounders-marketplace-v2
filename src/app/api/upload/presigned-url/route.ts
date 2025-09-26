import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getPresignedUploadUrl } from '@/lib/storage/s3-service';
import {
  validateFileType,
  validateFileSize,
  getFileCategoryFromMimeType,
  storageConfig
} from '@/lib/storage/aws-config';

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  appId?: string;
}

export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { fileName, fileType, fileSize, category, appId, isPublic = false } = await req.json();

      // Validate required fields
      if (!fileName || !fileType || !fileSize) {
        return NextResponse.json(
          { error: 'Missing required fields: fileName, fileType, fileSize' },
          { status: 400 }
        );
      }

      // Determine category if not provided
      let fileCategory = category;
      if (!fileCategory) {
        fileCategory = getFileCategoryFromMimeType(fileType);
        if (!fileCategory) {
          return NextResponse.json(
            { error: 'Unsupported file type' },
            { status: 400 }
          );
        }
      }

      // Validate file category
      if (!Object.keys(storageConfig.paths).includes(fileCategory)) {
        return NextResponse.json(
          { error: 'Invalid file category' },
          { status: 400 }
        );
      }

      // Create mock file object for validation
      const mockFile = {
        name: fileName,
        type: fileType,
        size: fileSize,
      } as File;

      // Validate file type
      if (!validateFileType(mockFile, fileCategory)) {
        return NextResponse.json(
          { error: `File type ${fileType} not allowed for category ${fileCategory}` },
          { status: 400 }
        );
      }

      // Validate file size
      if (!validateFileSize(mockFile, fileCategory)) {
        return NextResponse.json(
          { error: `File size exceeds the limit for category ${fileCategory}` },
          { status: 400 }
        );
      }

      // Generate presigned URL
      const { uploadUrl, key, fileUrl } = await getPresignedUploadUrl(
        fileName,
        {
          userId: user.id,
          category: fileCategory,
          appId,
          contentType: fileType,
          isPublic,
          metadata: {
            originalFilename: fileName,
            uploadedBy: user.email,
          },
        },
        3600 // 1 hour expiry
      );

      return NextResponse.json({
        success: true,
        uploadUrl,
        key,
        fileUrl,
        expiresIn: 3600,
        metadata: {
          fileName,
          fileType,
          fileSize,
          category: fileCategory,
          userId: user.id,
          appId: appId || null,
        },
      });
    } catch (error: any) {
      console.error('Error generating presigned URL:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate upload URL' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can upload files
  }
);

// GET endpoint to retrieve file metadata
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const key = searchParams.get('key');

      if (!key) {
        return NextResponse.json(
          { error: 'Missing file key parameter' },
          { status: 400 }
        );
      }

      // Extract info from key structure: category/userId/timestamp_filename
      const keyParts = key.split('/');
      const category = keyParts[0];
      const userId = keyParts[1];
      const filenamePart = keyParts[keyParts.length - 1];
      const fileName = filenamePart?.split('_').slice(1).join('_');

      // Check if user owns this file or has permission to access it
      if (userId !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get file info from S3
      try {
        const { getFileInfo } = await import('@/lib/storage/s3-service');
        const fileInfo = await getFileInfo(key);

        return NextResponse.json({
          success: true,
          ...fileInfo,
          fileName,
          category,
          userId,
        });
      } catch (s3Error) {
        // If file doesn't exist in S3, return basic info from key
        return NextResponse.json({
          success: true,
          key,
          fileName,
          category,
          userId,
          exists: false,
        });
      }
    } catch (error: any) {
      console.error('File metadata retrieval error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve file metadata' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
