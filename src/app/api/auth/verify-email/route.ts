import { NextRequest, NextResponse } from 'next/server';
import { verifyUserEmail, verifyEmailVerificationToken } from '@/lib/auth/email-verification';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate token
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify email
    const result = await verifyUserEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to verify email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Email has been verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify token validity
    const verification = await verifyEmailVerificationToken(token);

    return NextResponse.json({
      valid: verification.valid
    });

  } catch (error) {
    console.error('Verify email token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
