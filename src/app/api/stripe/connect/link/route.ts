import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getConnectedAccount, createAccountLink } from '@/lib/stripe/connect';

// POST /api/stripe/connect/link - Create account link for onboarding/updates
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { type = 'account_update' } = await req.json();

      // Get connected account
      const connectedAccount = await getConnectedAccount(user.id);
      if (!connectedAccount) {
        return NextResponse.json(
          { error: 'No connected account found' },
          { status: 404 }
        );
      }

      // Validate type
      if (!['account_onboarding', 'account_update'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid link type' },
          { status: 400 }
        );
      }

      // Create account link
      const accountLinkUrl = await createAccountLink(
        connectedAccount.stripe_account_id,
        type
      );

      return NextResponse.json({
        success: true,
        url: accountLinkUrl,
        type,
      });
    } catch (error: any) {
      console.error('Error creating account link:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create account link' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);
