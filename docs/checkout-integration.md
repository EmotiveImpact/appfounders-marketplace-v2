# Checkout Integration Guide

This guide explains how to integrate the secure checkout flow into the AppFounders marketplace.

## Overview

The platform provides two checkout options:
1. **Hosted Checkout** - Redirect to Stripe's secure checkout page (recommended)
2. **Embedded Checkout** - Custom form with Stripe Elements

## Components

### 1. HostedCheckout Component

The simplest way to accept payments. Redirects users to Stripe's secure checkout page.

```tsx
import { HostedCheckout } from '@/components/payments/hosted-checkout';

// Basic usage
<HostedCheckout
  amount={2999} // $29.99 in cents
  appId="app-123"
  appName="My Awesome App"
  description="Purchase My Awesome App"
/>

// Predefined products
<HostedCheckout
  productType="appSubmission"
  appId="app-123"
/>
```

### 2. CheckoutForm Component

Custom checkout form using Stripe Elements for embedded payments.

```tsx
import { CheckoutForm } from '@/components/payments/checkout-form';

<CheckoutForm
  amount={2999}
  appId="app-123"
  appName="My Awesome App"
  onSuccess={(paymentIntentId) => {
    console.log('Payment successful:', paymentIntentId);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### 3. Predefined Product Components

Quick components for common marketplace products:

```tsx
import { 
  AppSubmissionCheckout,
  FeaturedListingCheckout,
  PremiumSupportCheckout 
} from '@/components/payments/hosted-checkout';

// App submission fee ($29.99)
<AppSubmissionCheckout appId="app-123" />

// Featured listing ($99.99)
<FeaturedListingCheckout 
  appId="app-123" 
  appName="My App" 
/>

// Premium support ($49.99)
<PremiumSupportCheckout />
```

## Payment Flow

### 1. Hosted Checkout Flow

```
User clicks "Buy Now" 
→ API creates Stripe Checkout Session
→ User redirected to Stripe Checkout
→ User completes payment
→ User redirected to success/cancel page
→ Webhook processes payment
→ Database updated
```

### 2. Embedded Checkout Flow

```
User fills payment form
→ API creates Payment Intent
→ Stripe Elements confirms payment
→ Payment status updated in real-time
→ Success/error handling
→ Webhook processes payment
→ Database updated
```

## API Endpoints

### Create Payment Intent

```typescript
POST /api/payments/create-payment-intent

Body:
{
  "amount": 2999,
  "appId": "app-123",
  "description": "Purchase My App"
}

Response:
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Create Checkout Session

```typescript
POST /api/payments/create-checkout-session

Body:
{
  "amount": 2999,
  "appId": "app-123",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel"
}

Response:
{
  "success": true,
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/xxx"
}
```

### Get Payment Status

```typescript
GET /api/payments/status/[paymentIntentId]

Response:
{
  "id": "pi_xxx",
  "amount": 2999,
  "currency": "usd",
  "status": "succeeded",
  "created": 1234567890
}
```

### Get Session Details

```typescript
GET /api/payments/session/[sessionId]

Response:
{
  "sessionId": "cs_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 2999,
  "status": "complete",
  "appId": "app-123"
}
```

## Success/Cancel Pages

### Success Page

Located at `/payment/success`, handles successful payments:

- Displays payment confirmation
- Shows purchase details
- Provides download links (for apps)
- Redirects to dashboard

URL: `https://yoursite.com/payment/success?session_id=cs_xxx`

### Cancel Page

Located at `/payment/cancelled`, handles cancelled payments:

- Explains what happened
- Provides retry options
- Links back to previous page

URL: `https://yoursite.com/payment/cancelled`

## Real-time Payment Status

Use the `PaymentStatus` component to show real-time payment updates:

```tsx
import { PaymentStatus } from '@/components/payments/payment-status';

<PaymentStatus
  paymentIntentId="pi_xxx"
  onStatusChange={(status) => {
    if (status === 'succeeded') {
      // Handle success
    }
  }}
  autoRefresh={true}
  refreshInterval={3000}
/>
```

## Error Handling

### Common Errors

1. **Card Declined**
   ```json
   {
     "error": "Your card was declined.",
     "code": "card_declined"
   }
   ```

2. **Insufficient Funds**
   ```json
   {
     "error": "Your card has insufficient funds.",
     "code": "insufficient_funds"
   }
   ```

3. **Invalid Amount**
   ```json
   {
     "error": "Amount must be at least $0.50",
     "code": "invalid_amount"
   }
   ```

### Error Display

```tsx
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## Security Features

### 1. User Verification
- All payments verified against authenticated user
- Payment intents include user metadata
- Session validation on success pages

### 2. Amount Validation
- Minimum: $0.50 (50 cents)
- Maximum: $9,999.99
- Server-side validation

### 3. Webhook Verification
- Stripe signature verification
- Idempotent webhook handling
- Secure database updates

## Testing

### Test Cards

Use these test cards in development:

```
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0000 0000 3220
```

### Test Webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

## Production Checklist

### 1. Environment Variables
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live key)
- [ ] `STRIPE_SECRET_KEY` (live key)
- [ ] `STRIPE_WEBHOOK_SECRET` (live webhook secret)

### 2. Webhook Configuration
- [ ] Webhook URL points to production domain
- [ ] All required events are selected
- [ ] Webhook secret is configured

### 3. URLs
- [ ] Success URL points to production domain
- [ ] Cancel URL points to production domain
- [ ] All redirects work correctly

### 4. Testing
- [ ] Test successful payments
- [ ] Test failed payments
- [ ] Test webhook delivery
- [ ] Test user experience

## Monitoring

### Key Metrics
- Payment success rate
- Average payment amount
- Failed payment reasons
- Webhook delivery success

### Stripe Dashboard
Monitor payments in the Stripe Dashboard:
- https://dashboard.stripe.com/payments
- https://dashboard.stripe.com/webhooks
- https://dashboard.stripe.com/logs

## Troubleshooting

### Payment Not Completing
1. Check webhook delivery in Stripe Dashboard
2. Verify webhook signature validation
3. Check application logs for errors
4. Ensure database is accessible

### Redirect Issues
1. Verify success/cancel URLs are correct
2. Check for HTTPS in production
3. Ensure URLs are accessible

### User Not Seeing Purchase
1. Check webhook processing
2. Verify database updates
3. Check user session/authentication

## Support

For payment-related issues:
1. Check Stripe Dashboard logs
2. Review webhook delivery status
3. Contact Stripe support if needed
4. Check application error logs
