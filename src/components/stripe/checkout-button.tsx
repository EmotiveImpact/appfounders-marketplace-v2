'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStripe } from '@/lib/stripe/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  appId: string;
  appName: string;
  price: number;
  className?: string;
  disabled?: boolean;
}

export function CheckoutButton({ 
  appId, 
  appName, 
  price, 
  className = '',
  disabled = false 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push(`/signin?redirect=/marketplace/${appId}`);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          priceId: `price_${appId}`, // This should be the actual Stripe price ID
          successUrl: `${window.location.origin}/purchase/success?app=${appId}`,
          cancelUrl: `${window.location.origin}/marketplace/${appId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        // Fallback: use Stripe.js to redirect
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={disabled || isLoading}
        className={`w-full ${className}`}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Buy Now - {formatPrice(price)}
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by Stripe</p>
        <p>Lifetime access • No recurring fees</p>
      </div>
    </div>
  );
}
