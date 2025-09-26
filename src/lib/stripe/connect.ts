import Stripe from 'stripe';
import { stripe } from './config';
import { neonClient } from '@/lib/database/neon-client';

// Commission rates
export const COMMISSION_RATES = {
  PLATFORM_FEE: 0.20, // 20% platform fee
  DEVELOPER_SHARE: 0.80, // 80% to developer
  STRIPE_FEE: 0.029, // 2.9% + 30¢ Stripe fee (approximate)
};

export interface ConnectedAccount {
  id: string;
  user_id: string;
  stripe_account_id: string;
  account_type: 'express' | 'standard' | 'custom';
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

/**
 * Create a Stripe Connect Express account for a developer
 */
export async function createConnectAccount(
  userId: string,
  email: string,
  country: string = 'US'
): Promise<{ accountId: string; onboardingUrl: string }> {
  try {
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        user_id: userId,
        platform: 'appfounders',
      },
    });

    // Store account in database
    await neonClient.sql`
      INSERT INTO connected_accounts (
        user_id,
        stripe_account_id,
        account_type,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        verification_status
      )
      VALUES (
        ${userId},
        ${account.id},
        'express',
        ${account.charges_enabled},
        ${account.payouts_enabled},
        ${account.details_submitted},
        'pending'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_account_id = ${account.id},
        updated_at = NOW()
    `;

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/developer/connect/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/developer/connect/success`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    throw new Error('Failed to create Connect account');
  }
}

/**
 * Get connected account information
 */
export async function getConnectedAccount(userId: string): Promise<ConnectedAccount | null> {
  const result = await neonClient.sql`
    SELECT * FROM connected_accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return result.length > 0 ? (result[0] as ConnectedAccount) : null;
}

/**
 * Update connected account status from Stripe
 */
export async function updateConnectedAccountStatus(accountId: string): Promise<void> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    await neonClient.sql`
      UPDATE connected_accounts
      SET
        charges_enabled = ${account.charges_enabled},
        payouts_enabled = ${account.payouts_enabled},
        details_submitted = ${account.details_submitted},
        verification_status = ${account.charges_enabled && account.payouts_enabled ? 'verified' : 'pending'},
        updated_at = NOW()
      WHERE stripe_account_id = ${accountId}
    `;
  } catch (error) {
    console.error('Error updating account status:', error);
    throw new Error('Failed to update account status');
  }
}

/**
 * Calculate commission split for a purchase
 */
export function calculateCommissionSplit(totalAmount: number): {
  platformFee: number;
  developerAmount: number;
  stripeFee: number;
  netAmount: number;
} {
  // Calculate Stripe fee (2.9% + 30¢)
  const stripeFee = Math.round(totalAmount * COMMISSION_RATES.STRIPE_FEE + 30);
  
  // Net amount after Stripe fee
  const netAmount = totalAmount - stripeFee;
  
  // Platform fee (20% of net amount)
  const platformFee = Math.round(netAmount * COMMISSION_RATES.PLATFORM_FEE);
  
  // Developer amount (80% of net amount)
  const developerAmount = netAmount - platformFee;

  return {
    platformFee,
    developerAmount,
    stripeFee,
    netAmount,
  };
}

/**
 * Create payment with automatic commission splitting
 */
export async function createSplitPayment(
  amount: number,
  currency: string,
  developerAccountId: string,
  appId: string,
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const { platformFee, developerAmount } = calculateCommissionSplit(amount);

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: developerAccountId,
      },
      metadata: {
        app_id: appId,
        developer_amount: developerAmount.toString(),
        platform_fee: platformFee.toString(),
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating split payment:', error);
    throw new Error('Failed to create split payment');
  }
}

/**
 * Process manual payout to developer
 */
export async function processManualPayout(
  developerAccountId: string,
  amount: number,
  currency: string = 'usd',
  description?: string
): Promise<Stripe.Transfer> {
  try {
    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: developerAccountId,
      description: description || 'Developer payout',
      metadata: {
        type: 'manual_payout',
        processed_at: new Date().toISOString(),
      },
    });

    return transfer;
  } catch (error) {
    console.error('Error processing manual payout:', error);
    throw new Error('Failed to process payout');
  }
}

/**
 * Get developer earnings summary
 */
export async function getDeveloperEarnings(userId: string): Promise<{
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  salesCount: number;
}> {
  try {
    // Get connected account
    const connectedAccount = await getConnectedAccount(userId);
    if (!connectedAccount) {
      return {
        totalEarnings: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        salesCount: 0,
      };
    }

    // Get earnings from purchases
    const earningsResult = await neonClient.sql`
      SELECT 
        COUNT(*) as sales_count,
        SUM(amount_cents) as total_amount
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE a.developer_id = ${userId}
      AND p.status = 'completed'
    `;

    const totalAmount = parseInt(earningsResult[0]?.total_amount || '0');
    const salesCount = parseInt(earningsResult[0]?.sales_count || '0');
    
    // Calculate developer share
    const { developerAmount } = calculateCommissionSplit(totalAmount);

    // Get Stripe balance for pending/available amounts
    let pendingPayouts = 0;
    let completedPayouts = 0;

    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: connectedAccount.stripe_account_id,
      });

      pendingPayouts = balance.pending.reduce((sum, item) => sum + item.amount, 0);
      // Available balance represents completed but not yet paid out
      const availableBalance = balance.available.reduce((sum, item) => sum + item.amount, 0);
      completedPayouts = developerAmount - pendingPayouts - availableBalance;
    } catch (stripeError) {
      console.warn('Could not fetch Stripe balance:', stripeError);
    }

    return {
      totalEarnings: developerAmount,
      pendingPayouts,
      completedPayouts: Math.max(0, completedPayouts),
      salesCount,
    };
  } catch (error) {
    console.error('Error getting developer earnings:', error);
    throw new Error('Failed to get developer earnings');
  }
}

/**
 * Get platform revenue summary
 */
export async function getPlatformRevenue(): Promise<{
  totalRevenue: number;
  platformFees: number;
  developerPayouts: number;
  stripeFees: number;
}> {
  try {
    const result = await neonClient.sql`
      SELECT 
        SUM(amount_cents) as total_revenue,
        COUNT(*) as transaction_count
      FROM purchases
      WHERE status = 'completed'
    `;

    const totalRevenue = parseInt(result[0]?.total_revenue || '0');
    const { platformFee, developerAmount, stripeFee } = calculateCommissionSplit(totalRevenue);

    return {
      totalRevenue,
      platformFees: platformFee,
      developerPayouts: developerAmount,
      stripeFees: stripeFee,
    };
  } catch (error) {
    console.error('Error getting platform revenue:', error);
    throw new Error('Failed to get platform revenue');
  }
}

/**
 * Create account link for re-authentication
 */
export async function createAccountLink(
  accountId: string,
  type: 'account_onboarding' | 'account_update' = 'account_update'
): Promise<string> {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/developer/connect/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/developer/connect/success`,
      type,
    });

    return accountLink.url;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new Error('Failed to create account link');
  }
}
