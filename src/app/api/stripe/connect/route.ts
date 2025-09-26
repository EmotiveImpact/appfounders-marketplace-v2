import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import {
  createConnectAccount,
  getConnectedAccount,
  updateConnectedAccountStatus,
  createAccountLink,
  getDeveloperEarnings,
} from '@/lib/stripe/connect';

// POST /api/stripe/connect - Create Stripe Connect account
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { country = 'US' } = await req.json();

      // Check if user already has a connected account
      const existingAccount = await getConnectedAccount(user.id);
      if (existingAccount) {
        return NextResponse.json(
          { error: 'User already has a connected account' },
          { status: 400 }
        );
      }

      // Create new Connect account
      const { accountId, onboardingUrl } = await createConnectAccount(
        user.id,
        user.email,
        country
      );

      return NextResponse.json({
        success: true,
        accountId,
        onboardingUrl,
        message: 'Connect account created successfully',
      });
    } catch (error: any) {
      console.error('Error creating Connect account:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create Connect account' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// GET /api/stripe/connect - Get connected account info
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const connectedAccount = await getConnectedAccount(user.id);
      
      if (!connectedAccount) {
        return NextResponse.json({
          success: true,
          connected: false,
          account: null,
        });
      }

      // Update account status from Stripe
      await updateConnectedAccountStatus(connectedAccount.stripe_account_id);
      
      // Get updated account info
      const updatedAccount = await getConnectedAccount(user.id);
      
      // Get earnings summary
      const earnings = await getDeveloperEarnings(user.id);

      return NextResponse.json({
        success: true,
        connected: true,
        account: updatedAccount,
        earnings,
      });
    } catch (error: any) {
      console.error('Error fetching Connect account:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch Connect account' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);
