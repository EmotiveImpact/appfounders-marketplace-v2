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

    // Validate year
    if (year < 2020 || year > new Date().getFullYear()) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Get developer verification info
    const verificationQuery = `
      SELECT 
        dv.legal_name,
        dv.business_type,
        dv.business_name,
        dv.tax_country,
        dv.tax_id_type,
        dv.address,
        u.email
      FROM developer_verifications dv
      JOIN users u ON dv.user_id = u.id
      WHERE dv.user_id = $1 AND dv.verification_status = 'verified'
    `;

    const verificationResult = await neonClient.query(verificationQuery, [session.user.id]);

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Developer verification required for 1099 generation' },
        { status: 400 }
      );
    }

    const verification = verificationResult.rows[0];

    // Only generate 1099 for US taxpayers
    if (verification.tax_country !== 'US') {
      return NextResponse.json(
        { error: '1099 forms are only applicable for US taxpayers' },
        { status: 400 }
      );
    }

    // Calculate total payments for the year
    const paymentsQuery = `
      SELECT 
        COALESCE(SUM(p.developer_payout), 0) as total_payments,
        COUNT(*) as transaction_count,
        MIN(p.purchased_at) as first_payment,
        MAX(p.purchased_at) as last_payment
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
    `;

    const paymentsResult = await neonClient.query(paymentsQuery, [session.user.id, year]);
    const payments = paymentsResult.rows[0];

    // Check if 1099 threshold is met ($600 for 1099-NEC)
    const totalPayments = parseInt(payments.total_payments);
    const threshold = 60000; // $600 in cents

    if (totalPayments < threshold) {
      return NextResponse.json({
        eligible: false,
        total_payments: totalPayments,
        threshold,
        message: `Total payments of $${(totalPayments / 100).toFixed(2)} are below the $600 threshold for 1099-NEC reporting`,
      });
    }

    // Get quarterly breakdown
    const quarterlyQuery = `
      SELECT 
        EXTRACT(QUARTER FROM p.purchased_at) as quarter,
        COALESCE(SUM(p.developer_payout), 0) as quarterly_payments
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
      GROUP BY EXTRACT(QUARTER FROM p.purchased_at)
      ORDER BY quarter
    `;

    const quarterlyResult = await neonClient.query(quarterlyQuery, [session.user.id, year]);

    // Get backup withholding info (if applicable)
    const backupWithholdingQuery = `
      SELECT 
        COALESCE(SUM(p.amount * 0.24), 0) as backup_withholding -- 24% backup withholding rate
      FROM purchases p
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      AND EXTRACT(YEAR FROM p.purchased_at) = $2
      AND p.metadata->>'backup_withholding' = 'true'
    `;

    const backupWithholdingResult = await neonClient.query(backupWithholdingQuery, [session.user.id, year]);

    // Generate 1099-NEC data
    const form1099Data = {
      form_type: '1099-NEC',
      tax_year: year,
      payer_info: {
        name: 'AppFounders Marketplace',
        address: {
          street: '123 Tech Street', // Replace with actual company address
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
        },
        tin: '12-3456789', // Replace with actual company TIN
        phone: '(555) 123-4567', // Replace with actual phone
      },
      payee_info: {
        name: verification.business_type === 'business' ? verification.business_name : verification.legal_name,
        address: verification.address,
        tin_type: verification.tax_id_type,
        account_number: session.user.id.substring(0, 8), // Truncated user ID as account number
      },
      payment_info: {
        box_1_nonemployee_compensation: totalPayments, // Box 1: Nonemployee compensation
        box_4_federal_income_tax_withheld: parseInt(backupWithholdingResult.rows[0].backup_withholding), // Box 4: Federal income tax withheld
        box_5_fishing_boat_proceeds: 0, // Not applicable
        box_6_medical_health_care_payments: 0, // Not applicable
        box_7_payer_made_direct_sales: false, // Not applicable
        box_8_substitute_payments: 0, // Not applicable
        box_9_crop_insurance_proceeds: 0, // Not applicable
        box_10_gross_proceeds_attorney: 0, // Not applicable
        box_11_fish_purchased_for_resale: 0, // Not applicable
        box_12_section_409a_deferrals: 0, // Not applicable
        box_13_excess_golden_parachute: 0, // Not applicable
        box_15_state_tax_withheld: 0, // State tax withheld (if applicable)
        box_17_state_income: totalPayments, // State income (same as federal)
      },
      quarterly_breakdown: quarterlyResult.rows,
      transaction_summary: {
        total_transactions: parseInt(payments.transaction_count),
        first_payment_date: payments.first_payment,
        last_payment_date: payments.last_payment,
      },
      generated_at: new Date().toISOString(),
      due_date: `${year + 1}-01-31`, // 1099s are due by January 31st
    };

    // Record the 1099 generation
    await neonClient.query(
      `INSERT INTO tax_documents (
        user_id, document_type, tax_year, amount_cents, generated_at, metadata
      ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [
        session.user.id,
        '1099-NEC',
        year,
        totalPayments,
        JSON.stringify(form1099Data),
      ]
    );

    return NextResponse.json({
      eligible: true,
      form_1099_nec: form1099Data,
    });
  } catch (error) {
    console.error('Error generating 1099:', error);
    return NextResponse.json(
      { error: 'Failed to generate 1099' },
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
    const { year, email_to, delivery_method = 'email' } = body;

    if (!year) {
      return NextResponse.json(
        { error: 'Tax year is required' },
        { status: 400 }
      );
    }

    // Generate the 1099
    const form1099Response = await fetch(`${process.env.NEXTAUTH_URL}/api/developer/tax/1099?year=${year}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!form1099Response.ok) {
      const error = await form1099Response.json();
      return NextResponse.json(error, { status: form1099Response.status });
    }

    const form1099Data = await form1099Response.json();

    if (!form1099Data.eligible) {
      return NextResponse.json(form1099Data, { status: 400 });
    }

    // TODO: Generate PDF version of 1099-NEC
    // This would use a PDF generation library to create the official form

    // TODO: Send via email or postal mail based on delivery_method
    // For now, we'll just record the delivery request

    await neonClient.query(
      `INSERT INTO tax_document_deliveries (
        user_id, document_type, tax_year, delivery_method, 
        delivery_address, requested_at, status
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
      [
        session.user.id,
        '1099-NEC',
        year,
        delivery_method,
        email_to || null,
        'pending',
      ]
    );

    return NextResponse.json({
      message: `1099-NEC for ${year} has been queued for ${delivery_method} delivery`,
      form_data: form1099Data.form_1099_nec,
      delivery_method,
      delivery_address: email_to,
    });
  } catch (error) {
    console.error('Error delivering 1099:', error);
    return NextResponse.json(
      { error: 'Failed to deliver 1099' },
      { status: 500 }
    );
  }
}
