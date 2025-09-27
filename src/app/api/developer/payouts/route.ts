import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [(session.user as any).id]
    );

    if (userCheck.length === 0 || userCheck[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.user_id = $1';
    const queryParams = [(session.user as any).id];

    if (status) {
      whereClause += ' AND p.status = $2';
      queryParams.push(status);
    }

    const query = `
      SELECT 
        p.*,
        ca.stripe_account_id,
        ca.charges_enabled,
        ca.payouts_enabled
      FROM payouts p
      LEFT JOIN connected_accounts ca ON p.user_id = ca.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const result = await neonClient.query(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM payouts p ${whereClause}
    `;
    const countResult = await neonClient.query(countQuery, queryParams.slice(0, -2));

    // Get pending earnings
    const earningsQuery = `
      SELECT 
        COALESCE(SUM(developer_payout), 0) as pending_earnings,
        COUNT(*) as pending_purchases
      FROM purchases 
      WHERE developer_id = $1 
      AND status = 'completed'
      AND id NOT IN (
        SELECT DISTINCT purchase_id 
        FROM payout_items 
        WHERE purchase_id IS NOT NULL
      )
    `;

    const earningsResult = await neonClient.query(earningsQuery, [(session.user as any).id]);

    return NextResponse.json({
      payouts: result.rows,
      pending_earnings: earningsResult[0],
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count),
        pages: Math.ceil(parseInt(countResult[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [(session.user as any).id]
    );

    if (userCheck.length === 0 || userCheck[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { amount_cents, description } = body;

    if (!amount_cents || amount_cents < 1000) { // Minimum $10
      return NextResponse.json(
        { error: 'Minimum payout amount is $10.00' },
        { status: 400 }
      );
    }

    // Check if user has connected Stripe account
    const connectedAccountResult = await neonClient.query(
      'SELECT * FROM connected_accounts WHERE user_id = $1',
      [(session.user as any).id]
    );

    if (connectedAccountResult.length === 0) {
      return NextResponse.json(
        { error: 'No connected payment account found. Please connect your Stripe account first.' },
        { status: 400 }
      );
    }

    const connectedAccount = connectedAccountResult[0];

    if (!connectedAccount.charges_enabled || !connectedAccount.payouts_enabled) {
      return NextResponse.json(
        { error: 'Your payment account is not fully set up. Please complete your Stripe account setup.' },
        { status: 400 }
      );
    }

    // Check available balance
    const balanceQuery = `
      SELECT 
        COALESCE(SUM(developer_payout), 0) as available_balance
      FROM purchases 
      WHERE developer_id = $1 
      AND status = 'completed'
      AND id NOT IN (
        SELECT DISTINCT purchase_id 
        FROM payout_items 
        WHERE purchase_id IS NOT NULL
      )
    `;

    const balanceResult = await neonClient.query(balanceQuery, [(session.user as any).id]);
    const availableBalance = parseInt(balanceResult[0].available_balance);

    if (amount_cents > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${(availableBalance / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create payout record
    const payoutResult = await neonClient.query(
      `INSERT INTO payouts (
        user_id, amount_cents, currency, status, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        (session.user as any).id,
        amount_cents,
        'usd',
        'pending',
        description || 'Developer payout request',
        JSON.stringify({ requested_by: (session.user as any).id }),
      ]
    );

    const payout = payoutResult[0];

    // Get purchases to include in this payout
    const purchasesQuery = `
      SELECT id, developer_payout, created_at
      FROM purchases 
      WHERE developer_id = $1 
      AND status = 'completed'
      AND id NOT IN (
        SELECT DISTINCT purchase_id 
        FROM payout_items 
        WHERE purchase_id IS NOT NULL
      )
      ORDER BY created_at ASC
    `;

    const purchasesResult = await neonClient.query(purchasesQuery, [(session.user as any).id]);
    
    let remainingAmount = amount_cents;
    const payoutItems = [];

    // Create payout items for the purchases
    for (const purchase of purchasesResult) {
      if (remainingAmount <= 0) break;

      const itemAmount = Math.min(remainingAmount, purchase.developer_payout);
      
      await neonClient.query(
        `INSERT INTO payout_items (
          payout_id, purchase_id, amount_cents, description
        ) VALUES ($1, $2, $3, $4)`,
        [
          payout.id,
          purchase.id,
          itemAmount,
          `Payout for purchase ${purchase.id}`,
        ]
      );

      payoutItems.push({
        purchase_id: purchase.id,
        amount_cents: itemAmount,
      });

      remainingAmount -= itemAmount;
    }

    // Process the payout through Stripe
    try {
      const transfer = await stripe.transfers.create({
        amount: amount_cents,
        currency: 'usd',
        destination: connectedAccount.stripe_account_id,
        description: description || 'Developer payout',
        metadata: {
          payout_id: payout.id,
          user_id: (session.user as any).id,
        },
      });

      // Update payout with Stripe transfer ID
      await neonClient.query(
        `UPDATE payouts SET 
          stripe_transfer_id = $1, 
          status = 'processing',
          processed_at = NOW()
         WHERE id = $2`,
        [transfer.id, payout.id]
      );

      return NextResponse.json({
        message: 'Payout request submitted successfully',
        payout: {
          ...payout,
          stripe_transfer_id: transfer.id,
          status: 'processing',
        },
        items: payoutItems,
      });

    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError);

      // Update payout status to failed
      await neonClient.query(
        `UPDATE payouts SET 
          status = 'failed',
          metadata = $1
         WHERE id = $2`,
        [
          JSON.stringify({ 
            error: stripeError.message,
            requested_by: (session.user as any).id 
          }),
          payout.id,
        ]
      );

      return NextResponse.json(
        { error: 'Failed to process payout: ' + stripeError.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    );
  }
}
