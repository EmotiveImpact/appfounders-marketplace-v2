'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PurchaseDetails {
  id: string;
  appName: string;
  appId: string;
  amount: number;
  purchaseDate: string;
  downloadUrl?: string;
}

function PurchaseSuccessContent() {
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams?.get('session_id');
  const appId = searchParams?.get('app');

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      try {
        if (!sessionId && !appId) {
          setError('Missing purchase information');
          return;
        }

        // TODO: Replace with actual API call to fetch purchase details
        // For now, using mock data
        const mockPurchaseDetails: PurchaseDetails = {
          id: sessionId || 'mock_purchase_id',
          appName: 'Sample App',
          appId: appId || 'mock_app_id',
          amount: 2999, // $29.99 in cents
          purchaseDate: new Date().toISOString(),
          downloadUrl: '/api/download/mock_app_id',
        };

        setPurchaseDetails(mockPurchaseDetails);

      } catch (err: any) {
        console.error('Error fetching purchase details:', err);
        setError('Failed to load purchase details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [sessionId, appId]);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-xl">✕</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Purchase Error
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'Unable to load purchase details'}
              </p>
              <Button onClick={() => router.push('/marketplace')} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Return to Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-green-50">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Purchase Successful!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you for your purchase. You now have lifetime access to this app.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Purchase Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Purchase Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">App:</span>
                    <span className="font-medium">{purchaseDetails.appName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatPrice(purchaseDetails.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="font-medium">{formatDate(purchaseDetails.purchaseDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase ID:</span>
                    <span className="font-mono text-xs">{purchaseDetails.id}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {purchaseDetails.downloadUrl && (
                  <Button asChild className="w-full" size="lg">
                    <Link href={purchaseDetails.downloadUrl}>
                      <Download className="mr-2 h-4 w-4" />
                      Download App
                    </Link>
                  </Button>
                )}

                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href={`/marketplace/${purchaseDetails.appId}`}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View App Details
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>

              {/* Additional Information */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>
                  A confirmation email has been sent to your registered email address.
                </p>
                <p className="mt-1">
                  Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  );
}
