import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, validateWebhookSignature } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Validate webhook signature
    const event = validateWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Received Stripe webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    const supabase = createClient();
    
    const { appId, userId, developerId, platformFee } = session.metadata;
    
    // Create purchase record in database
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        id: session.id,
        user_id: userId,
        app_id: appId,
        developer_id: developerId,
        amount: session.amount_total,
        platform_fee: parseInt(platformFee),
        developer_payout: session.amount_total - parseInt(platformFee),
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        status: 'completed',
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      throw purchaseError;
    }

    // Update app purchase count
    const { error: appUpdateError } = await supabase
      .from('apps')
      .update({
        purchase_count: supabase.raw('purchase_count + 1'),
        total_revenue: supabase.raw(`total_revenue + ${session.amount_total}`),
      })
      .eq('id', appId);

    if (appUpdateError) {
      console.error('Error updating app stats:', appUpdateError);
    }

    // TODO: Send confirmation email to user
    // TODO: Send notification to developer
    // TODO: Grant access to the app

    console.log('Purchase completed successfully:', purchase);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const supabase = createClient();
    
    // Update purchase status if needed
    const { error } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating purchase status:', error);
    }

    console.log('Payment intent succeeded:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const supabase = createClient();
    
    // Update purchase status to failed
    const { error } = await supabase
      .from('purchases')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating failed purchase:', error);
    }

    console.log('Payment intent failed:', paymentIntent.id);

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}
