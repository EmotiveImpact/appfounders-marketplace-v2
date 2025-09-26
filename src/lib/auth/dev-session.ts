import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Only allow in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function getDevSession() {
  if (!isDevelopment) {
    return null;
  }

  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'dev-secret-key'
    );

    const { payload } = await jwtVerify(sessionToken, secret);

    // Check if this is a dev session (has dev email pattern)
    if (payload.user && typeof payload.user === 'object' && 'email' in payload.user) {
      const email = payload.user.email as string;
      if (email.endsWith('@dev.local')) {
        return {
          user: payload.user,
          expires: payload.expires as string,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Dev session verification error:', error);
    return null;
  }
}

export function isDevSession(session: any): boolean {
  if (!isDevelopment || !session?.user?.email) {
    return false;
  }
  
  return session.user.email.endsWith('@dev.local');
}
