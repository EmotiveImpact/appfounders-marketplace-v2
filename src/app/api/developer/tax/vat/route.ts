import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

// VAT rates by country (simplified - in production, use a comprehensive tax service)
const VAT_RATES = {
  'AT': 0.20, // Austria
  'BE': 0.21, // Belgium
  'BG': 0.20, // Bulgaria
  'HR': 0.25, // Croatia
  'CY': 0.19, // Cyprus
  'CZ': 0.21, // Czech Republic
  'DK': 0.25, // Denmark
  'EE': 0.20, // Estonia
  'FI': 0.24, // Finland
  'FR': 0.20, // France
  'DE': 0.19, // Germany
  'GR': 0.24, // Greece
  'HU': 0.27, // Hungary
  'IE': 0.23, // Ireland
  'IT': 0.22, // Italy
  'LV': 0.21, // Latvia
  'LT': 0.21, // Lithuania
  'LU': 0.17, // Luxembourg
  'MT': 0.18, // Malta
  'NL': 0.21, // Netherlands
  'PL': 0.23, // Poland
  'PT': 0.23, // Portugal
  'RO': 0.19, // Romania
  'SK': 0.20, // Slovakia
  'SI': 0.22, // Slovenia
  'ES': 0.21, // Spain
  'SE': 0.25, // Sweden
  'GB': 0.20, // United Kingdom
  'NO': 0.25, // Norway
  'CH': 0.077, // Switzerland
};

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
    const quarter = searchParams.get('quarter'); // Q1, Q2, Q3, Q4
    const country = searchParams.get('country');

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
        dv.address,
        u.email
      FROM developer_verifications dv
      JOIN users u ON dv.user_id = u.id
      WHERE dv.user_id = $1 AND dv.verification_status = 'verified'
    `;

    const verificationResult = await neonClient.query(verificationQuery, [session.user.id]);

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Developer verification required for VAT reporting' },
        { status: 400 }
      );
    }

    const verification = verificationResult.rows[0];

    // Build date filter
    let dateFilter = `AND EXTRACT(YEAR FROM p.purchased_at) = ${year}`;
    if (quarter) {
      const quarterNum = parseInt(quarter.replace('Q', ''));
      if (quarterNum >= 1 && quarterNum <= 4) {
        dateFilter += ` AND EXTRACT(QUARTER FROM p.purchased_at) = ${quarterNum}`;
      }
    }

    // Build country filter
    let countryFilter = '';
    if (country) {
      countryFilter = `AND u.country = '${country}'`;
    }

    // Get sales by customer country for VAT calculation
    const salesByCountryQuery = `
      SELECT 
        COALESCE(u.country, 'Unknown') as customer_country,
        COUNT(*) as transaction_count,
        COALESCE(SUM(p.amount), 0) as gross_revenue,
        COALESCE(SUM(p.developer_payout), 0) as net_revenue
      FROM purchases p
      JOIN users u ON p.user_id = u.id
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      ${dateFilter}
      ${countryFilter}
      GROUP BY u.country
      ORDER BY gross_revenue DESC
    `;

    const salesByCountryResult = await neonClient.query(salesByCountryQuery, [session.user.id]);

    // Calculate VAT obligations
    const vatCalculations = salesByCountryResult.rows.map(sale => {
      const vatRate = VAT_RATES[sale.customer_country] || 0;
      const grossRevenue = parseInt(sale.gross_revenue);
      const netRevenue = parseInt(sale.net_revenue);
      
      // VAT is typically calculated on the gross amount
      const vatAmount = Math.round(grossRevenue * vatRate);
      const netAfterVat = grossRevenue - vatAmount;

      return {
        country: sale.customer_country,
        country_name: getCountryName(sale.customer_country),
        vat_rate: vatRate,
        transaction_count: parseInt(sale.transaction_count),
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        vat_amount: vatAmount,
        net_after_vat: netAfterVat,
        vat_applicable: vatRate > 0,
      };
    });

    // Calculate totals
    const totals = vatCalculations.reduce((acc, calc) => ({
      total_transactions: acc.total_transactions + calc.transaction_count,
      total_gross_revenue: acc.total_gross_revenue + calc.gross_revenue,
      total_net_revenue: acc.total_net_revenue + calc.net_revenue,
      total_vat_amount: acc.total_vat_amount + calc.vat_amount,
      total_net_after_vat: acc.total_net_after_vat + calc.net_after_vat,
    }), {
      total_transactions: 0,
      total_gross_revenue: 0,
      total_net_revenue: 0,
      total_vat_amount: 0,
      total_net_after_vat: 0,
    });

    // Get monthly breakdown for the period
    const monthlyBreakdownQuery = `
      SELECT 
        EXTRACT(MONTH FROM p.purchased_at) as month,
        TO_CHAR(p.purchased_at, 'Month') as month_name,
        COALESCE(u.country, 'Unknown') as customer_country,
        COUNT(*) as transactions,
        COALESCE(SUM(p.amount), 0) as gross_revenue
      FROM purchases p
      JOIN users u ON p.user_id = u.id
      WHERE p.developer_id = $1 
      AND p.status = 'completed'
      ${dateFilter}
      ${countryFilter}
      GROUP BY EXTRACT(MONTH FROM p.purchased_at), TO_CHAR(p.purchased_at, 'Month'), u.country
      ORDER BY month, customer_country
    `;

    const monthlyBreakdownResult = await neonClient.query(monthlyBreakdownQuery, [session.user.id]);

    const vatReport = {
      report_info: {
        year,
        quarter: quarter || 'Full Year',
        country_filter: country || 'All Countries',
        generated_at: new Date().toISOString(),
        developer_info: verification,
        report_type: 'VAT Calculation Report',
      },
      vat_calculations: vatCalculations,
      totals,
      monthly_breakdown: monthlyBreakdownResult.rows,
      vat_notes: {
        disclaimer: 'This is a simplified VAT calculation. Consult a tax professional for accurate VAT obligations.',
        rates_note: 'VAT rates are approximate and may not reflect current rates or exemptions.',
        threshold_note: 'Many countries have VAT registration thresholds. Check local requirements.',
        b2b_note: 'B2B sales may be subject to reverse charge mechanism in EU.',
        digital_services_note: 'Digital services may be subject to destination-based VAT rules.',
      },
      recommendations: generateVatRecommendations(verification.tax_country, totals.total_gross_revenue),
    };

    return NextResponse.json(vatReport);
  } catch (error) {
    console.error('Error generating VAT report:', error);
    return NextResponse.json(
      { error: 'Failed to generate VAT report' },
      { status: 500 }
    );
  }
}

function getCountryName(countryCode: string): string {
  const countryNames: { [key: string]: string } = {
    'AT': 'Austria', 'BE': 'Belgium', 'BG': 'Bulgaria', 'HR': 'Croatia',
    'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia',
    'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
    'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LV': 'Latvia',
    'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta', 'NL': 'Netherlands',
    'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SK': 'Slovakia',
    'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden', 'GB': 'United Kingdom',
    'NO': 'Norway', 'CH': 'Switzerland', 'US': 'United States',
  };
  return countryNames[countryCode] || countryCode;
}

function generateVatRecommendations(developerCountry: string, totalRevenue: number): string[] {
  const recommendations = [];

  // EU VAT recommendations
  if (['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(developerCountry)) {
    recommendations.push('Consider EU VAT registration if you exceed €10,000 in annual EU sales');
    recommendations.push('Digital services are subject to destination-based VAT in the EU');
    recommendations.push('Consider using EU One Stop Shop (OSS) for simplified VAT reporting');
  }

  // UK VAT recommendations
  if (developerCountry === 'GB') {
    recommendations.push('UK VAT registration threshold is £85,000 annually');
    recommendations.push('Consider VAT registration for credibility even below threshold');
  }

  // US recommendations
  if (developerCountry === 'US') {
    recommendations.push('US does not have federal VAT, but consider state sales tax obligations');
    recommendations.push('Economic nexus rules may apply in various states');
  }

  // General recommendations
  if (totalRevenue > 5000000) { // $50,000
    recommendations.push('Consider consulting a tax professional for VAT planning');
    recommendations.push('Implement automated VAT calculation in your pricing');
  }

  return recommendations;
}
