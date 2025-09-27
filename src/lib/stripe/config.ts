import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: any;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  platformFeePercent: 20, // 20% platform fee, 80% to developer
  minimumChargeAmount: 50, // $0.50 minimum charge in cents
  maxChargeAmount: 999999, // $9,999.99 maximum charge in cents

  // Product pricing (in cents)
  products: {
    appSubmission: 2999, // $29.99 app submission fee
    featuredListing: 9999, // $99.99 featured listing for 30 days
    premiumSupport: 4999, // $49.99 premium support package
  },

  // Webhook events we handle
  webhookEvents: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'checkout.session.completed',
    'account.updated',
    'transfer.created',
  ],
} as const;

// Helper function to calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (STRIPE_CONFIG.platformFeePercent / 100));
}

// Helper function to calculate developer payout
export function calculateDeveloperPayout(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

// Format amount for display
export function formatCurrency(amount: number, currency: string = STRIPE_CONFIG.currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Validate Stripe webhook signature
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error: any) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

// Error handling for Stripe operations
export function handleStripeError(error: any): { message: string; code?: string } {
  if (error.type === 'StripeCardError') {
    return {
      message: error.message,
      code: error.code,
    };
  } else if (error.type === 'StripeRateLimitError') {
    return {
      message: 'Too many requests made to the API too quickly',
      code: 'rate_limit',
    };
  } else if (error.type === 'StripeInvalidRequestError') {
    return {
      message: 'Invalid parameters were supplied to Stripe\'s API',
      code: 'invalid_request',
    };
  } else if (error.type === 'StripeAPIError') {
    return {
      message: 'An error occurred internally with Stripe\'s API',
      code: 'api_error',
    };
  } else if (error.type === 'StripeConnectionError') {
    return {
      message: 'Some kind of error occurred during the HTTPS communication',
      code: 'connection_error',
    };
  } else if (error.type === 'StripeAuthenticationError') {
    return {
      message: 'You probably used an incorrect API key',
      code: 'authentication_error',
    };
  } else {
    return {
      message: 'An unexpected error occurred',
      code: 'unknown_error',
    };
  }
}

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string,
  userId?: string
): Promise<Stripe.Customer> {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer if not found
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: userId ? { userId } : {},
    });

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw error;
  }
}
