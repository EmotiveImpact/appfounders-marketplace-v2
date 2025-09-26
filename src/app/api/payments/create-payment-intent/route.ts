import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { createPaymentIntent } from '@/lib/stripe/payments';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { getConnectedAccount, createSplitPayment, calculateCommissionSplit } from '@/lib/stripe/connect';
import { neonClient } from '@/lib/database/neon-client';

export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { amount, appId, description } = body;

      // Validate required fields
      if (!amount || typeof amount !== 'number') {
        return NextResponse.json(
          { error: 'Amount is required and must be a number' },
          { status: 400 }
        );
      }

      if (!appId) {
        return NextResponse.json(
          { error: 'App ID is required' },
          { status: 400 }
        );
      }

      // Validate amount range
      if (amount < STRIPE_CONFIG.minimumChargeAmount) {
        return NextResponse.json(
          { error: `Amount must be at least $${STRIPE_CONFIG.minimumChargeAmount / 100}` },
          { status: 400 }
        );
      }

      if (amount > STRIPE_CONFIG.maxChargeAmount) {
        return NextResponse.json(
          { error: `Amount must not exceed $${STRIPE_CONFIG.maxChargeAmount / 100}` },
          { status: 400 }
        );
      }

      // Get app and developer information
      const appResult = await neonClient.sql`
        SELECT a.*, u.email as developer_email
        FROM apps a
        JOIN users u ON a.developer_id = u.id
        WHERE a.id = ${appId}
        LIMIT 1
      `;

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App not found' },
          { status: 404 }
        );
      }

      const app = appResult[0];

      // Get developer's connected account
      const connectedAccount = await getConnectedAccount(app.developer_id);

      let paymentIntent;

      if (connectedAccount && connectedAccount.charges_enabled) {
        // Create split payment with commission
        paymentIntent = await createSplitPayment(
          amount,
          'usd',
          connectedAccount.stripe_account_id,
          appId
        );

        // Calculate commission split for response
        const commissionSplit = calculateCommissionSplit(amount);

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          commissionSplit,
          splitPayment: true,
        });
      } else {
        // Fallback to regular payment if no connected account
        paymentIntent = await createPaymentIntent({
          amount,
          customerEmail: user.email,
          customerName: user.name,
          userId: user.id,
          appId,
          description: description || 'AppFounders Marketplace Purchase',
          metadata: {
            userId: user.id,
            userEmail: user.email,
            appId: appId || '',
            developerAccountMissing: 'true',
          },
        });

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.clientSecret,
          paymentIntentId: paymentIntent.paymentIntentId,
          splitPayment: false,
          warning: 'Developer account not set up - payment will be processed manually',
        });
      }


    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create payment intent' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can make payments
  }
);
