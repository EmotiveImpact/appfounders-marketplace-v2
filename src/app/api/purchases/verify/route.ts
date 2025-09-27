import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface PurchaseVerificationRequest {
  app_id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
}

// POST /api/purchases/verify - Verify a purchase and grant access
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { app_id, stripe_session_id, stripe_payment_intent_id }: PurchaseVerificationRequest = await req.json();

      if (!app_id) {
        return NextResponse.json(
          { error: 'App ID is required' },
          { status: 400 }
        );
      }

      // Get app information
      const appQuery = `
        SELECT 
          a.*,
          u.name as developer_name,
          u.email as developer_email
        FROM apps a
        JOIN users u ON a.developer_id = u.id
        WHERE a.id = $1 AND a.status = 'approved'
      `;

      const appResult = await neonClient.sql(appQuery, [app_id]);

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App not found or not available for purchase' },
          { status: 404 }
        );
      }

      const app = appResult[0];

      // Check if user already owns this app
      const existingPurchaseQuery = `
        SELECT id, status FROM purchases 
        WHERE user_id = $1 AND app_id = $2 AND status = 'completed'
      `;

      const existingPurchase = await neonClient.sql(existingPurchaseQuery, [user.id, app_id]);

      if (existingPurchase.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'You already own this app',
          purchase: existingPurchase[0],
          access_granted: true,
        });
      }

      // If payment identifiers provided, verify the payment with Stripe
      let paymentVerified = false;
      let paymentAmount = 0;

      if (stripe_session_id || stripe_payment_intent_id) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          
          if (stripe_session_id) {
            const session = await stripe.checkout.sessions.retrieve(stripe_session_id);
            if (session.payment_status === 'paid') {
              paymentVerified = true;
              paymentAmount = session.amount_total;
            }
          } else if (stripe_payment_intent_id) {
            const paymentIntent = await stripe.paymentIntents.retrieve(stripe_payment_intent_id);
            if (paymentIntent.status === 'succeeded') {
              paymentVerified = true;
              paymentAmount = paymentIntent.amount;
            }
          }
        } catch (stripeError) {
          console.error('Stripe verification error:', stripeError);
          return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 400 }
          );
        }
      } else {
        // For free apps or testing, allow immediate access
        if (app.price === 0) {
          paymentVerified = true;
          paymentAmount = 0;
        }
      }

      if (!paymentVerified) {
        return NextResponse.json(
          { error: 'Payment not verified' },
          { status: 400 }
        );
      }

      // Calculate commission split (80% to developer, 20% to platform)
      const platformFee = Math.round(paymentAmount * 0.20);
      const developerPayout = paymentAmount - platformFee;

      // Create purchase record
      const purchaseQuery = `
        INSERT INTO purchases (
          user_id,
          app_id,
          developer_id,
          amount,
          platform_fee,
          developer_payout,
          stripe_session_id,
          stripe_payment_intent_id,
          status,
          purchased_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const purchase = await neonClient.sql(purchaseQuery, [
        user.id,
        app_id,
        app.developer_id,
        paymentAmount,
        platformFee,
        developerPayout,
        stripe_session_id,
        stripe_payment_intent_id,
        'completed',
      ]);

      // Update app purchase count and revenue
      const updateAppQuery = `
        UPDATE apps 
        SET 
          purchase_count = purchase_count + 1,
          total_revenue = total_revenue + $1,
          updated_at = NOW()
        WHERE id = $2
      `;

      await neonClient.sql(updateAppQuery, [paymentAmount, app_id]);

      // Log user activity
      const activityQuery = `
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      await neonClient.sql(activityQuery, [
        user.id,
        'app_purchased',
        JSON.stringify({
          app_id,
          app_name: app.name,
          amount: paymentAmount,
          developer_id: app.developer_id,
        }),
      ]);

      // Log developer activity
      await neonClient.sql(activityQuery, [
        app.developer_id,
        'app_sold',
        JSON.stringify({
          app_id,
          app_name: app.name,
          amount: paymentAmount,
          payout: developerPayout,
          buyer_id: user.id,
          buyer_name: user.name,
        }),
      ]);

      // Send confirmation emails
      try {
        // Email to buyer
        await sendEmail({
          to: user.email,
          subject: `🎉 Purchase confirmed: ${app.name}`,
          template: 'purchase-confirmation' as any,
          data: {
            user_name: user.name,
            app_name: app.name,
            app_id,
            amount: paymentAmount / 100, // Convert cents to dollars
            purchase_date: new Date().toLocaleDateString(),
            download_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${app_id}`,
          },
        } as any);

        // Email to developer
        await sendEmail({
          to: app.developer_email,
          subject: `💰 New sale: ${app.name}`,
          template: 'sale-notification',
          data: {
            developer_name: app.developer_name,
            app_name: app.name,
            buyer_name: user.name,
            amount: paymentAmount / 100,
            payout: developerPayout / 100,
            sale_date: new Date().toLocaleDateString(),
          },
        } as any);
      } catch (emailError) {
        console.error('Failed to send confirmation emails:', emailError);
        // Don't fail the purchase if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Purchase verified and access granted',
        purchase: purchase[0],
        access_granted: true,
        app: {
          id: app.id,
          name: app.name,
          download_url: app.app_file_url,
        },
      });
    } catch (error: any) {
      console.error('Error verifying purchase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to verify purchase' },
        { status: 500 }
      );
    }
  }
);

// GET /api/purchases/verify - Check if user has access to an app
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const appId = searchParams.get('app_id');

      if (!appId) {
        return NextResponse.json(
          { error: 'App ID is required' },
          { status: 400 }
        );
      }

      // Check if user has purchased this app
      const purchaseQuery = `
        SELECT 
          p.*,
          a.name as app_name,
          a.app_file_url,
          a.status as app_status
        FROM purchases p
        JOIN apps a ON p.app_id = a.id
        WHERE p.user_id = $1 AND p.app_id = $2 AND p.status = 'completed'
      `;

      const purchase = await neonClient.sql(purchaseQuery, [user.id, appId]);

      if (purchase.length === 0) {
        return NextResponse.json({
          success: false,
          has_access: false,
          message: 'App not purchased',
        });
      }

      const purchaseRecord = purchase[0];

      // Check if app is still available
      if (purchaseRecord.app_status !== 'approved') {
        return NextResponse.json({
          success: false,
          has_access: false,
          message: 'App is no longer available',
        });
      }

      return NextResponse.json({
        success: true,
        has_access: true,
        purchase: purchaseRecord,
        app: {
          id: appId,
          name: purchaseRecord.app_name,
          download_url: purchaseRecord.app_file_url,
        },
      });
    } catch (error: any) {
      console.error('Error checking purchase access:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to check purchase access' },
        { status: 500 }
      );
    }
  }
);
