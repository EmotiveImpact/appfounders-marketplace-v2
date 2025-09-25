import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

/**
 * API route to check authentication status
 * Returns user data if authenticated, 401 if not
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
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: user.user_metadata?.role || 'unknown',
      lastSignIn: user.last_sign_in_at,
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
