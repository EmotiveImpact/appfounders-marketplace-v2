import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { sendPasswordResetEmail } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create password reset token
    const result = await createPasswordResetToken(email.toLowerCase());

    if (result) {
      // Send password reset email
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${result.token}`;
      await sendPasswordResetEmail(email, result.userName, resetUrl, '1 hour');
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
