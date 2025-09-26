import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, storageConfig, generateFileKey, getFileUrl } from './aws-config';

export interface UploadOptions {
  userId: string;
  category: keyof typeof storageConfig.paths;
  appId?: string;
  metadata?: Record<string, string>;
  contentType?: string;
  cacheControl?: string;
  isPublic?: boolean;
}

export interface FileInfo {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  filename: string,
  options: UploadOptions
): Promise<{ key: string; url: string }> {
  try {
    const { userId, category, appId, metadata = {}, contentType, cacheControl, isPublic = false } = options;

    // Generate unique file key
    const key = generateFileKey(category, userId, filename, appId);

    // Prepare upload parameters
    const uploadParams = {
      Bucket: storageConfig.bucket,
      Key: key,
      Body: file,
      ContentType: contentType || 'application/octet-stream',
      CacheControl: cacheControl || 'max-age=31536000', // 1 year
      Metadata: {
        ...metadata,
        userId,
        category,
        uploadedAt: new Date().toISOString(),
        ...(appId && { appId }),
      },
      ...(isPublic && { ACL: 'public-read' }),
    };

    // Upload file
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Return file info
    return {
      key,
      url: getFileUrl(key),
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Get a presigned URL for uploading
 */
export async function getPresignedUploadUrl(
  filename: string,
  options: UploadOptions,
  expiresIn: number = 3600 // 1 hour
): Promise<{ uploadUrl: string; key: string; fileUrl: string }> {
  try {
    const { userId, category, appId, contentType, isPublic = false } = options;

    // Generate unique file key
    const key = generateFileKey(category, userId, filename, appId);

    // Prepare upload parameters
    const uploadParams = {
      Bucket: storageConfig.bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
      ...(isPublic && { ACL: 'public-read' }),
    };

    // Generate presigned URL
    const command = new PutObjectCommand(uploadParams);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      fileUrl: getFileUrl(key),
    };
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

/**
 * Get a presigned URL for downloading
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Get file information
 */
export async function getFileInfo(key: string): Promise<FileInfo> {
  try {
    const command = new HeadObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      key,
      url: getFileUrl(key),
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting file info from S3:', error);
    throw new Error('Failed to get file information');
  }
}

/**
 * Copy a file within S3
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string,
  metadata?: Record<string, string>
): Promise<void> {
  try {
    const command = new CopyObjectCommand({
      Bucket: storageConfig.bucket,
      CopySource: `${storageConfig.bucket}/${sourceKey}`,
      Key: destinationKey,
      ...(metadata && { Metadata: metadata, MetadataDirective: 'REPLACE' }),
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error copying file in S3:', error);
    throw new Error('Failed to copy file');
  }
}

/**
 * List files in a directory
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 100
): Promise<FileInfo[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: storageConfig.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    const files: FileInfo[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key) {
          files.push({
            key: object.Key,
            url: getFileUrl(object.Key),
            size: object.Size || 0,
            contentType: 'application/octet-stream', // Would need separate call to get this
            lastModified: object.LastModified || new Date(),
          });
        }
      }
    }

    return files;
  } catch (error) {
    console.error('Error listing files from S3:', error);
    throw new Error('Failed to list files');
  }
}

/**
 * Move a file to backup bucket
 */
export async function backupFile(key: string): Promise<void> {
  if (!storageConfig.backup.enabled || !storageConfig.backup.bucket) {
    throw new Error('Backup is not configured');
  }

  try {
    const command = new CopyObjectCommand({
      Bucket: storageConfig.backup.bucket,
      CopySource: `${storageConfig.bucket}/${key}`,
      Key: key,
      Metadata: {
        backedUpAt: new Date().toISOString(),
        originalBucket: storageConfig.bucket,
      },
      MetadataDirective: 'REPLACE',
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error backing up file:', error);
    throw new Error('Failed to backup file');
  }
}

/**
 * Clean up old temporary files
 */
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const tempFiles = await listFiles(storageConfig.paths.temp);
    
    let deletedCount = 0;
    
    for (const file of tempFiles) {
      if (file.lastModified < cutoffDate) {
        await deleteFile(file.key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    throw new Error('Failed to cleanup temp files');
  }
}
