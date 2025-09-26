import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

// Validate required environment variables
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`Missing AWS environment variables: ${missingVars.join(', ')}`);
}

// AWS S3 Client configuration
const s3Config: S3ClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// Create S3 client instance
export const s3Client = new S3Client(s3Config);

// Storage configuration
export const storageConfig = {
  bucket: process.env.AWS_S3_BUCKET_NAME || 'appfounders-uploads',
  region: process.env.AWS_REGION || 'us-east-1',
  
  // File size limits (in bytes)
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB for images
    video: 100 * 1024 * 1024, // 100MB for videos
    document: 50 * 1024 * 1024, // 50MB for documents
    app: 500 * 1024 * 1024, // 500MB for app files
  },
  
  // Allowed file types
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    app: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  },
  
  // Storage paths
  paths: {
    userAvatars: 'users/avatars',
    appScreenshots: 'apps/screenshots',
    appIcons: 'apps/icons',
    appFiles: 'apps/files',
    documents: 'documents',
    temp: 'temp',
  },
  
  // CDN configuration
  cdn: {
    enabled: process.env.AWS_CLOUDFRONT_DOMAIN ? true : false,
    domain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
  },
  
  // Backup configuration
  backup: {
    enabled: process.env.AWS_BACKUP_BUCKET ? true : false,
    bucket: process.env.AWS_BACKUP_BUCKET || '',
    retentionDays: 30,
  },

  // CORS configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-domain.com',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['*'],
    maxAge: 3600,
  },
};

// Helper function to get file URL
export function getFileUrl(key: string): string {
  if (storageConfig.cdn.enabled && storageConfig.cdn.domain) {
    return `https://${storageConfig.cdn.domain}/${key}`;
  }
  
  return `https://${storageConfig.bucket}.s3.${storageConfig.region}.amazonaws.com/${key}`;
}

// Helper function to generate file key
export function generateFileKey(
  category: keyof typeof storageConfig.paths,
  userId: string,
  filename: string,
  appId?: string
): string {
  const timestamp = Date.now();
  const basePath = storageConfig.paths[category];
  
  // Clean filename
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (appId) {
    return `${basePath}/${userId}/${appId}/${timestamp}_${cleanFilename}`;
  }
  
  return `${basePath}/${userId}/${timestamp}_${cleanFilename}`;
}

// Helper function to validate file type
export function validateFileType(
  file: File,
  category: keyof typeof storageConfig.allowedTypes
): boolean {
  const allowedTypes = storageConfig.allowedTypes[category];
  return allowedTypes.includes(file.type);
}

// Helper function to validate file size
export function validateFileSize(
  file: File,
  category: keyof typeof storageConfig.maxFileSize
): boolean {
  const maxSize = storageConfig.maxFileSize[category];
  return file.size <= maxSize;
}

// Helper function to get file category from MIME type
export function getFileCategoryFromMimeType(mimeType: string): keyof typeof storageConfig.allowedTypes | null {
  for (const [category, types] of Object.entries(storageConfig.allowedTypes)) {
    if (types.includes(mimeType)) {
      return category as keyof typeof storageConfig.allowedTypes;
    }
  }
  return null;
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
