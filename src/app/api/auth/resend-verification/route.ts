import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { resendVerificationEmail } from '@/lib/auth/email-verification';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Resend verification email
    const result = await resendVerificationEmail(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to resend verification email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Verification email has been sent'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
