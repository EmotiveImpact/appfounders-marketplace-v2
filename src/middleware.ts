import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security headers
const securityHeaders = {
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Content Type Options
  'X-Content-Type-Options': 'nosniff',

  // Frame Options
  'X-Frame-Options': 'DENY',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/api/protected',
  '/profile',
  '/developer',
  '/api/user',
  '/api/developer',
  '/api/admin',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/about',
  '/contact',
  '/pricing',
  '/blog',
  '/marketplace',
  '/privacy',
  '/terms',
  '/api/auth',
  '/api/webhooks',
];

// Define role-specific routes and their required roles
const roleBasedRoutes = {
  '/dashboard/admin': ['admin'],
  '/dashboard/developer': ['developer', 'admin'],
  '/dashboard/tester': ['tester', 'developer', 'admin'],
  '/admin': ['admin'],
  '/api/admin': ['admin'],
  '/api/protected/admin': ['admin'],
  '/developer': ['developer', 'admin'],
  '/api/developer': ['developer', 'admin'],
};

// Rate limiting function
function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const key = `rate_limit:${ip}`;
  const now = Date.now();

  // Clean up expired entries
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    // First request in window or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.count >= limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

// Input validation and sanitization
function validateInput(request: NextRequest): boolean {
  const url = request.nextUrl.pathname;
  const query = request.nextUrl.search;

  // Check for common attack patterns
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /\.\.\//g,
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
  ];

  const fullUrl = url + query;

  for (const pattern of maliciousPatterns) {
    if (pattern.test(fullUrl)) {
      return false;
    }
  }

  return true;
}

// Bot detection
function detectBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// CORS handling
function handleCors(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  // Input validation
  if (!validateInput(request)) {
    console.warn('Malicious input detected:', pathname);
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isBot = detectBot(request);
    const limit = isBot ? 10 : 100; // Stricter limits for bots

    const rateLimitResult = rateLimit(request, limit);

    if (!rateLimitResult.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // Skip middleware for public routes
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    const response = NextResponse.next();

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Get the token from NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    // No authenticated user, redirect to sign in for web pages
    if (!pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Return 401 for API routes
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // If user is authenticated, check role-based access
  if (token) {
    const userRole = token.role as string;

    // Check role-based routes
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // User doesn't have the required role
          if (!pathname.startsWith('/api/')) {
            // Redirect to appropriate dashboard based on their role
            const dashboardRoute = getDashboardRoute(userRole);
            return NextResponse.redirect(new URL(dashboardRoute, request.url));
          }

          // Return 403 for API routes
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    }

    // Redirect users to their appropriate dashboard if they access generic /dashboard
    if (pathname === '/dashboard') {
      const dashboardRoute = getDashboardRoute(userRole);
      return NextResponse.redirect(new URL(dashboardRoute, request.url));
    }
  }

  // Create response
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimit(request, 100);
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
  }

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  }

  // Add cache headers for static assets
  if (pathname.startsWith('/_next/static/') ||
      pathname.startsWith('/images/') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add no-cache headers for dynamic content
  if (pathname.startsWith('/api/') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/profile')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// Helper function to get the appropriate dashboard route based on user role
function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'developer':
      return '/dashboard/developer';
    case 'tester':
      return '/dashboard/tester';
    default:
      return '/dashboard/tester'; // Default to tester dashboard
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
