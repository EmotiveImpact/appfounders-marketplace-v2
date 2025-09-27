import { NextRequest, NextResponse } from 'next/server';
import { createClient, getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * API route to get user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user from the server
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Return user profile data
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: user.user_metadata?.role || 'unknown',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API route to update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the user from the server
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { name } = body;
    
    // Validate the request
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Update the user profile
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        name,
      },
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
