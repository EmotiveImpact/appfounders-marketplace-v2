import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { stripe } from '@/lib/stripe/config';

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE /api/stripe/payment-methods/[id] - Delete a payment method
export const DELETE = createProtectedRoute(
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

      // Check if this is the default payment method
      const customer = await stripe.customers.retrieve(customerId);
      const isDefault = (customer as any).invoice_settings?.default_payment_method === paymentMethodId;

      if (isDefault) {
        // Get other payment methods to set a new default
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        });

        const otherMethods = paymentMethods.data.filter((pm: any) => pm.id !== paymentMethodId);
        
        if (otherMethods.length > 0) {
          // Set the first available payment method as default
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: otherMethods[0].id,
            },
          });
        } else {
          // Clear default payment method if no others exist
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: undefined,
            },
          });
        }
      }

      // Detach the payment method
      await stripe.paymentMethods.detach(paymentMethodId);

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
          'payment_method_deleted',
          ${JSON.stringify({
            payment_method_id: paymentMethodId,
            was_default: isDefault,
          })},
          NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete payment method' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
