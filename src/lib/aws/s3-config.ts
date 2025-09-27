import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// S3 Client configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 Configuration constants
export const S3_CONFIG = {
  bucketName: process.env.AWS_S3_BUCKET_NAME!,
  region: process.env.AWS_REGION!,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain', 'application/zip'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
} as const;

// File type categories
export const FILE_CATEGORIES = {
  APP_SCREENSHOTS: 'app-screenshots',
  APP_BINARIES: 'app-binaries',
  USER_AVATARS: 'user-avatars',
  APP_ICONS: 'app-icons',
  DOCUMENTS: 'documents',
  VIDEOS: 'videos',
} as const;

// Generate S3 key for file
export function generateS3Key(category: string, userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${category}/${userId}/${timestamp}-${sanitizedFileName}`;
}

// Get presigned URL for file upload
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Get presigned URL for file download
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Delete file from S3
export async function deleteS3File(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

// Validate file type
export function validateFileType(file: File, category: string): boolean {
  const { type } = file;
  
  switch (category) {
    case FILE_CATEGORIES.APP_SCREENSHOTS:
    case FILE_CATEGORIES.APP_ICONS:
    case FILE_CATEGORIES.USER_AVATARS:
      return S3_CONFIG.allowedImageTypes.includes(type as any);
    
    case FILE_CATEGORIES.DOCUMENTS:
      return S3_CONFIG.allowedDocumentTypes.includes(type as any);
    
    case FILE_CATEGORIES.VIDEOS:
      return S3_CONFIG.allowedVideoTypes.includes(type as any);
    
    case FILE_CATEGORIES.APP_BINARIES:
      // Allow common binary types
      return [
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
        'application/x-executable',
        'application/x-msdownload',
        'application/vnd.apple.installer+xml',
        'application/x-debian-package',
      ].includes(type);
    
    default:
      return false;
  }
}

// Validate file size
export function validateFileSize(file: File): boolean {
  return file.size <= S3_CONFIG.maxFileSize;
}

// Get public URL for file
export function getPublicFileUrl(key: string): string {
  return `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
}

// Extract file extension
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

// Generate thumbnail key for images
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split('/');
  const fileName = parts.pop();
  const path = parts.join('/');
  const nameWithoutExt = fileName?.split('.').slice(0, -1).join('.');
  const ext = getFileExtension(fileName || '');
  
  return `${path}/thumbnails/${nameWithoutExt}_thumb.${ext}`;
}
