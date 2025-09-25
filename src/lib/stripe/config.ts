import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;

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
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
