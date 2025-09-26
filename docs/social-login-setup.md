# Social Login Setup Guide

This guide explains how to set up Google, GitHub, and Apple OAuth login for the AppFounders platform.

## Overview

The platform supports three social login providers:
- **Google OAuth 2.0** - Most popular option for users
- **GitHub OAuth** - Perfect for developers
- **Apple Sign In** - Required for iOS users and privacy-focused users

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Social Login Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
```

## Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "AppFounders"

4. **Configure Authorized URLs**
   - Authorized JavaScript origins:
     - `http://localhost:3001` (development)
     - `https://your-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)

5. **Copy Credentials**
   - Copy Client ID to `GOOGLE_CLIENT_ID`
   - Copy Client Secret to `GOOGLE_CLIENT_SECRET`

## GitHub OAuth Setup

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Configure OAuth App**
   - Application name: "AppFounders"
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: 
     - Development: `http://localhost:3001/api/auth/callback/github`
     - Production: `https://your-domain.com/api/auth/callback/github`

3. **Copy Credentials**
   - Copy Client ID to `GITHUB_CLIENT_ID`
   - Copy Client Secret to `GITHUB_CLIENT_SECRET`

## Apple Sign In Setup

1. **Apple Developer Account Required**
   - You need a paid Apple Developer account ($99/year)
   - Visit: https://developer.apple.com/

2. **Create App ID**
   - Go to "Certificates, Identifiers & Profiles"
   - Create new App ID with Sign In with Apple capability

3. **Create Service ID**
   - Create a new Service ID
   - Enable "Sign In with Apple"
   - Configure domains and return URLs:
     - Domain: `your-domain.com`
     - Return URL: `https://your-domain.com/api/auth/callback/apple`

4. **Create Private Key**
   - Create a new key with "Sign In with Apple" capability
   - Download the .p8 file

5. **Configure Environment Variables**
   - `APPLE_CLIENT_ID`: Your Service ID
   - `APPLE_CLIENT_SECRET`: Generated JWT token (see Apple docs)

## Testing Social Login

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Each Provider**
   - Visit `/signin` page
   - Click on each social login button
   - Verify successful authentication and user creation

3. **Check Database**
   - Verify users are created with correct email and name
   - Password hash should be null for social login users
   - Default role should be 'tester'

## User Flow

1. **New User Social Login**
   - User clicks social login button
   - Redirected to provider's OAuth page
   - User authorizes the application
   - User is redirected back to AppFounders
   - New user account is created in database
   - User is signed in and redirected to dashboard

2. **Existing User Social Login**
   - Same flow as above
   - Existing user is found by email
   - User is signed in with existing account

## Security Considerations

1. **HTTPS Required**
   - Social login requires HTTPS in production
   - Use proper SSL certificates

2. **Secure Secrets**
   - Never commit OAuth secrets to version control
   - Use environment variables
   - Rotate secrets regularly

3. **Callback URL Validation**
   - Only allow authorized callback URLs
   - Validate redirect URLs to prevent open redirects

## Troubleshooting

### Common Issues

1. **"Invalid Client" Error**
   - Check client ID and secret are correct
   - Verify callback URLs match exactly

2. **"Unauthorized" Error**
   - Check domain authorization in provider settings
   - Verify HTTPS is used in production

3. **User Not Created**
   - Check database connection
   - Verify createUser function handles null passwords
   - Check console logs for errors

### Debug Mode

Enable debug mode in development:

```env
NEXTAUTH_DEBUG=true
```

This will show detailed logs in the console for troubleshooting.

## Production Deployment

1. **Update Environment Variables**
   - Set production OAuth credentials
   - Update callback URLs to production domain

2. **Verify HTTPS**
   - Ensure SSL certificate is valid
   - Test all social login flows

3. **Monitor Logs**
   - Watch for authentication errors
   - Monitor user creation success rates

## Support

For additional help:
- NextAuth.js documentation: https://next-auth.js.org/
- Provider-specific documentation in NextAuth.js docs
- Check GitHub issues for common problems
