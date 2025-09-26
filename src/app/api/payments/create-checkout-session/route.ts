import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { createCheckoutSession } from '@/lib/stripe/payments';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { amount, appId, productType, successUrl, cancelUrl } = body;

      // Validate required fields
      if (!successUrl || !cancelUrl) {
        return NextResponse.json(
          { error: 'Success URL and cancel URL are required' },
          { status: 400 }
        );
      }

      let finalAmount = amount;
      let description = 'AppFounders Marketplace Purchase';

      // Handle predefined product types
      if (productType) {
        switch (productType) {
          case 'appSubmission':
            finalAmount = STRIPE_CONFIG.products.appSubmission;
            description = 'App Submission Fee';
            break;
          case 'featuredListing':
            finalAmount = STRIPE_CONFIG.products.featuredListing;
            description = 'Featured App Listing (30 days)';
            break;
          case 'premiumSupport':
            finalAmount = STRIPE_CONFIG.products.premiumSupport;
            description = 'Premium Support Package';
            break;
          default:
            if (!amount) {
              return NextResponse.json(
                { error: 'Amount is required for custom products' },
                { status: 400 }
              );
            }
        }
      } else if (!amount) {
        return NextResponse.json(
          { error: 'Amount or product type is required' },
          { status: 400 }
        );
      }

      // Validate amount range
      if (finalAmount < STRIPE_CONFIG.minimumChargeAmount) {
        return NextResponse.json(
          { error: `Amount must be at least $${STRIPE_CONFIG.minimumChargeAmount / 100}` },
          { status: 400 }
        );
      }

      if (finalAmount > STRIPE_CONFIG.maxChargeAmount) {
        return NextResponse.json(
          { error: `Amount must not exceed $${STRIPE_CONFIG.maxChargeAmount / 100}` },
          { status: 400 }
        );
      }

      // Create checkout session
      const session = await createCheckoutSession({
        amount: finalAmount,
        customerEmail: user.email,
        customerName: user.name,
        userId: user.id,
        appId,
        successUrl,
        cancelUrl,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          appId: appId || '',
          productType: productType || 'custom',
          description,
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: session.sessionId,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can make payments
  }
);
