import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { getDisputeCases, submitDisputeEvidence } from '@/lib/stripe/refunds';

// GET /api/admin/disputes - Get all dispute cases
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || undefined;

      const result = await getDisputeCases(page, limit, status);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching dispute cases:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch dispute cases' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);

// POST /api/admin/disputes - Submit evidence for a dispute
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { disputeId, evidence } = body;

      // Validate required fields
      if (!disputeId) {
        return NextResponse.json(
          { error: 'Dispute ID is required' },
          { status: 400 }
        );
      }

      if (!evidence) {
        return NextResponse.json(
          { error: 'Evidence is required' },
          { status: 400 }
        );
      }

      // Submit evidence
      const dispute = await submitDisputeEvidence(disputeId, evidence);

      return NextResponse.json({
        success: true,
        dispute: {
          id: dispute.id,
          status: dispute.status,
          amount: dispute.amount,
          reason: dispute.reason,
        },
        message: 'Evidence submitted successfully',
      });
    } catch (error: any) {
      console.error('Error submitting dispute evidence:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to submit dispute evidence' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
