import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getCustomerPaymentMethods } from '@/lib/stripe/payments';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/stripe/payment-methods - Get user's payment methods
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      // Get user's Stripe customer ID
      const customerResult = await neonClient.sql`
        SELECT stripe_customer_id 
        FROM users 
        WHERE id = ${user.id}
        LIMIT 1
      `;

      if (customerResult.length === 0 || !customerResult[0].stripe_customer_id) {
        return NextResponse.json({
          success: true,
          paymentMethods: [],
        });
      }

      const customerId = customerResult[0].stripe_customer_id;

      // Get payment methods from Stripe
      const paymentMethods = await getCustomerPaymentMethods(customerId);

      // Get default payment method
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

      // Format payment methods for frontend
      const formattedMethods = paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        card: method.card ? {
          brand: method.card.brand,
          last4: method.card.last4,
          exp_month: method.card.exp_month,
          exp_year: method.card.exp_year,
          funding: method.card.funding,
        } : undefined,
        billing_details: {
          name: method.billing_details.name,
          email: method.billing_details.email,
        },
        created: method.created,
        is_default: method.id === defaultPaymentMethodId,
      }));

      return NextResponse.json({
        success: true,
        paymentMethods: formattedMethods,
      });
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
