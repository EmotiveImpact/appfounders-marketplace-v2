'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/stripe/config';

interface HostedCheckoutProps {
  amount?: number;
  productType?: 'appSubmission' | 'featuredListing' | 'premiumSupport' | 'custom';
  appId?: string;
  appName?: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  buttonText?: string;
  className?: string;
}

export function HostedCheckout({
  amount,
  productType,
  appId,
  appName,
  description,
  successUrl,
  cancelUrl,
  buttonText,
  className,
}: HostedCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default URLs
  const defaultSuccessUrl = `${window.location.origin}/payment/success`;
  const defaultCancelUrl = `${window.location.origin}/payment/cancelled`;

  // Product pricing
  const productPricing = {
    appSubmission: { amount: 2999, name: 'App Submission Fee' },
    featuredListing: { amount: 9999, name: 'Featured App Listing (30 days)' },
    premiumSupport: { amount: 4999, name: 'Premium Support Package' },
  };

  const finalAmount = productType ? (productPricing as any)[productType]?.amount : amount;
  const finalName = productType ? (productPricing as any)[productType]?.name : (appName || 'Purchase');

  const handleCheckout = async () => {
    if (!finalAmount) {
      setError('Amount is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          productType,
          appId,
          description: description || `Purchase: ${finalName}`,
          successUrl: successUrl || defaultSuccessUrl,
          cancelUrl: cancelUrl || defaultCancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleCheckout}
        disabled={isLoading || !finalAmount}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating checkout...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {buttonText || `${finalAmount ? formatCurrency(finalAmount) : 'Checkout'}`}
            <ExternalLink className="ml-2 h-3 w-3" />
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-2">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}

// Product-specific checkout components
export function AppSubmissionCheckout({ appId, className }: { appId?: string; className?: string }) {
  return (
    <HostedCheckout
      productType="appSubmission"
      appId={appId}
      description="App submission fee for marketplace review"
      buttonText="Pay Submission Fee"
      className={className}
    />
  );
}

export function FeaturedListingCheckout({ appId, appName, className }: { 
  appId?: string; 
  appName?: string; 
  className?: string; 
}) {
  return (
    <HostedCheckout
      productType="featuredListing"
      appId={appId}
      appName={appName}
      description={`Featured listing for ${appName || 'your app'}`}
      buttonText="Get Featured Listing"
      className={className}
    />
  );
}

export function PremiumSupportCheckout({ className }: { className?: string }) {
  return (
    <HostedCheckout
      productType="premiumSupport"
      description="Premium support package with priority assistance"
      buttonText="Get Premium Support"
      className={className}
    />
  );
}

// Quick purchase component for apps
export function QuickPurchase({ 
  amount, 
  appId, 
  appName, 
  className 
}: { 
  amount: number; 
  appId: string; 
  appName: string; 
  className?: string; 
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{appName}</CardTitle>
        <p className="text-2xl font-bold text-blue-600">
          {formatCurrency(amount)}
        </p>
      </CardHeader>
      <CardContent>
        <HostedCheckout
          amount={amount}
          appId={appId}
          appName={appName}
          description={`Purchase ${appName}`}
          buttonText="Buy Now"
        />
      </CardContent>
    </Card>
  );
}
