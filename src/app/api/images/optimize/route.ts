import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  processUploadedImage, 
  batchProcessImages,
  validateAndAnalyzeImage,
  getImageMetadata,
  IMAGE_VARIANTS
} from '@/lib/image/optimization';
import { neonClient } from '@/lib/database/neon-client';

// POST /api/images/optimize - Optimize uploaded images
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { imageKeys, variantType = 'general', batch = false } = body;

      // Validate required fields
      if (!imageKeys || (Array.isArray(imageKeys) && imageKeys.length === 0)) {
        return NextResponse.json(
          { error: 'Image keys are required' },
          { status: 400 }
        );
      }

      // Validate variant type
      if (variantType && !IMAGE_VARIANTS[variantType]) {
        return NextResponse.json(
          { error: 'Invalid variant type' },
          { status: 400 }
        );
      }

      // Handle batch processing
      if (batch && Array.isArray(imageKeys)) {
        const results = await batchProcessImages(imageKeys, variantType, 3);
        
        // Update database with optimization results
        for (const result of results) {
          if (result.success && result.result) {
            await updateImageOptimizationRecord(
              result.originalKey,
              result.result.variants,
              user.id
            );
          }
        }

        return NextResponse.json({
          success: true,
          results,
          message: `Processed ${results.length} images`,
        });
      }

      // Handle single image processing
      const imageKey = Array.isArray(imageKeys) ? imageKeys[0] : imageKeys;
      const result = await processUploadedImage(imageKey, variantType, {
        user_id: user.id,
        processed_at: new Date().toISOString(),
      });

      // Update database with optimization results
      await updateImageOptimizationRecord(imageKey, result.variants, user.id);

      return NextResponse.json({
        success: true,
        result,
        message: 'Image optimized successfully',
      });
    } catch (error: any) {
      console.error('Error optimizing images:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to optimize images' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can optimize images
  }
);

// POST /api/images/optimize/analyze - Analyze image for optimization recommendations
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { imageBuffer } = body;

      if (!imageBuffer) {
        return NextResponse.json(
          { error: 'Image buffer is required' },
          { status: 400 }
        );
      }

      // Convert base64 to buffer if needed
      let buffer: Buffer;
      if (typeof imageBuffer === 'string') {
        buffer = Buffer.from(imageBuffer, 'base64');
      } else {
        buffer = Buffer.from(imageBuffer);
      }

      // Analyze image
      const analysis = await validateAndAnalyzeImage(buffer);
      
      return NextResponse.json({
        success: true,
        analysis,
        message: 'Image analysis completed',
      });
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to analyze image' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

/**
 * Update database with image optimization results
 */
async function updateImageOptimizationRecord(
  originalKey: string,
  variants: Array<{ key: string; url: string; config: any }>,
  userId: string
): Promise<void> {
  try {
    // Store optimization record
    await neonClient.sql`
      INSERT INTO image_optimizations (
        user_id,
        original_key,
        variants,
        created_at
      )
      VALUES (
        ${userId},
        ${originalKey},
        ${JSON.stringify(variants)},
        NOW()
      )
      ON CONFLICT (original_key) 
      DO UPDATE SET
        variants = ${JSON.stringify(variants)},
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Error updating image optimization record:', error);
    // Don't throw error as optimization was successful
  }
}
