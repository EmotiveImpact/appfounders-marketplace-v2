import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { stripe } from '@/lib/stripe/config';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/stripe/payment-methods/[id]/default - Set payment method as default
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: RouteParams) => {
    try {
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe not configured' },
          { status: 500 }
        );
      }

      const { id: paymentMethodId } = params;

      if (!paymentMethodId) {
        return NextResponse.json(
          { error: 'Payment method ID is required' },
          { status: 400 }
        );
      }

      // Get user's Stripe customer ID
      const customerResult = await neonClient.sql`
        SELECT stripe_customer_id 
        FROM users 
        WHERE id = ${user.id}
        LIMIT 1
      `;

      if (customerResult.length === 0 || !customerResult[0].stripe_customer_id) {
        return NextResponse.json(
          { error: 'No Stripe customer found' },
          { status: 404 }
        );
      }

      const customerId = customerResult[0].stripe_customer_id;

      // Verify the payment method belongs to this customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.customer !== customerId) {
        return NextResponse.json(
          { error: 'Payment method not found or access denied' },
          { status: 404 }
        );
      }

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Log the action
      await neonClient.sql`
        INSERT INTO user_activity_logs (
          user_id,
          action,
          details,
          created_at
        )
        VALUES (
          ${user.id},
          'payment_method_set_default',
          ${JSON.stringify({
            payment_method_id: paymentMethodId,
            card_last4: paymentMethod.card?.last4,
            card_brand: paymentMethod.card?.brand,
          })},
          NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        message: 'Default payment method updated successfully',
      });
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to set default payment method' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
