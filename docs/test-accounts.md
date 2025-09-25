# Test Accounts for Development

This document provides information about the test accounts available for development purposes in the AppFounders platform.

## Available Test Accounts

| Account Type | Email | Password | Role | Description |
|-------------|-------|----------|------|-------------|
| Developer | developer@example.com | developer123 | developer | General developer account |
| Analytics Developer | analytics_dev@example.com | analytics123 | developer | Developer account with analytics data |
| Tester | tester@example.com | tester123 | tester | Tester account |
| Admin | admin@example.com | admin123 | admin | Admin account |

## How to Use Test Accounts

1. Navigate to the sign-in page at `http://localhost:3000/signin`
2. In development mode, you'll see a "Show Test Accounts" button at the bottom of the form
3. Click this button to reveal the test account options
4. Click on any test account to auto-fill the email and password fields
5. Click "LOG IN" to sign in with the selected account

## Important Notes

- These accounts are only available in development mode
- The accounts use mock authentication and don't require a real database connection
- Each account has different permissions based on its role
- The Analytics Developer account has been specifically configured to work with the analytics dashboard

## Accessing Analytics Dashboards

After signing in with the Analytics Developer account, you can access:

1. **Main Analytics Dashboard**: `http://localhost:3000/dashboard/developer/analytics`
2. **Feedback Analytics Dashboard**: `http://localhost:3000/dashboard/developer/feedback/analytics`
3. **App-Specific Analytics**: `http://localhost:3000/dashboard/developer/apps/[app-id]/analytics`

## Troubleshooting

If you encounter issues with the test accounts:

1. Make sure you're running the application in development mode
2. Check the browser console for any authentication errors
3. Try clearing your browser's local storage and cookies
4. Restart the development server

For any persistent issues, please refer to the authentication implementation in `/src/lib/auth/` directory.
