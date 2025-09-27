'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency, getAppTypeIcon } from '@/lib/utils';
import { ArrowLeft, Star, Check, ChevronRight, CreditCard } from 'lucide-react';

import { useAppDetail } from '@/lib/hooks/useMarketplace';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appSlug = params.id as string;

  const {
    app,
    isLoading,
    error,
    purchaseApp,
    isPurchasing,
    hasUserPurchasedApp,
    refreshApp
  } = useAppDetail(appSlug);
  
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (app && app.image) {
      const imageUrl = typeof app.image === 'string' ? app.image : app.image?.url || '';
      setSelectedImage(imageUrl);
    }
  }, [app]);

  // Handle purchase
  const handlePurchase = async () => {
    try {
      await purchaseApp();
      setPurchaseSuccess(true);
      // Refresh app data to update purchase status
      refreshApp();
      return true;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">App Not Found</h1>
            <p className="mb-6">The app you're looking for doesn't exist or has been removed.</p>
            <Link 
              href="/marketplace" 
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Back to Marketplace
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Get app images
  const mainImage = typeof app.image === 'string' ? app.image : app.image?.url || '';
  const screenshots = app.screenshots || [];
  const allImages = [mainImage, ...screenshots.map((s: any) => s.url || s)].filter(Boolean);
  
  // Get developer info
  const developerName = typeof app.developer === 'string' 
    ? app.developer 
    : app.developer?.name || 'Unknown Developer';
  
  const developerImage = app.developer?.profileImage?.url || app.developer?.profileImage || '';

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container py-8">
          {/* Back button */}
          <Link 
            href="/marketplace" 
            className="inline-flex items-center text-sm mb-6 hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left column - Images */}
            <div>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <Image
                  src={selectedImage || mainImage}
                  alt={app.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 ${
                        selectedImage === image ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`${app.name} screenshot ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column - Details */}
            <div>
              <div className="flex items-center mb-2">
                <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full mr-2">
                  {getAppTypeIcon(app.type)} {app.type}
                </span>
                {app.rating > 0 && (
                  <div className="flex items-center text-yellow-500">
                    <Star className="fill-current h-4 w-4" />
                    <span className="ml-1 text-sm">{app.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2">{app.name}</h1>
              
              <div className="flex items-center mb-6">
                {app.developer && (
                  <>
                    {developerImage && (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                        <Image
                          src={developerImage}
                          alt={developerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      By {developerName}
                    </span>
                  </>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{app.description}</p>

              {app.features && app.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-3">Key Features</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {app.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">One-time payment for lifetime access</p>
                  <p className="text-3xl font-bold">{formatCurrency(app.price)}</p>
                </div>
                
                {hasUserPurchasedApp ? (
                  <div className="px-6 py-3 bg-green-600 text-white rounded-md flex items-center">
                    <Check className="mr-2 h-5 w-5" />
                    Already Purchased
                  </div>
                ) : (
                  <div className="w-64">
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/signin');
                          return;
                        }
                        alert(`Demo: Purchase ${app.name} for ${formatCurrency(app.price)}\n\nThis is a demo - Stripe integration is available but not configured for this demo.`);
                      }}
                      disabled={(user as any)?.role !== 'tester' && isAuthenticated}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Purchase for {formatCurrency(app.price)}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Released on {new Date(app.createdAt || app.releaseDate || Date.now()).toLocaleDateString()}
                </p>
                {app.purchaseCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {app.purchaseCount} {app.purchaseCount === 1 ? 'purchase' : 'purchases'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}
