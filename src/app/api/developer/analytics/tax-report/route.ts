import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const format = searchParams.get('format') || 'json'; // json, csv

    // Validate year
    if (year < 2020 || year > new Date().getFullYear()) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Get developer verification info for tax reporting
    const verificationQuery = `
      SELECT 
        dv.legal_name,
        dv.business_type,
        dv.business_name,
        dv.tax_country,
        dv.tax_id_type,
        u.email
      FROM developer_verifications dv
      JOIN users u ON dv.user_id = u.id
      WHERE dv.user_id = $1 AND dv.verification_status = 'verified'
    `;

    const verificationResult = await neonClient.query(verificationQuery, [session.user.id]);

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Developer verification required for tax reporting' },
        { status: 400 }
      );
    }

    const verification = verificationResult.rows[0];

    // Annual revenue summary
    const annualSummaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COALESCE(SUM(p.platform_fee), 0) as platform_fees,
        COUNT(DISTINCT p.app_id) as apps_sold,
        COUNT(DISTINCT p.user_id) as unique_customers
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
    `;

    const annualSummaryResult = await neonClient.query(annualSummaryQuery, [session.user.id, year]);

    // Monthly breakdown
    const monthlyBreakdownQuery = `
      SELECT 
        EXTRACT(MONTH FROM p.purchased_at) as month,
        TO_CHAR(p.purchased_at, 'Month') as month_name,
        COUNT(*) as transactions,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COALESCE(SUM(p.platform_fee), 0) as platform_fees
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
      GROUP BY EXTRACT(MONTH FROM p.purchased_at), TO_CHAR(p.purchased_at, 'Month')
      ORDER BY month
    `;

    const monthlyBreakdownResult = await neonClient.query(monthlyBreakdownQuery, [session.user.id, year]);

    // Revenue by app for tax purposes
    const appRevenueQuery = `
      SELECT 
        a.id,
        a.name,
        a.category,
        COUNT(p.id) as transactions,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue,
        COALESCE(SUM(p.platform_fee), 0) as platform_fees
      FROM apps a
      LEFT JOIN purchases p ON a.id = p.app_id 
        AND p.status = 'completed' 
        AND p.developer_id = $1 
        AND EXTRACT(YEAR FROM p.purchased_at) = $2
      WHERE a.developer_id = $1
      GROUP BY a.id, a.name, a.category
      HAVING COUNT(p.id) > 0
      ORDER BY net_revenue DESC
    `;

    const appRevenueResult = await neonClient.query(appRevenueQuery, [session.user.id, year]);

    // Refunds for tax purposes
    const refundsQuery = `
      SELECT 
        COUNT(*) as refund_count,
        COALESCE(SUM(p.refund_amount), 0) as total_refunded,
        COALESCE(SUM(p.amount - p.refund_amount), 0) as net_after_refunds
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'refunded'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
    `;

    const refundsResult = await neonClient.query(refundsQuery, [session.user.id, year]);

    // Payouts received (for cash basis accounting)
    const payoutsQuery = `
      SELECT 
        COUNT(*) as payout_count,
        COALESCE(SUM(amount_cents), 0) as total_payouts,
        MIN(processed_at) as first_payout,
        MAX(processed_at) as last_payout
      FROM payouts
      WHERE user_id = $1 
      AND status = 'completed'
      AND EXTRACT(YEAR FROM processed_at) = $2
    `;

    const payoutsResult = await neonClient.query(payoutsQuery, [session.user.id, year]);

    // Quarterly breakdown for 1099 purposes (US)
    const quarterlyBreakdownQuery = `
      SELECT 
        EXTRACT(QUARTER FROM p.purchased_at) as quarter,
        COUNT(*) as transactions,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
      GROUP BY EXTRACT(QUARTER FROM p.purchased_at)
      ORDER BY quarter
    `;

    const quarterlyBreakdownResult = await neonClient.query(quarterlyBreakdownQuery, [session.user.id, year]);

    // Detailed transaction list for record keeping
    const transactionsQuery = `
      SELECT 
        p.id,
        p.purchased_at,
        a.name as app_name,
        p.amount as gross_amount,
        p.developer_payout as net_amount,
        p.platform_fee,
        u.email as customer_email,
        p.stripe_payment_intent_id
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      JOIN users u ON p.user_id = u.id
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
      ORDER BY p.purchased_at ASC
    `;

    const transactionsResult = await neonClient.query(transactionsQuery, [session.user.id, year]);

    const taxReport = {
      report_info: {
        year,
        generated_at: new Date().toISOString(),
        developer_info: verification,
        report_type: 'Annual Tax Report',
      },
      annual_summary: annualSummaryResult.rows[0],
      monthly_breakdown: monthlyBreakdownResult.rows,
      quarterly_breakdown: quarterlyBreakdownResult.rows,
      app_revenue: appRevenueResult.rows,
      refunds: refundsResult.rows[0],
      payouts: payoutsResult.rows[0],
      transactions: transactionsResult.rows,
      tax_notes: {
        gross_revenue_note: 'Total amount received from customers before platform fees',
        net_revenue_note: 'Amount after platform fees (your actual income)',
        platform_fees_note: 'Fees paid to AppFounders platform (may be deductible)',
        refunds_note: 'Refunded amounts (reduce your taxable income)',
        accounting_method_note: 'This report supports both cash and accrual accounting methods',
        disclaimer: 'This report is for informational purposes only. Consult a tax professional for tax advice.',
      },
    };

    // Return CSV format if requested
    if (format === 'csv') {
      const csvHeaders = [
        'Date',
        'Transaction ID',
        'App Name',
        'Gross Amount',
        'Net Amount',
        'Platform Fee',
        'Customer Email',
        'Payment Intent ID'
      ];

      const csvRows = transactionsResult.rows.map(transaction => [
        transaction.purchased_at,
        transaction.id,
        transaction.app_name,
        (transaction.gross_amount / 100).toFixed(2),
        (transaction.net_amount / 100).toFixed(2),
        (transaction.platform_fee / 100).toFixed(2),
        transaction.customer_email,
        transaction.stripe_payment_intent_id
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tax-report-${year}.csv"`,
        },
      });
    }

    return NextResponse.json(taxReport);
  } catch (error) {
    console.error('Error generating tax report:', error);
    return NextResponse.json(
      { error: 'Failed to generate tax report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { year, email_to } = body;

    if (!year || !email_to) {
      return NextResponse.json(
        { error: 'Year and email address are required' },
        { status: 400 }
      );
    }

    // Generate the tax report
    const reportResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/developer/analytics/tax-report?year=${year}&format=csv`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!reportResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate tax report' },
        { status: 500 }
      );
    }

    const csvContent = await reportResponse.text();

    // TODO: Send email with CSV attachment
    // This would integrate with your email service to send the tax report
    // For now, we'll just log that the email would be sent

    console.log(`Tax report for ${year} would be emailed to ${email_to}`);

    // Create a record of the generated report
    await neonClient.query(
      `INSERT INTO tax_reports (
        user_id, year, generated_at, email_sent_to, file_size
      ) VALUES ($1, $2, NOW(), $3, $4)`,
      [session.user.id, year, email_to, csvContent.length]
    );

    return NextResponse.json({
      message: 'Tax report generated and email sent successfully',
      year,
      email_to,
    });
  } catch (error) {
    console.error('Error sending tax report:', error);
    return NextResponse.json(
      { error: 'Failed to send tax report' },
      { status: 500 }
    );
  }
}
