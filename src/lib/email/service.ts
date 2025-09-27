import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { emailConfig, getSenderInfo, EmailTemplateData } from './config';
import { renderEmailTemplate } from './templates';

// Initialize SendGrid
if (emailConfig.sendgrid.apiKey) {
  sgMail.setApiKey(emailConfig.sendgrid.apiKey);
}

// Create SMTP transporter
let smtpTransporter: nodemailer.Transporter | null = null;
if (emailConfig.provider === 'smtp' && emailConfig.smtp.host) {
  smtpTransporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.user,
      pass: emailConfig.smtp.password,
    },
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Log email in development
    if (emailConfig.development.logEmails) {
      console.log('📧 Sending email:', {
        to: options.to,
        subject: options.subject,
        provider: emailConfig.provider,
      });
    }

    // Test mode - don't actually send emails
    if (emailConfig.development.testMode) {
      console.log('📧 Test mode - email not sent');
      return true;
    }

    const sender = getSenderInfo();

    switch (emailConfig.provider) {
      case 'sendgrid':
        return await sendWithSendGrid(options, sender);
      case 'mailgun':
        return await sendWithMailgun(options, sender);
      case 'smtp':
        return await sendWithSMTP(options, sender);
      default:
        throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(
  options: EmailOptions,
  sender: { email: string; name: string }
): Promise<boolean> {
  try {
    const msg = {
      to: Array.isArray(options.to) ? options.to : [options.to],
      from: {
        email: sender.email,
        name: sender.name,
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        type: att.contentType || 'application/octet-stream',
        disposition: 'attachment',
      })),
      trackingSettings: {
        clickTracking: {
          enable: emailConfig.settings.trackClicks,
        },
        openTracking: {
          enable: emailConfig.settings.trackOpens,
        },
      },
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

/**
 * Send email using Mailgun
 */
async function sendWithMailgun(
  options: EmailOptions,
  sender: { email: string; name: string }
): Promise<boolean> {
  try {
    // Note: This is a placeholder for Mailgun implementation
    // You would need to install and configure the Mailgun SDK
    console.warn('Mailgun implementation not yet available');
    return false;
  } catch (error) {
    console.error('Mailgun error:', error);
    return false;
  }
}

/**
 * Send email using SMTP
 */
async function sendWithSMTP(
  options: EmailOptions,
  sender: { email: string; name: string }
): Promise<boolean> {
  try {
    if (!smtpTransporter) {
      throw new Error('SMTP transporter not configured');
    }

    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    await smtpTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('SMTP error:', error);
    return false;
  }
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail<T extends keyof EmailTemplateData>(
  template: T,
  to: string | string[],
  data: EmailTemplateData[T],
  options?: Partial<EmailOptions>
): Promise<boolean> {
  try {
    const templateConfig = emailConfig.templates[template];
    const { html, text } = await renderEmailTemplate(template, data);

    return await sendEmail({
      to,
      subject: templateConfig.subject,
      html,
      text,
      ...options,
    });
  } catch (error) {
    console.error(`Failed to send ${template} email:`, error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  dashboardUrl: string
): Promise<boolean> {
  return await sendTemplatedEmail('welcome', userEmail, {
    userName,
    userEmail,
    dashboardUrl,
  });
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  userEmail: string,
  userName: string,
  verificationUrl: string,
  expiresIn: string = '24 hours'
): Promise<boolean> {
  return await sendTemplatedEmail('emailVerification', userEmail, {
    userName,
    verificationUrl,
    expiresIn,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string,
  expiresIn: string = '1 hour'
): Promise<boolean> {
  return await sendTemplatedEmail('passwordReset', userEmail, {
    userName,
    resetUrl,
    expiresIn,
  });
}

/**
 * Send app approval notification
 */
export async function sendAppApprovedEmail(
  userEmail: string,
  userName: string,
  appName: string,
  appUrl: string,
  dashboardUrl: string
): Promise<boolean> {
  return await sendTemplatedEmail('appApproved', userEmail, {
    userName,
    appName,
    appUrl,
    dashboardUrl,
  });
}

/**
 * Send purchase confirmation
 */
export async function sendPurchaseConfirmationEmail(
  userEmail: string,
  userName: string,
  appName: string,
  amount: string,
  downloadUrl: string,
  receiptUrl: string
): Promise<boolean> {
  return await sendTemplatedEmail('purchaseConfirmation', userEmail, {
    userName,
    appName,
    amount,
    downloadUrl,
    receiptUrl,
  });
}

/**
 * Retry email sending with exponential backoff
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries: number = emailConfig.settings.retryAttempts
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await sendEmail(options);
      if (success) return true;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Email attempt ${attempt} failed:`, error);
    }

    if (attempt < maxRetries) {
      const delay = emailConfig.settings.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('All email retry attempts failed:', lastError);
  return false;
}
