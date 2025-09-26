import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getPaymentIntent } from '@/lib/stripe/payments';

export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { paymentIntentId: string } }) => {
    try {
      const { paymentIntentId } = params;

      if (!paymentIntentId) {
        return NextResponse.json(
          { error: 'Payment Intent ID is required' },
          { status: 400 }
        );
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await getPaymentIntent(paymentIntentId);

      // Verify the payment intent belongs to the current user
      const paymentUserId = paymentIntent.metadata?.userId;
      if (paymentUserId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to payment' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        description: paymentIntent.description,
        last_payment_error: paymentIntent.last_payment_error,
        metadata: paymentIntent.metadata,
      });
    } catch (error: any) {
      console.error('Error retrieving payment status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to retrieve payment status' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can view their payment status
  }
);
