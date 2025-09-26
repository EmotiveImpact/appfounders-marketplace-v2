import { EmailTemplate } from '../types';

export const welcomeTemplate: EmailTemplate = {
  subject: 'Welcome to AppFounders! 🚀',
  
  html: (data: {
    name: string;
    role: 'developer' | 'tester';
    experience_level?: string;
    specializations?: string[];
    dashboardUrl?: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AppFounders</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
          font-weight: bold;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }
        .subtitle {
          font-size: 16px;
          color: #718096;
          margin: 8px 0 0 0;
        }
        .content {
          margin: 30px 0;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .role-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
          margin: 0 4px;
        }
        .developer-badge {
          background-color: #e6fffa;
          color: #234e52;
        }
        .tester-badge {
          background-color: #f0fff4;
          color: #22543d;
        }
        .features {
          margin: 30px 0;
        }
        .feature {
          display: flex;
          align-items: flex-start;
          margin: 20px 0;
          padding: 16px;
          background-color: #f7fafc;
          border-radius: 8px;
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .feature-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }
        .feature-content p {
          margin: 0;
          font-size: 14px;
          color: #4a5568;
        }
        .cta {
          text-align: center;
          margin: 40px 0;
        }
        .cta-button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .specializations {
          margin: 20px 0;
        }
        .spec-tag {
          display: inline-block;
          padding: 4px 8px;
          background-color: #edf2f7;
          color: #4a5568;
          border-radius: 4px;
          font-size: 12px;
          margin: 2px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 14px;
          color: #718096;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AF</div>
          <h1 class="title">Welcome to AppFounders!</h1>
          <p class="subtitle">Your journey in the app ecosystem begins now</p>
        </div>

        <div class="content">
          <div class="greeting">
            Hi ${data.name}! 👋
          </div>
          
          <p>
            Welcome to AppFounders, the premier platform connecting 
            <span class="role-badge ${data.role}-badge">${data.role}s</span>
            with amazing opportunities in the app ecosystem.
          </p>

          <p>
            Your profile has been successfully set up with 
            <strong>${data.experience_level || 'intermediate'}</strong> experience level.
            ${data.specializations && data.specializations.length > 0 ? 
              `You've indicated expertise in: <div class="specializations">${data.specializations.map(spec => `<span class="spec-tag">${spec}</span>`).join('')}</div>` 
              : ''
            }
          </p>

          <div class="features">
            ${data.role === 'developer' ? `
              <div class="feature">
                <div class="feature-icon" style="background-color: #e6fffa; color: #234e52;">📱</div>
                <div class="feature-content">
                  <h3>Showcase Your Apps</h3>
                  <p>Upload your applications and reach a global audience of beta testers and early adopters.</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon" style="background-color: #fef5e7; color: #744210;">💰</div>
                <div class="feature-content">
                  <h3>Monetize Your Work</h3>
                  <p>Sell your apps with our integrated payment system and 80/20 revenue split in your favor.</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon" style="background-color: #f0fff4; color: #22543d;">🔄</div>
                <div class="feature-content">
                  <h3>Get Valuable Feedback</h3>
                  <p>Connect with experienced testers who provide detailed feedback to improve your apps.</p>
                </div>
              </div>
            ` : `
              <div class="feature">
                <div class="feature-icon" style="background-color: #f0fff4; color: #22543d;">🔍</div>
                <div class="feature-content">
                  <h3>Discover New Apps</h3>
                  <p>Get early access to innovative applications before they hit the mainstream market.</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon" style="background-color: #e6fffa; color: #234e52;">🧪</div>
                <div class="feature-content">
                  <h3>Professional Testing</h3>
                  <p>Use your testing skills to help developers improve their applications and earn recognition.</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon" style="background-color: #fef5e7; color: #744210;">🤝</div>
                <div class="feature-content">
                  <h3>Build Connections</h3>
                  <p>Network with developers and other testers in our vibrant community.</p>
                </div>
              </div>
            `}
          </div>

          <div class="cta">
            <a href="${data.dashboardUrl || 'https://appfounders.com/dashboard'}" class="cta-button">
              Go to Your Dashboard →
            </a>
          </div>

          <p>
            If you have any questions or need help getting started, don't hesitate to reach out to our support team. 
            We're here to help you make the most of your AppFounders experience!
          </p>
        </div>

        <div class="footer">
          <div class="social-links">
            <a href="https://twitter.com/appfounders">Twitter</a>
            <a href="https://linkedin.com/company/appfounders">LinkedIn</a>
            <a href="https://github.com/appfounders">GitHub</a>
          </div>
          <p>
            © 2024 AppFounders. All rights reserved.<br>
            <a href="https://appfounders.com/unsubscribe" style="color: #718096;">Unsubscribe</a> | 
            <a href="https://appfounders.com/privacy" style="color: #718096;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data: {
    name: string;
    role: 'developer' | 'tester';
    experience_level?: string;
    specializations?: string[];
    dashboardUrl?: string;
  }) => `
Welcome to AppFounders!

Hi ${data.name}!

Welcome to AppFounders, the premier platform connecting ${data.role}s with amazing opportunities in the app ecosystem.

Your profile has been successfully set up with ${data.experience_level || 'intermediate'} experience level.
${data.specializations && data.specializations.length > 0 ? 
  `You've indicated expertise in: ${data.specializations.join(', ')}` 
  : ''
}

${data.role === 'developer' ? `
As a developer, you can:
• Showcase Your Apps - Upload your applications and reach a global audience
• Monetize Your Work - Sell your apps with our integrated payment system
• Get Valuable Feedback - Connect with experienced testers
` : `
As a tester, you can:
• Discover New Apps - Get early access to innovative applications
• Professional Testing - Use your skills to help developers improve their apps
• Build Connections - Network with developers and other testers
`}

Get started: ${data.dashboardUrl || 'https://appfounders.com/dashboard'}

If you have any questions, reach out to our support team. We're here to help!

Best regards,
The AppFounders Team

© 2024 AppFounders. All rights reserved.
Unsubscribe: https://appfounders.com/unsubscribe
  `
};
