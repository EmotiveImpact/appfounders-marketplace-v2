import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import React from 'react';

// Define user roles and their hierarchy
export const USER_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  TESTER: 'tester',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role hierarchy - higher roles include permissions of lower roles
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [USER_ROLES.ADMIN]: [USER_ROLES.ADMIN, USER_ROLES.DEVELOPER, USER_ROLES.TESTER],
  [USER_ROLES.DEVELOPER]: [USER_ROLES.DEVELOPER, USER_ROLES.TESTER],
  [USER_ROLES.TESTER]: [USER_ROLES.TESTER],
};

/**
 * Check if a user has the required role or higher
 */
export function hasRequiredRole(userRole: string, requiredRole: UserRole): boolean {
  const allowedRoles = ROLE_HIERARCHY[requiredRole];
  return allowedRoles ? allowedRoles.includes(userRole as UserRole) : false;
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth(handler: Function, requiredRole?: UserRole) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role if specified
      if (requiredRole) {
        const userRole = (session.user as any).role;
        if (!hasRequiredRole(userRole, requiredRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Add user to request context
      const requestWithUser = req as NextRequest & { user: any };
      requestWithUser.user = session.user;

      return handler(requestWithUser, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order component for protecting page components
 */
export function withPageAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole?: UserRole
) {
  return function ProtectedComponent(props: T) {
    // This would be used with getServerSideProps or in a client component
    // with useSession hook for client-side protection
    return <Component {...props} />;
  };
}

/**
 * Utility to get user permissions based on role
 */
export function getUserPermissions(role: string) {
  const permissions = {
    canViewDashboard: true,
    canManageApps: false,
    canManageUsers: false,
    canAccessAdmin: false,
    canModerateContent: false,
    canViewAnalytics: false,
  };

  switch (role) {
    case USER_ROLES.ADMIN:
      return {
        ...permissions,
        canManageApps: true,
        canManageUsers: true,
        canAccessAdmin: true,
        canModerateContent: true,
        canViewAnalytics: true,
      };
    case USER_ROLES.DEVELOPER:
      return {
        ...permissions,
        canManageApps: true,
        canViewAnalytics: true,
      };
    case USER_ROLES.TESTER:
      return permissions;
    default:
      return {
        ...permissions,
        canViewDashboard: false,
      };
  }
}

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  userRole: string,
  resourceType: 'app' | 'user' | 'admin' | 'analytics',
  action: 'read' | 'write' | 'delete' = 'read'
): boolean {
  const permissions = getUserPermissions(userRole);

  switch (resourceType) {
    case 'app':
      return action === 'read' ? true : permissions.canManageApps;
    case 'user':
      return action === 'read' ? true : permissions.canManageUsers;
    case 'admin':
      return permissions.canAccessAdmin;
    case 'analytics':
      return permissions.canViewAnalytics;
    default:
      return false;
  }
}

/**
 * Validate API request with role-based access control
 */
export async function validateApiAccess(
  req: NextRequest,
  requiredRole?: UserRole,
  resourceType?: 'app' | 'user' | 'admin' | 'analytics',
  action?: 'read' | 'write' | 'delete'
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error('Authentication required');
  }

  const userRole = (session.user as any).role;

  // Check required role
  if (requiredRole && !hasRequiredRole(userRole, requiredRole)) {
    throw new Error('Insufficient permissions');
  }

  // Check resource access
  if (resourceType && !canAccessResource(userRole, resourceType, action)) {
    throw new Error('Access denied for this resource');
  }

  return session.user;
}

/**
 * Create a protected API route handler
 */
export function createProtectedRoute(
  handler: (req: NextRequest, user: any, context?: any) => Promise<NextResponse>,
  options: {
    requiredRole?: UserRole;
    resourceType?: 'app' | 'user' | 'admin' | 'analytics';
    action?: 'read' | 'write' | 'delete';
  } = {}
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const user = await validateApiAccess(
        req,
        options.requiredRole,
        options.resourceType,
        options.action
      );

      return handler(req, user, context);
    } catch (error: any) {
      const status = error.message === 'Authentication required' ? 401 : 403;
      return NextResponse.json(
        { error: error.message },
        { status }
      );
    }
  };
}
