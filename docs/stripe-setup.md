# Stripe Setup Guide

This guide walks you through setting up Stripe for the AppFounders marketplace platform.

## Overview

The platform uses Stripe for:
- **App purchases** - Users buying apps from developers
- **Submission fees** - Developers paying to submit apps
- **Featured listings** - Developers paying for promoted placement
- **Premium services** - Additional marketplace services
- **Commission handling** - Platform takes 20% commission

## Prerequisites

1. **Stripe Account** - Create a business account at https://stripe.com
2. **Business Information** - Complete business verification
3. **Bank Account** - Add bank account for payouts

## Step 1: Create Stripe Account

1. **Sign up at Stripe**
   - Visit: https://dashboard.stripe.com/register
   - Choose "Business" account type
   - Complete business information

2. **Verify Your Business**
   - Provide business documents
   - Add bank account details
   - Complete identity verification

3. **Activate Your Account**
   - Wait for Stripe approval (usually 1-2 business days)
   - Activate payments in your dashboard

## Step 2: Get API Keys

1. **Navigate to API Keys**
   - Go to: https://dashboard.stripe.com/apikeys
   - You'll see both Test and Live keys

2. **Copy Test Keys (Development)**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Copy Live Keys (Production)**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

## Step 3: Configure Webhooks

Webhooks notify your application when payments succeed or fail.

1. **Create Webhook Endpoint**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Description: "AppFounders Marketplace Webhooks"

2. **Select Events**
   Add these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Get Webhook Secret**
   - Click on your webhook
   - Copy the "Signing secret"
   - Add to environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Environment Variables

Update your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

For production, use live keys:

```env
# Stripe Configuration (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 5: Test the Integration

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Payment Flow**
   - Navigate to an app purchase page
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

3. **Verify Webhook Delivery**
   - Check Stripe Dashboard > Webhooks
   - Look for successful webhook deliveries
   - Check your application logs

## Step 6: Configure Products and Pricing

1. **Create Products in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/products
   - Create products for:
     - App Submission Fee ($29.99)
     - Featured Listing ($99.99)
     - Premium Support ($49.99)

2. **Update Price IDs**
   Update `src/lib/stripe/config.ts` with actual price IDs:
   ```typescript
   export const stripePriceIds = {
     development: {
       appSubmission: 'price_test_actual_id',
       featuredListing: 'price_test_actual_id',
     },
     production: {
       appSubmission: 'price_live_actual_id',
       featuredListing: 'price_live_actual_id',
     },
   };
   ```

## Platform Configuration

### Commission Structure

The platform takes a 20% commission on all sales:
- **Developer receives**: 80% of sale price
- **Platform receives**: 20% of sale price

This is configured in `src/lib/stripe/config.ts`:

```typescript
export const STRIPE_CONFIG = {
  platformFeePercent: 20, // 20% platform fee
  // ...
};
```

### Payment Limits

- **Minimum**: $0.50 (50 cents)
- **Maximum**: $9,999.99

### Supported Payment Methods

- Credit/Debit Cards (Visa, Mastercard, American Express)
- Digital Wallets (Apple Pay, Google Pay)
- Bank Transfers (ACH) - US only
- International payment methods (varies by country)

## Security Best Practices

1. **Never Expose Secret Keys**
   - Keep secret keys in environment variables
   - Never commit keys to version control
   - Use different keys for development/production

2. **Validate Webhooks**
   - Always verify webhook signatures
   - Handle webhook idempotency
   - Log webhook events for debugging

3. **Handle Errors Gracefully**
   - Implement proper error handling
   - Show user-friendly error messages
   - Log errors for debugging

4. **Use HTTPS**
   - Stripe requires HTTPS for webhooks
   - Use SSL certificates in production

## Testing

### Test Cards

Use these test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0000 0000 3220`

### Test Webhooks

1. **Use Stripe CLI**
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

2. **Trigger Test Events**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Production Deployment

1. **Switch to Live Keys**
   - Update environment variables with live keys
   - Test with small amounts first

2. **Update Webhook URLs**
   - Change webhook URL to production domain
   - Test webhook delivery

3. **Monitor Payments**
   - Set up Stripe Dashboard alerts
   - Monitor payment success rates
   - Watch for failed payments

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check webhook secret is correct
   - Ensure raw request body is used
   - Verify endpoint URL is correct

2. **Payment Intent Creation Failed**
   - Check API keys are correct
   - Verify amount is within limits
   - Check customer information is valid

3. **Card Declined**
   - Use test cards for development
   - Check card details are correct
   - Verify sufficient funds (for live cards)

### Debug Mode

Enable Stripe debug mode in development:

```env
STRIPE_DEBUG=true
```

This will show detailed API request/response logs.

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
