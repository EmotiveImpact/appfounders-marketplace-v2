import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
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

    const scheduleResult = await neonClient.query(
      'SELECT * FROM payout_schedules WHERE user_id = $1',
      [(session.user as any).id]
    );

    return NextResponse.json({
      schedule: scheduleResult[0] || null,
    });
  } catch (error) {
    console.error('Error fetching payout schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
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
    const {
      enabled,
      frequency, // 'weekly', 'monthly'
      minimum_amount_cents,
      day_of_week, // 1-7 for weekly (1 = Monday)
      day_of_month, // 1-28 for monthly
    } = body;

    if (!frequency || !['weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be weekly or monthly.' },
        { status: 400 }
      );
    }

    if (minimum_amount_cents && minimum_amount_cents < 1000) {
      return NextResponse.json(
        { error: 'Minimum payout amount must be at least $10.00' },
        { status: 400 }
      );
    }

    if (frequency === 'weekly' && (day_of_week < 1 || day_of_week > 7)) {
      return NextResponse.json(
        { error: 'Day of week must be between 1 (Monday) and 7 (Sunday)' },
        { status: 400 }
      );
    }

    if (frequency === 'monthly' && (day_of_month < 1 || day_of_month > 28)) {
      return NextResponse.json(
        { error: 'Day of month must be between 1 and 28' },
        { status: 400 }
      );
    }

    // Calculate next payout date
    const now = new Date();
    let nextPayoutDate = new Date();

    if (frequency === 'weekly') {
      const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
      const daysUntilNext = (day_of_week - currentDayOfWeek + 7) % 7;
      nextPayoutDate.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
    } else {
      // Monthly
      nextPayoutDate.setMonth(now.getMonth() + 1);
      nextPayoutDate.setDate(day_of_month);
      
      // If the target day has already passed this month, schedule for next month
      if (now.getDate() >= day_of_month) {
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
      }
    }

    // Upsert payout schedule
    const scheduleResult = await neonClient.query(
      `INSERT INTO payout_schedules (
        user_id, enabled, frequency, minimum_amount_cents, 
        day_of_week, day_of_month, next_payout_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        enabled = $2,
        frequency = $3,
        minimum_amount_cents = $4,
        day_of_week = $5,
        day_of_month = $6,
        next_payout_date = $7,
        updated_at = NOW()
      RETURNING *`,
      [
        (session.user as any).id,
        enabled,
        frequency,
        minimum_amount_cents || 1000,
        frequency === 'weekly' ? day_of_week : null,
        frequency === 'monthly' ? day_of_month : null,
        nextPayoutDate,
      ]
    );

    return NextResponse.json({
      message: 'Payout schedule updated successfully',
      schedule: scheduleResult[0],
    });
  } catch (error) {
    console.error('Error updating payout schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update payout schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
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

    await neonClient.query(
      'UPDATE payout_schedules SET enabled = false WHERE user_id = $1',
      [(session.user as any).id]
    );

    return NextResponse.json({
      message: 'Payout schedule disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling payout schedule:', error);
    return NextResponse.json(
      { error: 'Failed to disable payout schedule' },
      { status: 500 }
    );
  }
}

// Background job endpoint for processing scheduled payouts (called by cron job)
export async function PUT(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or background worker
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all enabled schedules that are due for payout
    const schedulesQuery = `
      SELECT 
        ps.*,
        u.email,
        u.name,
        ca.stripe_account_id,
        ca.charges_enabled,
        ca.payouts_enabled
      FROM payout_schedules ps
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN connected_accounts ca ON ps.user_id = ca.user_id
      WHERE ps.enabled = true 
      AND ps.next_payout_date <= NOW()
      AND u.role = 'developer'
      ORDER BY ps.next_payout_date ASC
      LIMIT 50
    `;

    const schedulesResult = await neonClient.query(schedulesQuery);
    const processedPayouts = [];

    for (const schedule of schedulesResult) {
      try {
        // Check if user has sufficient balance
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

        const balanceResult = await neonClient.query(balanceQuery, [schedule.user_id]);
        const availableBalance = parseInt(balanceResult[0].available_balance);

        if (availableBalance >= schedule.minimum_amount_cents && 
            schedule.charges_enabled && 
            schedule.payouts_enabled) {
          
          // Create automatic payout
          const payoutResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/developer/payouts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${expectedToken}`, // Internal API call
            },
            body: JSON.stringify({
              amount_cents: availableBalance,
              description: `Scheduled ${schedule.frequency} payout`,
              user_id: schedule.user_id, // For internal API calls
            }),
          });

          if (payoutResponse.ok) {
            processedPayouts.push({
              user_id: schedule.user_id,
              email: schedule.email,
              amount_cents: availableBalance,
              status: 'processed',
            });
          } else {
            processedPayouts.push({
              user_id: schedule.user_id,
              email: schedule.email,
              amount_cents: availableBalance,
              status: 'failed',
              error: 'Payout API call failed',
            });
          }
        } else {
          processedPayouts.push({
            user_id: schedule.user_id,
            email: schedule.email,
            amount_cents: availableBalance,
            status: 'skipped',
            reason: availableBalance < schedule.minimum_amount_cents 
              ? 'Insufficient balance' 
              : 'Account not ready',
          });
        }

        // Update next payout date
        const now = new Date();
        let nextPayoutDate = new Date();

        if (schedule.frequency === 'weekly') {
          nextPayoutDate.setDate(now.getDate() + 7);
        } else {
          nextPayoutDate.setMonth(now.getMonth() + 1);
          nextPayoutDate.setDate(schedule.day_of_month);
        }

        await neonClient.query(
          'UPDATE payout_schedules SET next_payout_date = $1, last_processed_at = NOW() WHERE id = $2',
          [nextPayoutDate, schedule.id]
        );

      } catch (scheduleError) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
        processedPayouts.push({
          user_id: schedule.user_id,
          email: schedule.email,
          status: 'error',
          error: (scheduleError as Error).message,
        });
      }
    }

    return NextResponse.json({
      message: 'Scheduled payouts processing completed',
      processed_count: processedPayouts.length,
      payouts: processedPayouts,
    });
  } catch (error) {
    console.error('Error processing scheduled payouts:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled payouts' },
      { status: 500 }
    );
  }
}
