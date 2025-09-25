import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG, calculatePlatformFee } from '@/lib/stripe/config';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { appId, priceId, successUrl, cancelUrl } = await request.json();

    // Validate required fields
    if (!appId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields: appId and priceId' },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Fetch app details from database
    // For now, using mock data - this should be replaced with actual database query
    const mockApp = {
      id: appId,
      name: 'Sample App',
      price: 2999, // $29.99 in cents
      developerId: 'dev_123',
      stripeAccountId: 'acct_developer_stripe_account', // Developer's Stripe Connect account
    };

    const platformFee = calculatePlatformFee(mockApp.price);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: mockApp.name,
              description: `Lifetime access to ${mockApp.name}`,
            },
            unit_amount: mockApp.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${request.nextUrl.origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/marketplace/${appId}`,
      customer_email: user.email,
      metadata: {
        appId,
        userId: user.id,
        developerId: mockApp.developerId,
        platformFee: platformFee.toString(),
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: mockApp.stripeAccountId,
        },
        metadata: {
          appId,
          userId: user.id,
          developerId: mockApp.developerId,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
