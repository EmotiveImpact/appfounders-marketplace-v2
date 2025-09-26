import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, getOrCreateStripeCustomer, handleStripeError } from './config';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  userId?: string;
  appId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  priceId?: string;
  amount?: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  userId?: string;
  appId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  try {
    const {
      amount,
      currency = STRIPE_CONFIG.currency,
      customerEmail,
      customerName,
      userId,
      appId,
      description,
      metadata = {},
    } = params;

    // Validate amount
    if (amount < STRIPE_CONFIG.minimumChargeAmount) {
      throw new Error(`Amount must be at least ${STRIPE_CONFIG.minimumChargeAmount} cents`);
    }

    if (amount > STRIPE_CONFIG.maxChargeAmount) {
      throw new Error(`Amount must not exceed ${STRIPE_CONFIG.maxChargeAmount} cents`);
    }

    // Get or create customer
    const customer = await getOrCreateStripeCustomer(customerEmail, customerName, userId);

    // Calculate platform fee
    const platformFee = Math.round(amount * (STRIPE_CONFIG.platformFeePercent / 100));

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.id,
      description: description || 'AppFounders Marketplace Purchase',
      metadata: {
        ...metadata,
        userId: userId || '',
        appId: appId || '',
        platformFee: platformFee.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw handleStripeError(error);
  }
}

/**
 * Create a checkout session for hosted checkout
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ sessionId: string; url: string }> {
  try {
    const {
      priceId,
      amount,
      currency = STRIPE_CONFIG.currency,
      customerEmail,
      customerName,
      userId,
      appId,
      successUrl,
      cancelUrl,
      metadata = {},
    } = params;

    // Get or create customer
    const customer = await getOrCreateStripeCustomer(customerEmail, customerName, userId);

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (priceId) {
      // Use existing price
      lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else if (amount) {
      // Create one-time price
      lineItems = [
        {
          price_data: {
            currency,
            product_data: {
              name: 'AppFounders Marketplace Purchase',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
    } else {
      throw new Error('Either priceId or amount must be provided');
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        userId: userId || '',
        appId: appId || '',
      },
      payment_intent_data: {
        metadata: {
          ...metadata,
          userId: userId || '',
          appId: appId || '',
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw handleStripeError(error);
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw handleStripeError(error);
  }
}

/**
 * Retrieve checkout session details
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw handleStripeError(error);
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    if (reason) {
      refundParams.reason = reason;
    }

    return await stripe.refunds.create(refundParams);
  } catch (error) {
    console.error('Error creating refund:', error);
    throw handleStripeError(error);
  }
}

/**
 * Get customer's payment methods
 */
export async function getCustomerPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    throw handleStripeError(error);
  }
}

/**
 * Create a setup intent for saving payment methods
 */
export async function createSetupIntent(
  customerEmail: string,
  customerName?: string,
  userId?: string
): Promise<{ clientSecret: string; setupIntentId: string }> {
  try {
    const customer = await getOrCreateStripeCustomer(customerEmail, customerName, userId);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw handleStripeError(error);
  }
}
