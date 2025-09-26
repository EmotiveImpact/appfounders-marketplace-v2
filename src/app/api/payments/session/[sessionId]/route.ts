import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getCheckoutSession } from '@/lib/stripe/payments';

export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { sessionId: string } }) => {
    try {
      const { sessionId } = params;

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        );
      }

      // Retrieve session from Stripe
      const session = await getCheckoutSession(sessionId);

      // Verify the session belongs to the current user
      const sessionUserId = session.metadata?.userId;
      if (sessionUserId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to session' },
          { status: 403 }
        );
      }

      // Extract payment intent details
      const paymentIntent = session.payment_intent as any;
      
      return NextResponse.json({
        sessionId: session.id,
        paymentIntentId: paymentIntent?.id || '',
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        status: session.payment_status,
        appId: session.metadata?.appId || null,
        appName: session.metadata?.appName || null,
        customerEmail: session.customer_details?.email || user.email,
        created: session.created,
      });
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to retrieve session details' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users can view their sessions
  }
);
