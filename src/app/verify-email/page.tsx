'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setIsLoading(false);
      return;
    }

    // Verify token validity first
    const checkToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        setTokenValid(data.valid);
        if (!data.valid) {
          setError('This verification link is invalid or has expired');
        }
      } catch (err) {
        setError('Failed to verify link');
        setTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!token) return;

    setIsVerifying(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Your email has been verified successfully!');
        setVerified(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'Failed to verify email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Checking verification link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>Invalid verification link. Please check your email for the correct link.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>This verification link is invalid or has expired. Please request a new verification email.</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your account setup by verifying your email address
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Verification
            </CardTitle>
            <CardDescription>
              Click the button below to verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {!verified && !error && (
              <Button
                onClick={handleVerifyEmail}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email Address'
                )}
              </Button>
            )}

            {verified && (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-medium">Email verified successfully!</p>
                <p className="text-sm text-gray-600 mt-2">Redirecting to dashboard...</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Loading verification...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
