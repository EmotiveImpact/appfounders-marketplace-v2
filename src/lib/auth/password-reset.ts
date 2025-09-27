import crypto from 'crypto';
import { db } from '@/lib/database/neon-client';
import { hashPassword } from './neon-auth';

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// Generate secure password reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create password reset token
export async function createPasswordResetToken(email: string): Promise<{ token: string; user: any } | null> {
  // Check if user exists
  const user = await db.getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not for security
    return null;
  }

  // Generate token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Store token in database
  await (db as any).query(`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES ($1, $2, $3)
  `, [user.id, token, expiresAt.toISOString()]);

  return { token, user };
}

// Verify password reset token
export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; user_id?: string }> {
  const result = await (db as any).query(`
    SELECT user_id, expires_at, used
    FROM password_reset_tokens
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

// Reset password using token
export async function resetPasswordWithToken(
  token: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Verify token
  const tokenVerification = await verifyPasswordResetToken(token);
  if (!tokenVerification.valid || !tokenVerification.user_id) {
    return { success: false, error: 'Invalid or expired reset token' };
  }

  // Validate new password
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long' };
  }

  try {
    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await (db as any).query(`
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [passwordHash, tokenVerification.user_id]);

    // Mark token as used
    await (db as any).query(`
      UPDATE password_reset_tokens
      SET used = true, updated_at = NOW()
      WHERE token = $1
    `, [token]);

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

// Clean up expired tokens (should be run periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();
  await (db as any).query(`
    DELETE FROM password_reset_tokens
    WHERE expires_at < $1 OR used = true
  `, [now.toISOString()]);
}

// Send password reset email (placeholder for email service integration)
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  console.log(`Password reset email would be sent to: ${email}`);
  console.log(`Reset URL: ${resetUrl}`);
  
  // Example email content:
  const emailContent = {
    to: email,
    subject: 'Reset Your AppFounders Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your AppFounders account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
    `
  };
  
  // When email service is integrated, send the email here
  // await emailService.send(emailContent);
}
