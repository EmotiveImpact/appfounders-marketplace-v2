'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

interface SignInOptions {
  email: string;
  password: string;
  redirectTo?: string;
}

interface SignUpOptions {
  email: string;
  password: string;
  name: string;
  role: 'developer' | 'tester';
  redirectTo?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(
    async ({ email, password, redirectTo = '/dashboard' }: SignInOptions) => {
      try {
        setLoading(true);
        setError(null);

        // Use NextAuth for authentication
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error);
          return false;
        }

        // Redirect to dashboard - NextAuth will handle role-based routing
        router.push(redirectTo);
        return true;
      } catch (err: any) {
        setError(err.message || 'An error occurred during sign in');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleSignUp = useCallback(
    async ({ email, password, name, role, redirectTo = '/dashboard' }: SignUpOptions) => {
      try {
        setLoading(true);
        setError(null);

        // Create user via API
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create account');
        }

        // Sign in the user immediately after successful registration
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error);
          return false;
        }

        router.push(`/dashboard/${role}`);
        return true;
      } catch (err: any) {
        setError(err.message || 'An error occurred during sign up');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);

      // Sign out from NextAuth
      await signOut({ redirect: false });

      // Clear any local state
      setError(null);

      // Force a page redirect to the home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading' || loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}
