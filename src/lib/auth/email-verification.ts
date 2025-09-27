import crypto from 'crypto';
import { db } from '@/lib/database/neon-client';

export interface EmailVerificationToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// Generate secure email verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create email verification token
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Store token in database
  await (db as any).query(`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
  `, [userId, token, expiresAt.toISOString()]);

  return token;
}

// Verify email verification token
export async function verifyEmailVerificationToken(token: string): Promise<{ valid: boolean; user_id?: string }> {
  const result = await (db as any).query(`
    SELECT user_id, expires_at, used
    FROM email_verification_tokens
    WHERE token = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [token]);

  if (result.length === 0) {
    return { valid: false };
  }

  const tokenData = result[0];
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);

  // Check if token is expired or already used
  if (now > expiresAt || tokenData.used) {
    return { valid: false };
  }

  return { valid: true, user_id: tokenData.user_id };
}

// Verify user email using token
export async function verifyUserEmail(token: string): Promise<{ success: boolean; error?: string }> {
  // Verify token
  const tokenVerification = await verifyEmailVerificationToken(token);
  if (!tokenVerification.valid || !tokenVerification.user_id) {
    return { success: false, error: 'Invalid or expired verification token' };
  }

  try {
    // Update user email_verified status
    await (db as any).query(`
      UPDATE users
      SET email_verified = true, updated_at = NOW()
      WHERE id = $1
    `, [tokenVerification.user_id]);

    // Mark token as used
    await (db as any).query(`
      UPDATE email_verification_tokens
      SET used = true, updated_at = NOW()
      WHERE token = $1
    `, [token]);

    return { success: true };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}

// Resend verification email
export async function resendVerificationEmail(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Check if user exists and is not already verified
    const userResult = await (db as any).query(`
      SELECT id, email, email_verified
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const user = userResult[0];
    if (user.email_verified) {
      return { success: false, error: 'Email is already verified' };
    }

    // Create new verification token
    const token = await createEmailVerificationToken(userId);

    // Send verification email
    await sendVerificationEmail(user.email, token);

    return { success: true, token };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { success: false, error: 'Failed to resend verification email' };
  }
}

// Clean up expired tokens (should be run periodically)
export async function cleanupExpiredVerificationTokens(): Promise<void> {
  const now = new Date();
  await (db as any).query(`
    DELETE FROM email_verification_tokens
    WHERE expires_at < $1 OR used = true
  `, [now.toISOString()]);
}

// Send verification email (placeholder for email service integration)
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  console.log(`Verification email would be sent to: ${email}`);
  console.log(`Verification URL: ${verificationUrl}`);
  
  // Example email content:
  const emailContent = {
    to: email,
    subject: 'Verify Your AppFounders Email',
    html: `
      <h2>Welcome to AppFounders!</h2>
      <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account with us, please ignore this email.</p>
    `
  };
  
  // When email service is integrated, send the email here
  // await emailService.send(emailContent);
}

// Check if user email is verified
export async function isEmailVerified(userId: string): Promise<boolean> {
  const result = await (db as any).query(`
    SELECT email_verified
    FROM users
    WHERE id = $1
  `, [userId]);

  return result.length > 0 ? result[0].email_verified : false;
}
