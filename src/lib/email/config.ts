// Email service configuration
export const emailConfig = {
  // Email service provider
  provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid' | 'mailgun' | 'smtp'
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@appfounders.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'AppFounders',
  },
  
  // Mailgun configuration
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
    fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@appfounders.com',
    fromName: process.env.MAILGUN_FROM_NAME || 'AppFounders',
  },
  
  // SMTP configuration (fallback)
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@appfounders.com',
    fromName: process.env.SMTP_FROM_NAME || 'AppFounders',
  },
  
  // Email templates
  templates: {
    welcome: {
      subject: 'Welcome to AppFounders!',
      template: 'welcome',
    },
    emailVerification: {
      subject: 'Verify your email address',
      template: 'email-verification',
    },
    passwordReset: {
      subject: 'Reset your password',
      template: 'password-reset',
    },
    appApproved: {
      subject: 'Your app has been approved!',
      template: 'app-approved',
    },
    appRejected: {
      subject: 'App submission update',
      template: 'app-rejected',
    },
    purchaseConfirmation: {
      subject: 'Purchase confirmation',
      template: 'purchase-confirmation',
    },
    paymentFailed: {
      subject: 'Payment failed',
      template: 'payment-failed',
    },
    newReview: {
      subject: 'New review for your app',
      template: 'new-review',
    },
    weeklyDigest: {
      subject: 'Your weekly AppFounders digest',
      template: 'weekly-digest',
    },
  },
  
  // Email settings
  settings: {
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    timeout: 30000, // 30 seconds
    trackOpens: true,
    trackClicks: true,
  },

  // Development settings
  development: {
    logEmails: process.env.NODE_ENV === 'development',
    saveToFile: process.env.EMAIL_SAVE_TO_FILE === 'true',
    testMode: process.env.EMAIL_TEST_MODE === 'true',
  },
};

// Email template data interfaces
export interface EmailTemplateData {
  welcome: {
    userName: string;
    userEmail: string;
    dashboardUrl: string;
  };
  emailVerification: {
    userName: string;
    verificationUrl: string;
    expiresIn: string;
  };
  passwordReset: {
    userName: string;
    resetUrl: string;
    expiresIn: string;
  };
  appApproved: {
    userName: string;
    appName: string;
    appUrl: string;
    dashboardUrl: string;
  };
  appRejected: {
    userName: string;
    appName: string;
    reason: string;
    dashboardUrl: string;
  };
  purchaseConfirmation: {
    userName: string;
    appName: string;
    amount: string;
    downloadUrl: string;
    receiptUrl: string;
  };
  paymentFailed: {
    userName: string;
    appName: string;
    amount: string;
    reason: string;
    retryUrl: string;
  };
  newReview: {
    developerName: string;
    appName: string;
    reviewerName: string;
    rating: number;
    comment: string;
    appUrl: string;
  };
  weeklyDigest: {
    userName: string;
    stats: {
      newApps: number;
      totalDownloads: number;
      revenue: string;
    };
    featuredApps: Array<{
      name: string;
      description: string;
      url: string;
    }>;
  };
}

// Validate email configuration
export function validateEmailConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (emailConfig.provider) {
    case 'sendgrid':
      if (!emailConfig.sendgrid.apiKey) {
        errors.push('SENDGRID_API_KEY is required');
      }
      if (!emailConfig.sendgrid.fromEmail) {
        errors.push('SENDGRID_FROM_EMAIL is required');
      }
      break;
      
    case 'mailgun':
      if (!emailConfig.mailgun.apiKey) {
        errors.push('MAILGUN_API_KEY is required');
      }
      if (!emailConfig.mailgun.domain) {
        errors.push('MAILGUN_DOMAIN is required');
      }
      break;
      
    case 'smtp':
      if (!emailConfig.smtp.host) {
        errors.push('SMTP_HOST is required');
      }
      if (!emailConfig.smtp.user) {
        errors.push('SMTP_USER is required');
      }
      if (!emailConfig.smtp.password) {
        errors.push('SMTP_PASSWORD is required');
      }
      break;
      
    default:
      errors.push('Invalid EMAIL_PROVIDER specified');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper function to get sender info
export function getSenderInfo() {
  switch (emailConfig.provider) {
    case 'sendgrid':
      return {
        email: emailConfig.sendgrid.fromEmail,
        name: emailConfig.sendgrid.fromName,
      };
    case 'mailgun':
      return {
        email: emailConfig.mailgun.fromEmail,
        name: emailConfig.mailgun.fromName,
      };
    case 'smtp':
      return {
        email: emailConfig.smtp.fromEmail,
        name: emailConfig.smtp.fromName,
      };
    default:
      return {
        email: 'noreply@appfounders.com',
        name: 'AppFounders',
      };
  }
}
