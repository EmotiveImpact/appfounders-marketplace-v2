import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { 
  generateS3Key, 
  getPresignedUploadUrl, 
  validateFileType, 
  validateFileSize,
  FILE_CATEGORIES 
} from '@/lib/aws/s3-config';

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  appId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, fileSize, category, appId }: UploadRequest = await request.json();

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, fileSize, category' },
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

    // Validate file category
    if (!Object.values(FILE_CATEGORIES).includes(category as any)) {
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
    if (!validateFileType(mockFile, category)) {
      return NextResponse.json(
        { error: `File type ${fileType} not allowed for category ${category}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(mockFile)) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size (100MB)' },
        { status: 400 }
      );
    }

    // Generate S3 key
    const s3Key = generateS3Key(category, user.id, fileName);

    // Get presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(s3Key, fileType);

    // Store file metadata in database (optional)
    // This could be used to track uploads and associate them with apps/users
    const fileMetadata = {
      key: s3Key,
      fileName,
      fileType,
      fileSize,
      category,
      userId: user.id,
      appId: appId || null,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      uploadUrl,
      key: s3Key,
      metadata: fileMetadata,
    });

  } catch (error: any) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve file metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing file key parameter' },
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

    // TODO: Retrieve file metadata from database
    // For now, return basic info extracted from key
    const keyParts = key.split('/');
    const category = keyParts[0];
    const userId = keyParts[1];
    const fileName = keyParts[2]?.split('-').slice(1).join('-');

    // Check if user owns this file or has permission to access it
    if (userId !== user.id && user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      key,
      fileName,
      category,
      userId,
      // Add more metadata as needed
    });

  } catch (error: any) {
    console.error('File metadata retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve file metadata' },
      { status: 500 }
    );
  }
}
