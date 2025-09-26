# Cloud Storage Setup Guide

This guide explains how to set up AWS S3 cloud storage for the AppFounders marketplace platform.

## Overview

The platform uses AWS S3 for storing:
- **User avatars** - Profile pictures
- **App screenshots** - App gallery images
- **App icons** - App thumbnails
- **App files** - Downloadable app packages
- **Documents** - PDFs, documentation files
- **Temporary files** - Upload staging area

## Prerequisites

1. **AWS Account** - Create an account at https://aws.amazon.com
2. **IAM User** - Create a dedicated user for the application
3. **S3 Bucket** - Create a bucket for file storage
4. **CloudFront** (Optional) - CDN for faster file delivery

## Step 1: Create AWS Account

1. **Sign up for AWS**
   - Visit: https://aws.amazon.com
   - Create a new account
   - Complete billing information

2. **Access AWS Console**
   - Sign in to AWS Management Console
   - Navigate to services

## Step 2: Create IAM User

1. **Navigate to IAM**
   - Go to: https://console.aws.amazon.com/iam/
   - Click "Users" in the sidebar

2. **Create New User**
   - Click "Add users"
   - Username: `appfounders-storage`
   - Access type: "Programmatic access"

3. **Set Permissions**
   - Attach policies directly
   - Create custom policy with S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectAcl",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::appfounders-uploads/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::appfounders-uploads"
        }
    ]
}
```

4. **Save Credentials**
   - Copy Access Key ID
   - Copy Secret Access Key
   - Store securely (you won't see the secret again)

## Step 3: Create S3 Bucket

1. **Navigate to S3**
   - Go to: https://console.aws.amazon.com/s3/
   - Click "Create bucket"

2. **Configure Bucket**
   - Bucket name: `appfounders-uploads` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)
   - Keep default settings for now

3. **Set Bucket Policy**
   - Go to bucket > Permissions > Bucket policy
   - Add policy for public read access to images:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::appfounders-uploads/apps/screenshots/*"
        },
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::appfounders-uploads/apps/icons/*"
        }
    ]
}
```

4. **Configure CORS**
   - Go to bucket > Permissions > CORS
   - Add CORS configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://your-domain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

## Step 4: Environment Variables

Update your `.env.local` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=appfounders-uploads
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=appfounders-uploads
NEXT_PUBLIC_AWS_REGION=us-east-1
```

For production, use environment variables in your hosting platform.

## Step 5: CloudFront CDN (Optional)

1. **Create CloudFront Distribution**
   - Go to: https://console.aws.amazon.com/cloudfront/
   - Click "Create distribution"

2. **Configure Distribution**
   - Origin domain: `appfounders-uploads.s3.amazonaws.com`
   - Origin path: Leave empty
   - Viewer protocol policy: "Redirect HTTP to HTTPS"
   - Allowed HTTP methods: "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"

3. **Add to Environment**
   ```env
   AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
   ```

## File Organization

The platform organizes files in the following structure:

```
appfounders-uploads/
├── users/
│   └── avatars/
│       └── {userId}/
│           └── {timestamp}_{filename}
├── apps/
│   ├── screenshots/
│   │   └── {userId}/
│   │       └── {appId}/
│   │           └── {timestamp}_{filename}
│   ├── icons/
│   │   └── {userId}/
│   │       └── {appId}/
│   │           └── {timestamp}_{filename}
│   └── files/
│       └── {userId}/
│           └── {appId}/
│               └── {timestamp}_{filename}
├── documents/
│   └── {userId}/
│       └── {timestamp}_{filename}
└── temp/
    └── {userId}/
        └── {timestamp}_{filename}
```

## File Size Limits

- **Images**: 10MB maximum
- **Videos**: 100MB maximum
- **Documents**: 50MB maximum
- **App files**: 500MB maximum

## Security Features

### 1. Presigned URLs
- Temporary upload/download URLs
- Expire after 1 hour
- User-specific access control

### 2. File Validation
- MIME type checking
- File size limits
- Allowed file extensions

### 3. Access Control
- User-based file ownership
- Admin override permissions
- Public/private file settings

## Usage Examples

### Upload Component

```tsx
import { FileUpload } from '@/components/upload/file-upload';

<FileUpload
  category="image"
  appId="app-123"
  maxFiles={5}
  onUploadComplete={(files) => {
    console.log('Uploaded files:', files);
  }}
  onUploadError={(error) => {
    console.error('Upload error:', error);
  }}
/>
```

### API Usage

```typescript
// Get presigned upload URL
const response = await fetch('/api/upload/presigned-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'image.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024000,
    category: 'image',
    appId: 'app-123',
  }),
});

const { uploadUrl, key, fileUrl } = await response.json();

// Upload file to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
```

## Monitoring and Maintenance

### 1. CloudWatch Metrics
- Monitor S3 requests
- Track storage usage
- Set up billing alerts

### 2. Lifecycle Policies
- Automatically delete temp files after 7 days
- Archive old files to cheaper storage classes

### 3. Backup Strategy
- Enable versioning on important buckets
- Set up cross-region replication
- Regular backup verification

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in S3
   - Verify allowed origins include your domain

2. **Access Denied**
   - Check IAM user permissions
   - Verify bucket policy
   - Ensure credentials are correct

3. **Upload Failures**
   - Check file size limits
   - Verify MIME type restrictions
   - Check network connectivity

### Debug Mode

Enable debug logging:

```env
AWS_SDK_LOAD_CONFIG=1
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
```

## Cost Optimization

1. **Use appropriate storage classes**
   - Standard for frequently accessed files
   - IA for infrequently accessed files
   - Glacier for archival

2. **Implement lifecycle policies**
   - Move old files to cheaper storage
   - Delete temporary files automatically

3. **Monitor usage**
   - Set up billing alerts
   - Review storage metrics regularly

## Production Checklist

- [ ] IAM user created with minimal permissions
- [ ] S3 bucket configured with proper policies
- [ ] CORS configured for your domain
- [ ] Environment variables set
- [ ] CloudFront distribution created (optional)
- [ ] Lifecycle policies configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented

## Support

- **AWS Documentation**: https://docs.aws.amazon.com/s3/
- **AWS Support**: https://aws.amazon.com/support/
- **S3 Pricing**: https://aws.amazon.com/s3/pricing/
