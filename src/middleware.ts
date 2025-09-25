import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/developer',
  '/dashboard/tester',
  '/dashboard/admin',
];

// Define role-specific routes
const roleRoutes = {
  developer: ['/dashboard/developer'],
  tester: ['/dashboard/tester'],
  admin: ['/dashboard/admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    // Not a protected route, continue
    return NextResponse.next();
  }

  // Use Supabase for authentication
  // For protected routes, verify authentication
  const { supabase, response } = createClient(request);
  
  // Get the user from the session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // No authenticated user, redirect to sign in
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access
  const userRole = user.user_metadata?.role || 'unknown';
  
  // Check if user is trying to access a role-specific route they don't have access to
  for (const [role, routes] of Object.entries(roleRoutes)) {
    if (role !== userRole && routes.some(route => pathname.startsWith(route))) {
      // User doesn't have the required role, redirect to their dashboard
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
    }
  }

  // User is authenticated and has the correct role, continue
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except protected ones)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/(?!protected)).*)',
  ],
};
