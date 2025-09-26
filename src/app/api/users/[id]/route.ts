import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

// Custom session type with extended user properties
interface CustomSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
  }
}

// GET /api/users/[id] - Get user by ID (admin only or self)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admins to view other users or users to view themselves
    if (session.user.role !== 'admin' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    
    // Get user profile
    const user = await payload.findByID({
      collection: 'users',
      id,
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Error in GET /api/users/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user by ID (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admins to update other users or users to update themselves
    if (session.user.role !== 'admin' && session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // If not admin, prevent changing role
    if (session.user.role !== 'admin' && data.role) {
      delete data.role;
    }
    
    
    // Update user profile
    const updatedUser = await payload.update({
      collection: 'users',
      id,
      data,
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Error in PATCH /api/users/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user by ID (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verify user is authenticated and is an admin
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admins to delete users
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    
    // Delete user
    await payload.delete({
      collection: 'users',
      id,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in DELETE /api/users/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
