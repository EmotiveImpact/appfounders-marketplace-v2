import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Set longer expiration for persistent sessions
            const cookieOptions = {
              ...options,
              maxAge: options.maxAge || 30 * 24 * 60 * 60, // Default to 30 days if not specified
            };
            
            cookieStore.set({ name, value, ...cookieOptions });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};

/**
 * Get the current authenticated user from the server
 * @returns The user object or null if not authenticated
 */
export async function getServerUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error getting server user:', error);
    return null;
  }
}

/**
 * Get the user's role from their metadata
 * @returns The user's role or 'unknown' if not found
 */
export async function getUserRole(): Promise<string> {
  const user = await getServerUser();
  
  if (!user) {
    return 'unknown';
  }
  
  return user.user_metadata?.role || 'unknown';
}
