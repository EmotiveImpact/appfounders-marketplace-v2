import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  createRefund, 
  getRefundRequests, 
  updateRefundStatus,
  cancelRefund 
} from '@/lib/stripe/refunds';

// GET /api/admin/refunds - Get all refund requests
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || undefined;

      const result = await getRefundRequests(page, limit, status);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching refund requests:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch refund requests' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);

// POST /api/admin/refunds - Create a new refund
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { paymentIntentId, amount, reason, description } = body;

      // Validate required fields
      if (!paymentIntentId) {
        return NextResponse.json(
          { error: 'Payment intent ID is required' },
          { status: 400 }
        );
      }

      if (!reason) {
        return NextResponse.json(
          { error: 'Refund reason is required' },
          { status: 400 }
        );
      }

      // Validate reason
      const validReasons = ['duplicate', 'fraudulent', 'requested_by_customer', 'other'];
      if (!validReasons.includes(reason)) {
        return NextResponse.json(
          { error: 'Invalid refund reason' },
          { status: 400 }
        );
      }

      // Create refund
      const { refund, refundRequest } = await createRefund(
        paymentIntentId,
        amount,
        reason,
        description,
        user.id
      );

      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason,
        },
        refundRequest,
        message: 'Refund created successfully',
      });
    } catch (error: any) {
      console.error('Error creating refund:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create refund' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
