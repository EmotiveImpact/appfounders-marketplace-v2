# Route Protection System

This document explains the comprehensive route protection system implemented for the AppFounders platform.

## Overview

The route protection system provides:
- **Authentication verification** - Ensures users are logged in
- **Role-based access control** - Controls access based on user roles
- **Resource-level permissions** - Fine-grained control over specific resources
- **API route protection** - Secure API endpoints
- **Page-level protection** - Secure frontend pages

## User Roles

The system supports three user roles with hierarchical permissions:

### 1. Tester (Base Role)
- Access to tester dashboard
- Can browse and test apps
- Can provide feedback and reviews
- Can manage their own profile

### 2. Developer (Includes Tester permissions)
- Access to developer dashboard
- Can create and manage apps
- Can view app analytics
- Can respond to feedback

### 3. Admin (Includes all permissions)
- Access to admin dashboard
- Can manage all users
- Can moderate content
- Can access system analytics
- Can manage platform settings

## Middleware Protection

The middleware (`src/middleware.ts`) handles:

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires admin role
- `/api/protected/*` - Requires authentication

### Public Routes
- `/` - Homepage
- `/signin`, `/signup` - Authentication pages
- `/about`, `/contact` - Public pages
- `/blog/*` - Public blog
- `/api/auth/*` - NextAuth endpoints

### Role-Based Redirects
- Users accessing `/dashboard` are redirected to their role-specific dashboard
- Users without proper permissions are redirected to their appropriate dashboard

## API Route Protection

### Using `createProtectedRoute`

```typescript
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';

export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    // Your route logic here
    return NextResponse.json({ data: 'protected data' });
  },
  {
    requiredRole: USER_ROLES.ADMIN,
    resourceType: 'user',
    action: 'read',
  }
);
```

### Protection Options

- **requiredRole**: Minimum role required (optional)
- **resourceType**: Type of resource being accessed
- **action**: Type of action being performed

### Resource Types
- `app` - Application resources
- `user` - User management
- `admin` - Administrative functions
- `analytics` - Analytics data

### Actions
- `read` - View/retrieve data
- `write` - Create/update data
- `delete` - Remove data

## Permission System

### Role Hierarchy
```
Admin > Developer > Tester
```

Higher roles inherit all permissions from lower roles.

### Permission Matrix

| Permission | Tester | Developer | Admin |
|------------|--------|-----------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Own Apps | ❌ | ✅ | ✅ |
| Manage All Apps | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Access Admin Panel | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ✅ |

## Implementation Examples

### 1. Protected API Route

```typescript
// src/app/api/protected/admin/users/route.ts
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    const users = await db.getAllUsers();
    return NextResponse.json({ users });
  },
  {
    requiredRole: USER_ROLES.ADMIN,
    resourceType: 'user',
    action: 'read',
  }
);
```

### 2. Manual Validation

```typescript
import { validateApiAccess } from '@/lib/auth/route-protection';

export async function GET(req: NextRequest) {
  try {
    const user = await validateApiAccess(
      req,
      USER_ROLES.DEVELOPER,
      'app',
      'read'
    );
    
    // Your logic here
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
```

### 3. Permission Checking

```typescript
import { getUserPermissions, canAccessResource } from '@/lib/auth/route-protection';

// Check user permissions
const permissions = getUserPermissions(user.role);
if (permissions.canManageUsers) {
  // Allow user management
}

// Check specific resource access
if (canAccessResource(user.role, 'app', 'write')) {
  // Allow app creation/editing
}
```

## Frontend Protection

### Page Components

Use the session hook to protect pages:

```typescript
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') return <div>Loading...</div>;
  
  if (!session) {
    router.push('/signin');
    return null;
  }

  // Check role if needed
  if (session.user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  return <div>Protected content</div>;
}
```

### Conditional Rendering

```typescript
import { getUserPermissions } from '@/lib/auth/route-protection';

function Dashboard({ user }) {
  const permissions = getUserPermissions(user.role);

  return (
    <div>
      {permissions.canManageUsers && (
        <UserManagementPanel />
      )}
      {permissions.canViewAnalytics && (
        <AnalyticsPanel />
      )}
    </div>
  );
}
```

## Security Best Practices

### 1. Defense in Depth
- Middleware for route-level protection
- API route validation
- Frontend permission checks
- Database-level constraints

### 2. Principle of Least Privilege
- Users get minimum required permissions
- Explicit permission checks for sensitive operations
- Regular permission audits

### 3. Secure Defaults
- Deny access by default
- Require explicit permission grants
- Fail securely on errors

### 4. Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use TypeScript for type safety

## Testing Route Protection

### 1. Unit Tests

```typescript
import { hasRequiredRole, canAccessResource } from '@/lib/auth/route-protection';

describe('Route Protection', () => {
  test('admin has all permissions', () => {
    expect(hasRequiredRole('admin', 'tester')).toBe(true);
    expect(canAccessResource('admin', 'user', 'write')).toBe(true);
  });

  test('tester has limited permissions', () => {
    expect(hasRequiredRole('tester', 'admin')).toBe(false);
    expect(canAccessResource('tester', 'user', 'write')).toBe(false);
  });
});
```

### 2. Integration Tests

Test API routes with different user roles to ensure proper access control.

### 3. Manual Testing

- Test each role's access to different routes
- Verify redirects work correctly
- Test edge cases and error scenarios

## Troubleshooting

### Common Issues

1. **Infinite Redirects**
   - Check middleware matcher configuration
   - Ensure public routes are properly excluded

2. **Permission Denied Errors**
   - Verify user role is correctly set
   - Check role hierarchy and permissions

3. **Session Issues**
   - Verify NextAuth configuration
   - Check JWT token validity

### Debug Mode

Enable debug logging:

```env
NEXTAUTH_DEBUG=true
```

This will show detailed authentication logs in development.

## Future Enhancements

1. **Dynamic Permissions** - Database-driven permission system
2. **Resource Ownership** - Users can only access their own resources
3. **Time-based Access** - Temporary permissions
4. **Audit Logging** - Track all permission checks and access attempts
