# Email Service Setup Guide

This guide explains how to set up email services for the AppFounders marketplace platform.

## Overview

The platform supports multiple email service providers:
- **SendGrid** (Recommended) - Reliable, scalable email delivery
- **Mailgun** - Alternative email service with good deliverability
- **SMTP** - Fallback option using any SMTP server

## Email Types

The platform sends the following types of emails:
- **Welcome emails** - New user onboarding
- **Email verification** - Account verification
- **Password reset** - Secure password recovery
- **App approval notifications** - Developer notifications
- **Purchase confirmations** - Transaction receipts
- **Payment failure alerts** - Failed payment notifications
- **Review notifications** - New app reviews
- **Weekly digests** - Platform updates

## SendGrid Setup (Recommended)

### 1. Create SendGrid Account

1. **Sign up for SendGrid**
   - Visit: https://sendgrid.com
   - Create a free account (100 emails/day)
   - Verify your email address

2. **Upgrade Plan** (Optional)
   - Free: 100 emails/day
   - Essentials: $14.95/month for 50,000 emails
   - Pro: $89.95/month for 100,000 emails

### 2. Create API Key

1. **Navigate to API Keys**
   - Go to Settings > API Keys
   - Click "Create API Key"

2. **Configure API Key**
   - Name: `AppFounders Production`
   - Permissions: "Full Access" (or "Restricted Access" with mail send permissions)
   - Copy the API key (you won't see it again)

### 3. Domain Authentication

1. **Add Domain**
   - Go to Settings > Sender Authentication
   - Click "Authenticate Your Domain"
   - Enter your domain (e.g., `appfounders.com`)

2. **DNS Configuration**
   - Add the provided DNS records to your domain
   - Wait for verification (can take up to 48 hours)

3. **Verify Domain**
   - Return to SendGrid and click "Verify"
   - Domain should show as "Verified"

### 4. Environment Variables

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=AppFounders
```

## Mailgun Setup (Alternative)

### 1. Create Mailgun Account

1. **Sign up for Mailgun**
   - Visit: https://www.mailgun.com
   - Create account and verify email
   - Add payment method (required even for free tier)

2. **Free Tier Limits**
   - 5,000 emails for first 3 months
   - Then 1,000 emails/month free

### 2. Domain Setup

1. **Add Domain**
   - Go to Domains > Add New Domain
   - Enter your domain or subdomain (e.g., `mg.yourdomain.com`)

2. **DNS Configuration**
   - Add the provided DNS records
   - Verify domain status

### 3. Get API Credentials

1. **API Key**
   - Go to Settings > API Keys
   - Copy your Private API key

2. **Domain Name**
   - Use the domain you configured

### 4. Environment Variables

```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your_private_api_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
MAILGUN_FROM_NAME=AppFounders
```

## SMTP Setup (Fallback)

### Gmail SMTP Example

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Enable 2FA for your account

2. **Create App Password**
   - Go to Security > App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Environment Variables**

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=AppFounders
```

### Other SMTP Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Custom SMTP:**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Development Configuration

### Test Mode

Enable test mode to prevent sending real emails during development:

```env
EMAIL_TEST_MODE=true
EMAIL_SAVE_TO_FILE=true
```

### Email Logging

All emails are logged in development mode. Check your console for email details.

## Email Templates

The platform includes responsive HTML email templates:

### Template Features
- **Responsive design** - Works on all devices
- **Consistent branding** - AppFounders styling
- **Dark mode support** - Adapts to user preferences
- **Accessibility** - Screen reader friendly
- **Anti-spam optimized** - High deliverability

### Customizing Templates

Templates are located in `src/lib/email/templates.ts`. You can:

1. **Modify existing templates**
   - Update HTML structure
   - Change styling
   - Add new content sections

2. **Add new templates**
   - Create new template function
   - Add to template registry
   - Update TypeScript interfaces

Example template customization:

```typescript
function renderCustomTemplate(data: CustomTemplateData): { html: string; text: string } {
  const html = getBaseTemplate(`
    <h1>Custom Email</h1>
    <p>Hello ${data.userName},</p>
    <p>Your custom content here...</p>
  `);

  const text = `
Custom Email
Hello ${data.userName},
Your custom content here...
  `;

  return { html, text };
}
```

## Monitoring and Analytics

### SendGrid Analytics

1. **Email Activity**
   - Go to Activity > Email Activity
   - View delivery, open, and click rates

2. **Statistics**
   - Go to Statistics > Overview
   - Monitor email performance metrics

3. **Suppressions**
   - Go to Suppressions
   - Manage bounces, blocks, and unsubscribes

### Email Deliverability Best Practices

1. **Domain Reputation**
   - Use authenticated domain
   - Maintain low bounce rates
   - Monitor spam complaints

2. **Content Quality**
   - Avoid spam trigger words
   - Include unsubscribe links
   - Use proper HTML structure

3. **List Hygiene**
   - Remove bounced emails
   - Honor unsubscribe requests
   - Validate email addresses

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check API key validity
   - Verify domain authentication
   - Check rate limits

2. **Emails Going to Spam**
   - Verify domain authentication
   - Check email content for spam triggers
   - Monitor sender reputation

3. **High Bounce Rates**
   - Validate email addresses
   - Remove invalid emails
   - Check email format

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
EMAIL_TEST_MODE=true
```

Check console logs for detailed error messages.

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Email Content**
   - Sanitize user input
   - Validate email addresses
   - Use secure links (HTTPS)

3. **Rate Limiting**
   - Implement sending limits
   - Monitor usage patterns
   - Handle provider limits gracefully

## Cost Optimization

### SendGrid Pricing Tiers

- **Free**: 100 emails/day
- **Essentials**: $14.95/month (50K emails)
- **Pro**: $89.95/month (100K emails)

### Cost-Saving Tips

1. **Email Consolidation**
   - Combine multiple notifications
   - Use digest emails for non-urgent updates
   - Implement user preferences

2. **Template Optimization**
   - Reduce email size
   - Optimize images
   - Use efficient HTML

3. **Sending Strategy**
   - Batch non-urgent emails
   - Implement retry logic
   - Monitor delivery rates

## Production Checklist

- [ ] Email service provider configured
- [ ] Domain authentication completed
- [ ] API keys secured in environment variables
- [ ] Email templates tested
- [ ] Deliverability monitoring set up
- [ ] Bounce handling implemented
- [ ] Unsubscribe mechanism working
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Analytics tracking enabled

## Support Resources

- **SendGrid Documentation**: https://docs.sendgrid.com/
- **Mailgun Documentation**: https://documentation.mailgun.com/
- **Email Deliverability Guide**: https://sendgrid.com/resource/email-deliverability-guide/
- **SMTP Configuration**: https://nodemailer.com/smtp/
