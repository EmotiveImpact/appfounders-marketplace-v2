import { EmailTemplateData } from './config';

/**
 * Base email template with consistent styling
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AppFounders</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .highlight {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .success {
            color: #059669;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
        }
        .warning {
            color: #d97706;
            background: #fffbeb;
            border: 1px solid #fde68a;
        }
        .error {
            color: #dc2626;
            background: #fef2f2;
            border: 1px solid #fecaca;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AppFounders</div>
            <p>Beta Tester Marketplace</p>
        </div>
        ${content}
        <div class="footer">
            <p>© 2024 AppFounders. All rights reserved.</p>
            <p>You're receiving this email because you have an account with AppFounders.</p>
            <p>If you have any questions, reply to this email or contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Welcome email template
 */
function renderWelcomeTemplate(data: EmailTemplateData['welcome']): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>Welcome to AppFounders, ${data.userName}! 🎉</h1>
    <p>We're excited to have you join our beta tester marketplace community!</p>
    
    <div class="highlight success">
        <h3>What's next?</h3>
        <ul>
            <li>Complete your profile to get started</li>
            <li>Browse available apps for testing</li>
            <li>Start earning rewards for your feedback</li>
        </ul>
    </div>
    
    <p>Ready to dive in?</p>
    <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
    
    <p>As a beta tester, you'll have early access to innovative apps and the opportunity to shape their development with your valuable feedback.</p>
    
    <p>Happy testing!</p>
    <p>The AppFounders Team</p>
  `);

  const text = `
Welcome to AppFounders, ${data.userName}!

We're excited to have you join our beta tester marketplace community!

What's next?
- Complete your profile to get started
- Browse available apps for testing
- Start earning rewards for your feedback

Ready to dive in? Visit your dashboard: ${data.dashboardUrl}

As a beta tester, you'll have early access to innovative apps and the opportunity to shape their development with your valuable feedback.

Happy testing!
The AppFounders Team
  `;

  return { html, text };
}

/**
 * Email verification template
 */
function renderEmailVerificationTemplate(data: EmailTemplateData['emailVerification']): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>Verify Your Email Address</h1>
    <p>Hi ${data.userName},</p>
    
    <p>Thanks for signing up for AppFounders! To complete your registration, please verify your email address by clicking the button below:</p>
    
    <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
    
    <div class="highlight warning">
        <p><strong>Important:</strong> This verification link will expire in ${data.expiresIn}.</p>
    </div>
    
    <p>If you didn't create an account with AppFounders, you can safely ignore this email.</p>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280;">${data.verificationUrl}</p>
  `);

  const text = `
Verify Your Email Address

Hi ${data.userName},

Thanks for signing up for AppFounders! To complete your registration, please verify your email address by visiting this link:

${data.verificationUrl}

Important: This verification link will expire in ${data.expiresIn}.

If you didn't create an account with AppFounders, you can safely ignore this email.
  `;

  return { html, text };
}

/**
 * Password reset template
 */
function renderPasswordResetTemplate(data: EmailTemplateData['passwordReset']): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>Reset Your Password</h1>
    <p>Hi ${data.userName},</p>
    
    <p>We received a request to reset your password for your AppFounders account. Click the button below to create a new password:</p>
    
    <a href="${data.resetUrl}" class="button">Reset Password</a>
    
    <div class="highlight warning">
        <p><strong>Security Notice:</strong> This reset link will expire in ${data.expiresIn}.</p>
    </div>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6b7280;">${data.resetUrl}</p>
  `);

  const text = `
Reset Your Password

Hi ${data.userName},

We received a request to reset your password for your AppFounders account. Visit this link to create a new password:

${data.resetUrl}

Security Notice: This reset link will expire in ${data.expiresIn}.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
  `;

  return { html, text };
}

/**
 * App approved template
 */
function renderAppApprovedTemplate(data: EmailTemplateData['appApproved']): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>🎉 Your App Has Been Approved!</h1>
    <p>Hi ${data.userName},</p>
    
    <p>Great news! Your app "<strong>${data.appName}</strong>" has been approved and is now live on the AppFounders marketplace!</p>
    
    <div class="highlight success">
        <h3>What happens next?</h3>
        <ul>
            <li>Your app is now visible to beta testers</li>
            <li>You'll receive notifications when testers download your app</li>
            <li>Feedback and reviews will appear in your dashboard</li>
        </ul>
    </div>
    
    <a href="${data.appUrl}" class="button">View Your App</a>
    <a href="${data.dashboardUrl}" class="button" style="background: #10b981;">Go to Dashboard</a>
    
    <p>We're excited to see how beta testers respond to your app. Good luck!</p>
    
    <p>Best regards,</p>
    <p>The AppFounders Team</p>
  `);

  const text = `
🎉 Your App Has Been Approved!

Hi ${data.userName},

Great news! Your app "${data.appName}" has been approved and is now live on the AppFounders marketplace!

What happens next?
- Your app is now visible to beta testers
- You'll receive notifications when testers download your app
- Feedback and reviews will appear in your dashboard

View your app: ${data.appUrl}
Go to dashboard: ${data.dashboardUrl}

We're excited to see how beta testers respond to your app. Good luck!

Best regards,
The AppFounders Team
  `;

  return { html, text };
}

/**
 * Purchase confirmation template
 */
function renderPurchaseConfirmationTemplate(data: EmailTemplateData['purchaseConfirmation']): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>Purchase Confirmation</h1>
    <p>Hi ${data.userName},</p>
    
    <p>Thank you for your purchase! Your order has been processed successfully.</p>
    
    <div class="highlight success">
        <h3>Order Details</h3>
        <p><strong>App:</strong> ${data.appName}</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Status:</strong> Completed</p>
    </div>
    
    <a href="${data.downloadUrl}" class="button">Download App</a>
    <a href="${data.receiptUrl}" class="button" style="background: #6b7280;">View Receipt</a>
    
    <p>Your download link will remain active for 30 days. If you have any issues, please contact our support team.</p>
    
    <p>Thank you for supporting indie developers!</p>
    <p>The AppFounders Team</p>
  `);

  const text = `
Purchase Confirmation

Hi ${data.userName},

Thank you for your purchase! Your order has been processed successfully.

Order Details:
- App: ${data.appName}
- Amount: ${data.amount}
- Status: Completed

Download your app: ${data.downloadUrl}
View receipt: ${data.receiptUrl}

Your download link will remain active for 30 days. If you have any issues, please contact our support team.

Thank you for supporting indie developers!
The AppFounders Team
  `;

  return { html, text };
}

/**
 * Render email template by name
 */
export async function renderEmailTemplate<T extends keyof EmailTemplateData>(
  templateName: T,
  data: EmailTemplateData[T]
): Promise<{ html: string; text: string }> {
  switch (templateName) {
    case 'welcome':
      return renderWelcomeTemplate(data as EmailTemplateData['welcome']);
    case 'emailVerification':
      return renderEmailVerificationTemplate(data as EmailTemplateData['emailVerification']);
    case 'passwordReset':
      return renderPasswordResetTemplate(data as EmailTemplateData['passwordReset']);
    case 'appApproved':
      return renderAppApprovedTemplate(data as EmailTemplateData['appApproved']);
    case 'purchaseConfirmation':
      return renderPurchaseConfirmationTemplate(data as EmailTemplateData['purchaseConfirmation']);
    default:
      throw new Error(`Template ${templateName} not found`);
  }
}
