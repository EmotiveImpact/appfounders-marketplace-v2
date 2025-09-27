import nodemailer from 'nodemailer';

// Email service configuration
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid configuration
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (process.env.SMTP_HOST) {
    // SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development mode - log emails to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@appfounders.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await (transporter as any).sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent (development mode):', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #333;">Verify Your Email</h1>
      <p>Thank you for signing up for AppFounders! Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Verify Email
      </a>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <hr style="margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        If you didn't create an account with AppFounders, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your AppFounders account',
    html,
    text: `Please verify your email by visiting: ${verificationUrl}`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #333;">Reset Your Password</h1>
      <p>You requested to reset your password for your AppFounders account. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Reset Password
      </a>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your AppFounders password',
    html,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
};

export const sendAccessRevokedEmail = async (email: string, reason: string): Promise<boolean> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #d32f2f;">Access Revoked</h1>
      <p>Your access to certain AppFounders features has been revoked.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this was done in error, please contact our support team.</p>
      <hr style="margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        AppFounders Support Team
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'AppFounders - Access Revoked',
    html,
    text: `Your access has been revoked. Reason: ${reason}`,
  });
};

export const sendAccessRestoredEmail = async (email: string): Promise<boolean> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h1 style="color: #2e7d32;">Access Restored</h1>
      <p>Your access to AppFounders has been restored. You can now use all features normally.</p>
      <p>Thank you for your patience.</p>
      <hr style="margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        AppFounders Support Team
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'AppFounders - Access Restored',
    html,
    text: 'Your access to AppFounders has been restored.',
  });
};
