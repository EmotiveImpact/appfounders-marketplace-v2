import sharp from 'sharp';
import { storageConfig } from '@/lib/storage/aws-config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: storageConfig.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface ImageOptimizationConfig {
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: string;
  progressive?: boolean;
  lossless?: boolean;
}

export interface ImageVariant {
  name: string;
  config: ImageOptimizationConfig;
  suffix: string;
}

// Predefined image variants for different use cases
export const IMAGE_VARIANTS: Record<string, ImageVariant[]> = {
  avatar: [
    {
      name: 'thumbnail',
      suffix: '_thumb',
      config: { width: 64, height: 64, quality: 80, format: 'webp', fit: 'cover' }
    },
    {
      name: 'small',
      suffix: '_sm',
      config: { width: 128, height: 128, quality: 85, format: 'webp', fit: 'cover' }
    },
    {
      name: 'medium',
      suffix: '_md',
      config: { width: 256, height: 256, quality: 90, format: 'webp', fit: 'cover' }
    }
  ],
  screenshot: [
    {
      name: 'thumbnail',
      suffix: '_thumb',
      config: { width: 300, height: 200, quality: 80, format: 'webp', fit: 'cover' }
    },
    {
      name: 'medium',
      suffix: '_md',
      config: { width: 800, height: 600, quality: 85, format: 'webp', fit: 'inside' }
    },
    {
      name: 'large',
      suffix: '_lg',
      config: { width: 1200, height: 900, quality: 90, format: 'webp', fit: 'inside' }
    }
  ],
  icon: [
    {
      name: 'small',
      suffix: '_sm',
      config: { width: 64, height: 64, quality: 90, format: 'png', fit: 'cover' }
    },
    {
      name: 'medium',
      suffix: '_md',
      config: { width: 128, height: 128, quality: 90, format: 'png', fit: 'cover' }
    },
    {
      name: 'large',
      suffix: '_lg',
      config: { width: 512, height: 512, quality: 95, format: 'png', fit: 'cover' }
    }
  ],
  general: [
    {
      name: 'thumbnail',
      suffix: '_thumb',
      config: { width: 300, quality: 80, format: 'webp', fit: 'inside' }
    },
    {
      name: 'medium',
      suffix: '_md',
      config: { width: 800, quality: 85, format: 'webp', fit: 'inside' }
    },
    {
      name: 'large',
      suffix: '_lg',
      config: { width: 1200, quality: 90, format: 'webp', fit: 'inside' }
    }
  ]
};

/**
 * Optimize a single image with the given configuration
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  config: ImageOptimizationConfig
): Promise<Buffer> {
  let pipeline = sharp(imageBuffer);

  // Resize if dimensions are specified
  if (config.width || config.height) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: config.fit || 'inside',
      background: config.background || { r: 255, g: 255, b: 255, alpha: 0 },
      withoutEnlargement: true,
    });
  }

  // Apply format-specific optimizations
  switch (config.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality: config.quality,
        progressive: config.progressive !== false,
        mozjpeg: true,
      });
      break;
    case 'png':
      pipeline = pipeline.png({
        quality: config.quality,
        progressive: config.progressive !== false,
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({
        quality: config.quality,
        lossless: config.lossless || false,
        effort: 6,
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({
        quality: config.quality,
        lossless: config.lossless || false,
        effort: 9,
      });
      break;
  }

  return await pipeline.toBuffer();
}

/**
 * Generate multiple optimized variants of an image
 */
export async function generateImageVariants(
  imageBuffer: Buffer,
  originalKey: string,
  variantType: keyof typeof IMAGE_VARIANTS = 'general'
): Promise<Array<{ key: string; buffer: Buffer; config: ImageOptimizationConfig }>> {
  const variants = IMAGE_VARIANTS[variantType] || IMAGE_VARIANTS.general;
  const results = [];

  for (const variant of variants) {
    try {
      const optimizedBuffer = await optimizeImage(imageBuffer, variant.config);
      const variantKey = generateVariantKey(originalKey, variant.suffix, variant.config.format);
      
      results.push({
        key: variantKey,
        buffer: optimizedBuffer,
        config: variant.config,
      });
    } catch (error) {
      console.error(`Failed to generate variant ${variant.name}:`, error);
    }
  }

  return results;
}

/**
 * Upload optimized image variants to S3
 */
export async function uploadImageVariants(
  variants: Array<{ key: string; buffer: Buffer; config: ImageOptimizationConfig }>,
  metadata?: Record<string, string>
): Promise<Array<{ key: string; url: string }>> {
  const uploadPromises = variants.map(async (variant) => {
    const command = new PutObjectCommand({
      Bucket: storageConfig.bucket,
      Key: variant.key,
      Body: variant.buffer,
      ContentType: `image/${variant.config.format}`,
      CacheControl: 'public, max-age=31536000', // 1 year
      Metadata: {
        ...metadata,
        optimized: 'true',
        format: variant.config.format,
        quality: variant.config.quality.toString(),
        ...(variant.config.width && { width: variant.config.width.toString() }),
        ...(variant.config.height && { height: variant.config.height.toString() }),
      },
    });

    await s3Client.send(command);
    
    return {
      key: variant.key,
      url: `https://${storageConfig.bucket}.s3.${storageConfig.region}.amazonaws.com/${variant.key}`,
    };
  });

  return await Promise.all(uploadPromises);
}

/**
 * Process and optimize an uploaded image
 */
export async function processUploadedImage(
  originalKey: string,
  variantType: keyof typeof IMAGE_VARIANTS = 'general',
  metadata?: Record<string, string>
): Promise<{
  original: { key: string; url: string };
  variants: Array<{ key: string; url: string; config: ImageOptimizationConfig }>;
}> {
  try {
    // Download original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: storageConfig.bucket,
      Key: originalKey,
    });
    
    const response = await s3Client.send(getCommand);
    const imageBuffer = Buffer.from(await response.Body!.transformToByteArray());

    // Generate optimized variants
    const variants = await generateImageVariants(imageBuffer, originalKey, variantType);
    
    // Upload variants to S3
    const uploadedVariants = await uploadImageVariants(variants, metadata);

    return {
      original: {
        key: originalKey,
        url: `https://${storageConfig.bucket}.s3.${storageConfig.region}.amazonaws.com/${originalKey}`,
      },
      variants: uploadedVariants.map((uploaded, index) => ({
        ...uploaded,
        config: variants[index].config,
      })),
    };
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    throw new Error('Failed to process uploaded image');
  }
}

/**
 * Get image metadata and dimensions
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  format: string;
  width: number;
  height: number;
  channels: number;
  density: number;
  hasAlpha: boolean;
  size: number;
}> {
  const metadata = await sharp(imageBuffer).metadata();
  
  return {
    format: metadata.format || 'unknown',
    width: metadata.width || 0,
    height: metadata.height || 0,
    channels: metadata.channels || 0,
    density: metadata.density || 72,
    hasAlpha: metadata.hasAlpha || false,
    size: imageBuffer.length,
  };
}

/**
 * Validate image file and check if optimization is needed
 */
export async function validateAndAnalyzeImage(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  needsOptimization: boolean;
  metadata: any;
  recommendations: string[];
}> {
  try {
    const metadata = await getImageMetadata(imageBuffer);
    const recommendations: string[] = [];
    let needsOptimization = false;

    // Check if image is too large
    if (metadata.width > 2048 || metadata.height > 2048) {
      recommendations.push('Image dimensions are very large, consider resizing');
      needsOptimization = true;
    }

    // Check file size (assuming reasonable compression)
    const expectedSize = metadata.width * metadata.height * metadata.channels;
    if (metadata.size > expectedSize * 0.5) {
      recommendations.push('Image file size is large, compression recommended');
      needsOptimization = true;
    }

    // Check format efficiency
    if (metadata.format === 'png' && !metadata.hasAlpha) {
      recommendations.push('PNG without transparency could be converted to JPEG or WebP');
      needsOptimization = true;
    }

    if (metadata.format === 'jpeg' || metadata.format === 'png') {
      recommendations.push('Consider WebP format for better compression');
      needsOptimization = true;
    }

    return {
      isValid: true,
      needsOptimization,
      metadata,
      recommendations,
    };
  } catch (error) {
    return {
      isValid: false,
      needsOptimization: false,
      metadata: null,
      recommendations: ['Invalid image file'],
    };
  }
}

/**
 * Generate a variant key based on original key and variant info
 */
function generateVariantKey(
  originalKey: string,
  suffix: string,
  format: string
): string {
  const lastDotIndex = originalKey.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? originalKey.substring(0, lastDotIndex) : originalKey;
  return `${baseName}${suffix}.${format}`;
}

/**
 * Batch process multiple images
 */
export async function batchProcessImages(
  imageKeys: string[],
  variantType: keyof typeof IMAGE_VARIANTS = 'general',
  concurrency: number = 3
): Promise<Array<{
  originalKey: string;
  success: boolean;
  result?: any;
  error?: string;
}>> {
  const results = [];
  
  // Process images in batches to avoid overwhelming the system
  for (let i = 0; i < imageKeys.length; i += concurrency) {
    const batch = imageKeys.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (key) => {
      try {
        const result = await processUploadedImage(key, variantType);
        return {
          originalKey: key,
          success: true,
          result,
        };
      } catch (error: any) {
        return {
          originalKey: key,
          success: false,
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
