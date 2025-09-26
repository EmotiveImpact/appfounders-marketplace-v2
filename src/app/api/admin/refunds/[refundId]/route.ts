import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { updateRefundStatus, cancelRefund } from '@/lib/stripe/refunds';

// GET /api/admin/refunds/[refundId] - Update refund status from Stripe
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { refundId: string } }) => {
    try {
      const { refundId } = params;

      if (!refundId) {
        return NextResponse.json(
          { error: 'Refund ID is required' },
          { status: 400 }
        );
      }

      const refundRequest = await updateRefundStatus(refundId);

      if (!refundRequest) {
        return NextResponse.json(
          { error: 'Refund not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        refundRequest,
      });
    } catch (error: any) {
      console.error('Error updating refund status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update refund status' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);

// DELETE /api/admin/refunds/[refundId] - Cancel a pending refund
export const DELETE = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { refundId: string } }) => {
    try {
      const { refundId } = params;

      if (!refundId) {
        return NextResponse.json(
          { error: 'Refund ID is required' },
          { status: 400 }
        );
      }

      const refundRequest = await cancelRefund(refundId, user.id);

      return NextResponse.json({
        success: true,
        refundRequest,
        message: 'Refund canceled successfully',
      });
    } catch (error: any) {
      console.error('Error canceling refund:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to cancel refund' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
  }
);
