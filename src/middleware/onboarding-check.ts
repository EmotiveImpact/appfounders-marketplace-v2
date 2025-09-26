import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to check if authenticated users have completed onboarding
 * Redirects to onboarding page if not completed
 */
export async function onboardingCheck(req: NextRequest) {
  try {
    // Get the JWT token
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no token, user is not authenticated - let other middleware handle
    if (!token) {
      return NextResponse.next();
    }

    const { pathname } = req.nextUrl;

    // Skip onboarding check for certain paths
    const skipPaths = [
      '/onboarding',
      '/api/',
      '/auth/',
      '/signin',
      '/signup',
      '/signout',
      '/_next/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    const shouldSkip = skipPaths.some(path => pathname.startsWith(path));
    if (shouldSkip) {
      return NextResponse.next();
    }

    // Check if user has completed onboarding
    const user = token.user as any;
    
    // If onboarding_completed is not set or false, redirect to onboarding
    if (!user?.onboarding_completed) {
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }

    // User has completed onboarding, continue
    return NextResponse.next();
  } catch (error) {
    console.error('Onboarding check middleware error:', error);
    // On error, continue to avoid breaking the app
    return NextResponse.next();
  }
}

/**
 * Check if a path requires onboarding completion
 */
export function requiresOnboarding(pathname: string): boolean {
  // Paths that require completed onboarding
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/apps',
    '/settings',
    '/upload',
    '/download',
  ];

  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Get onboarding status from user token
 */
export function getOnboardingStatus(user: any): {
  completed: boolean;
  completedAt?: string;
} {
  return {
    completed: user?.onboarding_completed || false,
    completedAt: user?.onboarding_completed_at,
  };
}
