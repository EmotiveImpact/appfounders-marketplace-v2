# AppFounders Beta Tester Marketplace

A platform connecting app developers with beta testers through lifetime founder accounts.

## Features

- Developers list applications with lifetime access
- Testers pay a one-time fee for lifetime access
- Platform takes 20% commission on each sale
- Marketplace for iOS, Android, Web, Mac, and PC applications
- Role-based dashboards for Testers, Developers, Admins, and Super Admins

## Tech Stack

- **Frontend**: Next.js, Shadcn UI, Tailwind CSS
- **CMS**: Payload CMS (for marketplace, blog, and forums)
- **Authentication**: Supabase
- **Database**: MongoDB (for additional data storage)

## Development Roadmap

1. **Project Setup** 
   - Initialize Next.js project
   - Configure Tailwind CSS
   - Set up environment variables

2. **Authentication System** 
   - Implement Supabase authentication
   - Create login/signup pages
   - Set up middleware for route protection

3. **User Dashboards** 
   - Tester Dashboard
   - Developer Dashboard
   - Admin Dashboard
   - Super Admin Dashboard

4. **Payload CMS Integration** 
   - Set up Payload CMS
   - Create collections for marketplace, blog, and forums

5. **Marketplace Features** 
   - Application listing page
   - Application detail page
   - Purchase flow
   - Search and filtering

6. **MongoDB Integration** 
   - Set up MongoDB connection
   - Create schemas for additional data

7. **Testing and Deployment** 
   - Unit and integration testing
   - Deployment setup

## Developer Notes

### Authentication System

**TODO: Before Production Deployment**
- Remove the mock authentication system in `/src/lib/auth/mock-auth.ts`
- Update the middleware in `/src/middleware.ts` to remove development mode bypass
- Remove the development-specific login endpoint in `/src/app/api/auth/dev-login/route.ts`
- Update the sign-in form in `/src/components/auth/sign-in-form.tsx` to remove mock authentication code
- Remove test account buttons from the sign-in page

These development-specific authentication components are only for local testing and should not be included in the production build. They bypass normal authentication flows and could create security vulnerabilities if deployed to production.

### Dashboard Implementation

**Current Status**
- Basic developer dashboard with minimal features
- Comprehensive analytics dashboard with mock data
- Minimal implementation of tester and admin dashboards
- Missing super admin dashboard

**TODO: Dashboard Enhancements**
- Integrate real-time analytics into the main developer dashboard
- Connect analytics dashboard to real data sources
- Complete implementation of all dashboard types
- Add advanced analytics features across all dashboards

See the [Dashboard Implementation Status](/docs/dashboard-implementation-status.md) and [Dashboard Enhancement Plan](/docs/dashboard-enhancement-plan.md) for detailed information.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables in `.env.local`
4. Run the development server:
   ```
   npm run dev
   ```

## License

[MIT](LICENSE)
