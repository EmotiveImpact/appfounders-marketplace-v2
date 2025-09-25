'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, CreditCard, Lock, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PurchaseModalProps {
  app: {
    id: string;
    name: string;
    image: string | { url: string };
    price: number;
    developer: string | { name: string };
  };
  onClose: () => void;
  onPurchase: () => Promise<void>;
  isPurchasing: boolean;
}

const PurchaseModal = ({ app, onClose, onPurchase, isPurchasing }: PurchaseModalProps) => {
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
  
  // Get image URL from app image (handles both string and object formats)
  const imageUrl = typeof app.image === 'string' ? app.image : app.image?.url || '';
  
  // Get developer name (handles both string and object formats)
  const developerName = typeof app.developer === 'string' ? app.developer : app.developer?.name || 'Unknown Developer';

  const handlePurchase = async () => {
    if (step === 'confirm') {
      setStep('payment');
    } else if (step === 'payment') {
      try {
        await onPurchase();
        setStep('success');
      } catch (error) {
        // Error is handled in the parent component
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">
            {step === 'confirm' && 'Purchase Lifetime Access'}
            {step === 'payment' && 'Complete Your Purchase'}
            {step === 'success' && 'Purchase Successful!'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'confirm' && (
            <>
              <div className="flex items-center mb-6">
                <div className="relative w-16 h-16 rounded-md overflow-hidden mr-4">
                  <Image
                    src={imageUrl}
                    alt={app.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold">{app.name}</h3>
                  <p className="text-sm text-muted-foreground">By {developerName}</p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md mb-6">
                <h4 className="font-medium mb-2">What you get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Lifetime access to {app.name}</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>All future updates and improvements</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Developer support</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-between items-center mb-6 pb-6 border-b">
                <span className="text-muted-foreground">One-time payment</span>
                <span className="text-2xl font-bold">{formatCurrency(app.price)}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                By purchasing this app, you agree to our Terms of Service and Privacy Policy.
                This is a one-time payment with no recurring charges.
              </p>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="bg-muted p-4 rounded-md mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span>{app.name}</span>
                  <span>{formatCurrency(app.price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Platform fee</span>
                  <span>Included</span>
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(app.price)}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-4">Payment Method</h4>
                <div className="border rounded-md p-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-3" />
                  <span>Credit/Debit Card (Simulated)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a simulated purchase. No actual payment will be processed.
                </p>
              </div>

              <div className="flex items-center mb-6">
                <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-xs text-muted-foreground">
                  Your payment information is secure and encrypted
                </span>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Thank You for Your Purchase!</h3>
              <p className="text-muted-foreground mb-6">
                You now have lifetime access to {app.name}.
              </p>
              <div className="bg-muted p-4 rounded-md mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Order Summary</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>{app.name}</span>
                  <span>{formatCurrency(app.price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Developer</span>
                  <span>{developerName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          {step === 'confirm' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md mr-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Continue to Payment
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <button
                onClick={() => setStep('confirm')}
                className="px-4 py-2 border rounded-md mr-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={isPurchasing}
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Complete Purchase'
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
