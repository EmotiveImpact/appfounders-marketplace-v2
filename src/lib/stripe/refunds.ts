import Stripe from 'stripe';
import { stripe } from './config';
import { neonClient } from '@/lib/database/neon-client';

export interface RefundRequest {
  id?: string;
  purchase_id: string;
  payment_intent_id: string;
  amount_cents: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  description?: string;
  admin_id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  stripe_refund_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisputeCase {
  id?: string;
  purchase_id: string;
  payment_intent_id: string;
  stripe_dispute_id: string;
  amount_cents: number;
  reason: string;
  status: string;
  evidence_due_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason: RefundRequest['reason'] = 'requested_by_customer',
  description?: string,
  adminId?: string
): Promise<{ refund: Stripe.Refund; refundRequest: RefundRequest }> {
  try {
    // Get payment intent details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!(paymentIntent as any).charges?.data?.length) {
      throw new Error('No charges found for this payment intent');
    }

    const charge = (paymentIntent as any).charges?.data?.[0];
    const refundAmount = amount || paymentIntent.amount;

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      charge: charge?.id,
      amount: refundAmount,
      reason: reason as any,
      metadata: {
        admin_id: adminId || '',
        description: description || '',
        original_payment_intent: paymentIntentId,
      },
    } as any);

    // Get purchase record
    const purchaseResult = await neonClient.sql`
      SELECT id FROM purchases
      WHERE stripe_payment_intent_id = ${paymentIntentId}
      LIMIT 1
    `;

    if (purchaseResult.length === 0) {
      throw new Error('Purchase record not found');
    }

    const purchaseId = purchaseResult[0].id;

    // Create refund request record
    const refundRequestResult = await neonClient.sql`
      INSERT INTO refund_requests (
        purchase_id,
        payment_intent_id,
        amount_cents,
        reason,
        description,
        admin_id,
        status,
        stripe_refund_id
      )
      VALUES (
        ${purchaseId},
        ${paymentIntentId},
        ${refundAmount},
        ${reason},
        ${description || ''},
        ${adminId || ''},
        'pending',
        ${refund.id}
      )
      RETURNING *
    `;

    const refundRequest = refundRequestResult[0] as RefundRequest;

    return { refund, refundRequest };
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
}

/**
 * Get refund status from Stripe and update database
 */
export async function updateRefundStatus(refundId: string): Promise<RefundRequest | null> {
  try {
    // Get refund from Stripe
    const refund = await stripe.refunds.retrieve(refundId);
    
    // Update database record
    const result = await neonClient.sql`
      UPDATE refund_requests
      SET 
        status = ${refund.status},
        updated_at = NOW()
      WHERE stripe_refund_id = ${refundId}
      RETURNING *
    `;

    return result.length > 0 ? (result[0] as RefundRequest) : null;
  } catch (error) {
    console.error('Error updating refund status:', error);
    throw new Error('Failed to update refund status');
  }
}

/**
 * Get all refund requests with pagination
 */
export async function getRefundRequests(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{ refunds: RefundRequest[]; total: number; pages: number }> {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    // Get total count
    const countResult = await neonClient.sql`
      SELECT COUNT(*) as total
      FROM refund_requests
      ${whereClause}
    `;
    const total = parseInt(countResult[0].total);

    // Get refunds with purchase and user details
    const refundsResult = await neonClient.sql`
      SELECT 
        rr.*,
        p.app_id,
        p.user_id,
        u.name as user_name,
        u.email as user_email,
        a.name as app_name
      FROM refund_requests rr
      JOIN purchases p ON rr.purchase_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN apps a ON p.app_id = a.id
      ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const pages = Math.ceil(total / limit);

    return {
      refunds: refundsResult as any[],
      total,
      pages,
    };
  } catch (error) {
    console.error('Error getting refund requests:', error);
    throw new Error('Failed to get refund requests');
  }
}

/**
 * Cancel a pending refund
 */
export async function cancelRefund(refundId: string, adminId: string): Promise<RefundRequest> {
  try {
    // Cancel refund in Stripe (only works for pending refunds)
    await stripe.refunds.cancel(refundId);

    // Update database record
    const result = await neonClient.sql`
      UPDATE refund_requests
      SET 
        status = 'canceled',
        updated_at = NOW()
      WHERE stripe_refund_id = ${refundId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Refund request not found');
    }

    return result[0] as RefundRequest;
  } catch (error) {
    console.error('Error canceling refund:', error);
    throw new Error('Failed to cancel refund');
  }
}

/**
 * Handle dispute webhook events
 */
export async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<DisputeCase> {
  try {
    const chargeId = dispute.charge as string;
    
    // Get charge details to find payment intent
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent as string;

    // Get purchase record
    const purchaseResult = await neonClient.sql`
      SELECT id FROM purchases
      WHERE stripe_payment_intent_id = ${paymentIntentId}
      LIMIT 1
    `;

    if (purchaseResult.length === 0) {
      throw new Error('Purchase record not found for dispute');
    }

    const purchaseId = purchaseResult[0].id;

    // Create dispute case record
    const disputeResult = await neonClient.sql`
      INSERT INTO dispute_cases (
        purchase_id,
        payment_intent_id,
        stripe_dispute_id,
        amount_cents,
        reason,
        status,
        evidence_due_by
      )
      VALUES (
        ${purchaseId},
        ${paymentIntentId},
        ${dispute.id},
        ${dispute.amount},
        ${dispute.reason},
        ${dispute.status},
        ${dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toISOString() : null}
      )
      RETURNING *
    `;

    return disputeResult[0] as DisputeCase;
  } catch (error) {
    console.error('Error handling dispute created:', error);
    throw new Error('Failed to handle dispute creation');
  }
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(disputeId: string): Promise<DisputeCase | null> {
  try {
    // Get dispute from Stripe
    const dispute = await stripe.disputes.retrieve(disputeId);
    
    // Update database record
    const result = await neonClient.sql`
      UPDATE dispute_cases
      SET 
        status = ${dispute.status},
        updated_at = NOW()
      WHERE stripe_dispute_id = ${disputeId}
      RETURNING *
    `;

    return result.length > 0 ? (result[0] as DisputeCase) : null;
  } catch (error) {
    console.error('Error updating dispute status:', error);
    throw new Error('Failed to update dispute status');
  }
}

/**
 * Get all dispute cases
 */
export async function getDisputeCases(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{ disputes: DisputeCase[]; total: number; pages: number }> {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    if (status) {
      whereClause = `WHERE status = '${status}'`;
    }

    // Get total count
    const countResult = await neonClient.sql`
      SELECT COUNT(*) as total
      FROM dispute_cases
      ${whereClause}
    `;
    const total = parseInt(countResult[0].total);

    // Get disputes with purchase and user details
    const disputesResult = await neonClient.sql`
      SELECT 
        dc.*,
        p.app_id,
        p.user_id,
        u.name as user_name,
        u.email as user_email,
        a.name as app_name
      FROM dispute_cases dc
      JOIN purchases p ON dc.purchase_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN apps a ON p.app_id = a.id
      ${whereClause}
      ORDER BY dc.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const pages = Math.ceil(total / limit);

    return {
      disputes: disputesResult as any[],
      total,
      pages,
    };
  } catch (error) {
    console.error('Error getting dispute cases:', error);
    throw new Error('Failed to get dispute cases');
  }
}

/**
 * Submit evidence for a dispute
 */
export async function submitDisputeEvidence(
  disputeId: string,
  evidence: Stripe.DisputeUpdateParams.Evidence
): Promise<Stripe.Dispute> {
  try {
    // Submit evidence to Stripe
    const dispute = await stripe.disputes.update(disputeId, {
      evidence,
      submit: true,
    });

    // Update database record
    await neonClient.sql`
      UPDATE dispute_cases
      SET 
        status = ${dispute.status},
        updated_at = NOW()
      WHERE stripe_dispute_id = ${disputeId}
    `;

    return dispute;
  } catch (error) {
    console.error('Error submitting dispute evidence:', error);
    throw new Error('Failed to submit dispute evidence');
  }
}
