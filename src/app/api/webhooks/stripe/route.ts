import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { validateWebhookSignature, STRIPE_CONFIG } from '@/lib/stripe/config';
import { neonClient as db } from '@/lib/database/neon-client';
import { updateConnectedAccountStatus } from '@/lib/stripe/connect';
import { sendPurchaseNotification, sendPaymentFailedNotification } from '@/lib/notifications/service';
import { handleDisputeCreated as createDisputeCase, updateDisputeStatus } from '@/lib/stripe/refunds';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = validateWebhookSignature(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Stripe Connect events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as Stripe.Account);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      case 'payout.created':
        await handlePayoutCreated(event.data.object as Stripe.Payout);
        break;

      case 'payout.updated':
        await handlePayoutUpdated(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      // Dispute events
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const userId = metadata.userId;
    const appId = metadata.appId;

    console.log(`Payment succeeded: ${paymentIntent.id} for user ${userId}`);

    // Create purchase record in database
    await db.sql`
      INSERT INTO purchases (
        user_id,
        app_id,
        stripe_payment_intent_id,
        amount_cents,
        currency,
        status
      )
      VALUES (
        ${userId},
        ${appId},
        ${paymentIntent.id},
        ${paymentIntent.amount},
        ${paymentIntent.currency},
        'completed'
      )
      ON CONFLICT (stripe_payment_intent_id) DO UPDATE SET
        status = 'completed',
        updated_at = NOW()
    `;

    // Update app sales count if applicable
    if (appId) {
      await db.sql`
        UPDATE apps
        SET sales_count = sales_count + 1
        WHERE id = ${appId}
      `;
    }

    console.log(`Purchase recorded for payment intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const userId = metadata.userId;
    const appId = metadata.appId;

    console.log(`Payment failed: ${paymentIntent.id} for user ${userId}`);

    // Update purchase record status
    await db.sql`
      UPDATE purchases
      SET status = 'failed', updated_at = NOW()
      WHERE stripe_payment_intent_id = ${paymentIntent.id}
    `;

    console.log(`Purchase status updated for failed payment: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { metadata, payment_intent } = session;
    const userId = metadata?.userId;
    const appId = metadata?.appId;

    console.log(`Checkout session completed: ${session.id} for user ${userId}`);

    if (payment_intent && typeof payment_intent === 'string') {
      // The payment intent succeeded event will handle the purchase creation
      console.log(`Payment intent ${payment_intent} will be handled separately`);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    console.log(`Subscription created: ${subscription.id} for customer ${customerId}`);

    // Handle subscription creation logic here
    // This could be for premium developer accounts, featured listings, etc.
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    console.log(`Subscription updated: ${subscription.id} for customer ${customerId}`);

    // Handle subscription update logic here
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    console.log(`Subscription deleted: ${subscription.id} for customer ${customerId}`);

    // Handle subscription cancellation logic here
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    
    console.log(`Invoice payment succeeded: ${invoice.id} for customer ${customerId}`);

    // Handle successful invoice payment logic here
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;

    console.log(`Invoice payment failed: ${invoice.id} for customer ${customerId}`);

    // Handle failed invoice payment logic here
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log(`Account updated: ${account.id}`);

    // Update connected account status in database
    await updateConnectedAccountStatus(account.id);
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

/**
 * Handle Stripe Connect account deauthorization
 */
async function handleAccountDeauthorized(account: Stripe.Account) {
  try {
    console.log(`Account deauthorized: ${account.id}`);

    // Mark account as deauthorized in database
    await db.sql`
      UPDATE connected_accounts
      SET
        charges_enabled = false,
        payouts_enabled = false,
        verification_status = 'deauthorized',
        updated_at = NOW()
      WHERE stripe_account_id = ${account.id}
    `;
  } catch (error) {
    console.error('Error handling account deauthorized:', error);
  }
}

/**
 * Handle transfer creation (developer payout)
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    console.log(`Transfer created: ${transfer.id} to ${transfer.destination}`);

    // Record payout in database
    await db.sql`
      INSERT INTO payouts (
        stripe_transfer_id,
        amount_cents,
        currency,
        status,
        description,
        metadata,
        processed_at
      )
      VALUES (
        ${transfer.id},
        ${transfer.amount},
        ${transfer.currency},
        'pending',
        ${transfer.description || 'Developer payout'},
        ${JSON.stringify(transfer.metadata)},
        NOW()
      )
      ON CONFLICT (stripe_transfer_id) DO UPDATE SET
        status = 'pending',
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

/**
 * Handle transfer updates
 */
async function handleTransferUpdated(transfer: Stripe.Transfer) {
  try {
    console.log(`Transfer updated: ${transfer.id}`);

    // Update payout status in database - transfers don't have status, they're either created or failed
    await db.sql`
      UPDATE payouts
      SET
        status = 'completed',
        updated_at = NOW()
      WHERE stripe_transfer_id = ${transfer.id}
    `;
  } catch (error) {
    console.error('Error handling transfer updated:', error);
  }
}

/**
 * Handle transfer failures
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  try {
    console.log(`Transfer failed: ${transfer.id} to ${transfer.destination}`);

    // Update payout status and notify developer
    await db.sql`
      UPDATE payouts
      SET
        status = 'failed',
        updated_at = NOW()
      WHERE stripe_transfer_id = ${transfer.id}
    `;

    // TODO: Send notification to developer about failed payout
  } catch (error) {
    console.error('Error handling transfer failed:', error);
  }
}

/**
 * Handle payout creation
 */
async function handlePayoutCreated(payout: Stripe.Payout) {
  try {
    console.log(`Payout created: ${payout.id} for ${payout.amount} ${payout.currency}`);

    // Log payout creation - this is when Stripe initiates bank transfer
  } catch (error) {
    console.error('Error handling payout created:', error);
  }
}

/**
 * Handle payout updates
 */
async function handlePayoutUpdated(payout: Stripe.Payout) {
  try {
    console.log(`Payout updated: ${payout.id} - status: ${payout.status}`);

    // Update any related records based on payout status
    if (payout.status === 'paid') {
      // Payout successfully completed
      console.log(`Payout ${payout.id} completed successfully`);
    }
  } catch (error) {
    console.error('Error handling payout updated:', error);
  }
}

/**
 * Handle payout failures
 */
async function handlePayoutFailed(payout: Stripe.Payout) {
  try {
    console.log(`Payout failed: ${payout.id} - ${payout.failure_message || 'Unknown error'}`);

    // TODO: Notify affected developers about payout failure
  } catch (error) {
    console.error('Error handling payout failed:', error);
  }
}

/**
 * Handle dispute creation
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    console.log(`Dispute created: ${dispute.id} for charge ${dispute.charge}`);

    // Create dispute case record
    await createDisputeCase(dispute);
  } catch (error) {
    console.error('Error handling dispute created:', error);
  }
}

/**
 * Handle dispute updates
 */
async function handleDisputeUpdated(dispute: Stripe.Dispute) {
  try {
    console.log(`Dispute updated: ${dispute.id} - status: ${dispute.status}`);

    // Update dispute status
    await updateDisputeStatus(dispute.id);
  } catch (error) {
    console.error('Error handling dispute updated:', error);
  }
}

/**
 * Handle dispute closure
 */
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  try {
    console.log(`Dispute closed: ${dispute.id} - status: ${dispute.status}`);

    // Update dispute status
    await updateDisputeStatus(dispute.id);
  } catch (error) {
    console.error('Error handling dispute closed:', error);
  }
}
