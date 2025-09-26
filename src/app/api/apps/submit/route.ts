import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  createAppSubmission,
  updateAppSubmission,
  validateSubmission,
  submitForReview,
  getDeveloperSubmissions
} from '@/lib/app/submission-workflow';

// GET /api/apps/submit - Get developer's submissions
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');

      const submissions = await getDeveloperSubmissions(
        user.id,
        status || undefined
      );

      return NextResponse.json({
        success: true,
        submissions,
      });
    } catch (error: any) {
      console.error('Error getting submissions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get submissions' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// POST /api/apps/submit - Create new app submission
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const {
        name,
        description,
        short_description,
        category,
        price,
        platform,
        version,
        minimum_os_version,
        website_url,
        support_url,
        privacy_policy_url,
        terms_of_service_url,
        tags,
        features
      } = body;

      // Basic validation
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'App name is required' },
          { status: 400 }
        );
      }

      if (price !== undefined && (price < 0 || price > 999.99)) {
        return NextResponse.json(
          { error: 'Price must be between $0 and $999.99' },
          { status: 400 }
        );
      }

      // Create submission
      const submission = await createAppSubmission(user.id, {
        name: name.trim(),
        description: description?.trim() || '',
        short_description: short_description?.trim() || '',
        category: category || 'other',
        price: price || 0,
        platform: platform || 'web',
        version: version || '1.0.0',
        minimum_os_version,
        website_url,
        support_url,
        privacy_policy_url,
        terms_of_service_url,
        tags: tags || [],
        features: features || [],
      });

      return NextResponse.json({
        success: true,
        submission,
        message: 'App submission created successfully',
      });
    } catch (error: any) {
      console.error('Error creating submission:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create submission' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);
