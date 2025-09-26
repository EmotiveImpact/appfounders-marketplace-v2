import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { createSetupIntent } from '@/lib/stripe/payments';

// POST /api/stripe/setup-intent - Create setup intent for saving payment methods
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { clientSecret, setupIntentId } = await createSetupIntent(
        user.email,
        user.name,
        user.id
      );

      return NextResponse.json({
        success: true,
        clientSecret,
        setupIntentId,
      });
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create setup intent' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
