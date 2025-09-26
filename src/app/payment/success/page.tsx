'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/stripe/config';

interface PaymentDetails {
  sessionId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  appId?: string;
  appName?: string;
  customerEmail: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsLoading(false);
      return;
    }

    fetchPaymentDetails();
  }, [sessionId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/session/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment details');
      }

      setPaymentDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (paymentDetails?.appId) {
      router.push(`/apps/${paymentDetails.appId}/download`);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToApps = () => {
    router.push('/apps');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Verifying your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-800">Payment Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                </span>
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-xs">
                  {paymentDetails.paymentIntentId}
                </span>
                <span className="text-gray-600">Email:</span>
                <span>{paymentDetails.customerEmail}</span>
                {paymentDetails.appName && (
                  <>
                    <span className="text-gray-600">App:</span>
                    <span className="font-medium">{paymentDetails.appName}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {paymentDetails?.appId && (
              <Button 
                onClick={handleDownload} 
                className="w-full" 
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Your App
              </Button>
            )}

            <Button 
              onClick={handleGoToDashboard} 
              variant="outline" 
              className="w-full"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button 
              onClick={handleGoToApps} 
              variant="ghost" 
              className="w-full"
            >
              Browse More Apps
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your email address.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
