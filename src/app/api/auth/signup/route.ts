import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth/auth-options';
import { createEmailVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email/service';
import { createDefaultPreferences } from '@/lib/notifications/preferences';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['developer', 'tester', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Create user in Neon database
    const user = await createUser({
      email,
      password,
      name,
      role: role as 'developer' | 'tester' | 'admin',
    });

    // Create default notification preferences
    try {
      await createDefaultPreferences(user.id);
    } catch (preferencesError) {
      console.error('Failed to create default notification preferences:', preferencesError);
      // Don't fail the signup if preferences creation fails
    }

    // Create and send email verification token
    try {
      const verificationToken = await createEmailVerificationToken(user.id);
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`;

      await sendVerificationEmail(
        user.email,
        user.name,
        verificationUrl,
        '24 hours'
      );

      // Also send welcome email
      const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;
      await sendWelcomeEmail(user.email, user.name, dashboardUrl);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup if email sending fails
    }

    // Return success response
    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: false,
      },
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
