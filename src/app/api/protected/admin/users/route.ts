import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { db } from '@/lib/database/neon-client';

// GET /api/protected/admin/users - Get all users (admin only)
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const users = await db.getAllUsers();
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));

      return NextResponse.json({
        success: true,
        users: sanitizedUsers,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
    resourceType: 'user',
    action: 'read',
  }
);

// POST /api/protected/admin/users - Create new user (admin only)
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { email, name, role, password } = body;

      // Validate input
      if (!email || !name || !role) {
        return NextResponse.json(
          { error: 'Email, name, and role are required' },
          { status: 400 }
        );
      }

      // Create user
      const newUser = await db.createUser({
        email,
        name,
        role,
        passwordHash: password ? await hashPassword(password) : null,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.ADMIN,
    resourceType: 'user',
    action: 'write',
  }
);
