'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelledPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleTryAgain = () => {
    // Go back to the previous page to retry payment
    router.back();
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleBrowseApps = () => {
    router.push('/apps');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">
            Payment Cancelled
          </CardTitle>
          <p className="text-gray-600">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What happened?</h3>
            <p className="text-sm text-blue-700">
              You cancelled the payment process before it was completed. This is completely normal 
              and no charges were made to your payment method.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleTryAgain} 
              className="w-full" 
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Payment Again
            </Button>

            <Button 
              onClick={handleGoBack} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleGoToDashboard} 
                variant="ghost" 
                className="w-full"
              >
                Dashboard
              </Button>
              <Button 
                onClick={handleBrowseApps} 
                variant="ghost" 
                className="w-full"
              >
                Browse Apps
              </Button>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <h4 className="font-medium text-gray-800 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-3">
              If you're experiencing issues with payment, our support team is here to help.
            </p>
            <Button variant="link" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
