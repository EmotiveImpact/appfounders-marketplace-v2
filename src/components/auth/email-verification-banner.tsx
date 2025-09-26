'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface UserWithEmailVerified {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified?: boolean;
}

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = session?.user as UserWithEmailVerified;

  // Don't show banner if user is verified or if we don't have user data
  if (!user || user.email_verified) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mb-6">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800">
              Please verify your email address to access all features.
            </span>
          </div>
          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Email'
            )}
          </Button>
        </AlertDescription>
      </Alert>

      {message && (
        <Alert className="mt-2 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mt-2 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
