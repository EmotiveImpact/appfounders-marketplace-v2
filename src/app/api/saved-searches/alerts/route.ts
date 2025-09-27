import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        sa.*,
        ss.name as search_name,
        ss.search_query,
        ss.filters,
        COUNT(san.id) as new_results_count
      FROM search_alerts sa
      JOIN saved_searches ss ON sa.saved_search_id = ss.id
      LEFT JOIN search_alert_notifications san ON sa.id = san.alert_id AND san.read = false
      WHERE sa.user_id = $1
      GROUP BY sa.id, ss.id
      ORDER BY sa.last_triggered DESC NULLS LAST, sa.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await neonClient.query(query, [(session.user as any).id, limit, offset]);

    // Get total count
    const countResult = await neonClient.query(
      'SELECT COUNT(*) FROM search_alerts WHERE user_id = $1',
      [(session.user as any).id]
    );

    return NextResponse.json({
      alerts: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count),
        pages: Math.ceil(parseInt(countResult[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching search alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search alerts' },
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

    const body = await request.json();
    const { action, alert_id } = body;

    if (!action || !alert_id) {
      return NextResponse.json(
        { error: 'Action and alert ID are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const ownershipCheck = await neonClient.query(
      'SELECT id FROM search_alerts WHERE id = $1 AND user_id = $2',
      [alert_id, (session.user as any).id]
    );

    if (ownershipCheck.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'pause':
        await neonClient.query(
          'UPDATE search_alerts SET active = false WHERE id = $1',
          [alert_id]
        );
        break;

      case 'resume':
        await neonClient.query(
          'UPDATE search_alerts SET active = true WHERE id = $1',
          [alert_id]
        );
        break;

      case 'mark_read':
        await neonClient.query(
          'UPDATE search_alert_notifications SET read = true WHERE alert_id = $1',
          [alert_id]
        );
        break;

      case 'test':
        // Trigger a test alert by running the search
        const alertResult = await neonClient.query(
          `SELECT sa.*, ss.search_query, ss.filters 
           FROM search_alerts sa 
           JOIN saved_searches ss ON sa.saved_search_id = ss.id 
           WHERE sa.id = $1`,
          [alert_id]
        );

        if (alertResult.length > 0) {
          const alert = alertResult[0];
          
          // Run the search to find new apps
          const searchQuery = `
            SELECT a.*, d.name as developer_name, d.verified as developer_verified
            FROM apps a
            JOIN developers d ON a.developer_id = d.id
            WHERE a.status = 'approved'
            AND a.created_at > COALESCE($2, '1970-01-01')
            AND (
              to_tsvector('english', a.name || ' ' || a.short_description || ' ' || a.long_description) 
              @@ plainto_tsquery('english', $1)
              OR a.name ILIKE '%' || $1 || '%'
            )
            ORDER BY a.created_at DESC
            LIMIT 5
          `;

          const searchResults = await neonClient.query(searchQuery, [
            alert.search_query,
            alert.last_triggered || new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours if no previous trigger
          ]);

          // Create notification record
          if (searchResults.length > 0) {
            await neonClient.query(
              `INSERT INTO search_alert_notifications (
                alert_id, user_id, app_ids, notification_type, read
              ) VALUES ($1, $2, $3, 'test', false)`,
              [
                alert_id,
                (session.user as any).id,
                JSON.stringify(searchResults.map(app => app.id)),
              ]
            );

            return NextResponse.json({
              message: 'Test alert sent successfully',
              results_count: searchResults.length,
              results: searchResults.rows,
            });
          } else {
            return NextResponse.json({
              message: 'No new results found for test alert',
              results_count: 0,
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Alert ${action} completed successfully`,
    });
  } catch (error) {
    console.error('Error managing search alert:', error);
    return NextResponse.json(
      { error: 'Failed to manage search alert' },
      { status: 500 }
    );
  }
}

// Background job endpoint for processing alerts (called by cron job)
export async function PUT(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or background worker
    // For security, you might want to add API key authentication here
    
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active alerts that need to be checked
    const alertsToCheck = await neonClient.query(
      `SELECT sa.*, ss.search_query, ss.filters, u.email, u.name as user_name
       FROM search_alerts sa
       JOIN saved_searches ss ON sa.saved_search_id = ss.id
       JOIN users u ON sa.user_id = u.id
       WHERE sa.active = true 
       AND sa.next_check <= NOW()
       ORDER BY sa.next_check ASC
       LIMIT 50`
    );

    const processedAlerts = [];

    for (const alert of alertsToCheck) {
      try {
        // Run the search to find new apps since last check
        const searchQuery = `
          SELECT a.*, d.name as developer_name, d.verified as developer_verified
          FROM apps a
          JOIN developers d ON a.developer_id = d.id
          WHERE a.status = 'approved'
          AND a.created_at > COALESCE($2, '1970-01-01')
          AND (
            to_tsvector('english', a.name || ' ' || a.short_description || ' ' || a.long_description) 
            @@ plainto_tsquery('english', $1)
            OR a.name ILIKE '%' || $1 || '%'
          )
          ORDER BY a.created_at DESC
          LIMIT 10
        `;

        const searchResults = await neonClient.query(searchQuery, [
          alert.search_query,
          alert.last_triggered || alert.created_at,
        ]);

        if (searchResults.length > 0) {
          // Create notification record
          await neonClient.query(
            `INSERT INTO search_alert_notifications (
              alert_id, user_id, app_ids, notification_type, read
            ) VALUES ($1, $2, $3, 'scheduled', false)`,
            [
              alert.id,
              alert.user_id,
              JSON.stringify(searchResults.map(app => app.id)),
            ]
          );

          // TODO: Send email notification here
          // You would integrate with your email service to send the alert
        }

        // Update alert with next check time
        const nextCheck = new Date();
        if (alert.frequency === 'daily') {
          nextCheck.setDate(nextCheck.getDate() + 1);
        } else {
          nextCheck.setDate(nextCheck.getDate() + 7);
        }

        await neonClient.query(
          `UPDATE search_alerts SET 
            last_triggered = NOW(),
            next_check = $1,
            total_notifications = total_notifications + 1
           WHERE id = $2`,
          [nextCheck, alert.id]
        );

        processedAlerts.push({
          alert_id: alert.id,
          user_email: alert.email,
          results_count: searchResults.length,
        });

      } catch (alertError) {
        console.error(`Error processing alert ${alert.id}:`, alertError);
      }
    }

    return NextResponse.json({
      message: 'Alert processing completed',
      processed_count: processedAlerts.length,
      alerts: processedAlerts,
    });
  } catch (error) {
    console.error('Error processing search alerts:', error);
    return NextResponse.json(
      { error: 'Failed to process search alerts' },
      { status: 500 }
    );
  }
}
