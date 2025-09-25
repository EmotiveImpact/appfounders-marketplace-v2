'use client';

import { useEffect } from 'react';
import { useAppDetail } from '@/lib/hooks/useMarketplace';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AppDetailPageProps {
  params: {
    id: string;
  };
}

export default function TestAppDetailPage({ params }: AppDetailPageProps) {
  const { id } = params;
  const { 
    app, 
    isLoading, 
    error, 
    purchaseApp, 
    isPurchasing, 
    hasUserPurchasedApp,
    refreshApp
  } = useAppDetail(id);
  
  const { user, isAuthenticated } = useAuth();
  
  // Fetch app details on initial load
  useEffect(() => {
    refreshApp();
  }, [refreshApp]);
  
  // Handle purchase
  const handlePurchase = async () => {
    try {
      await purchaseApp();
      alert('Purchase successful!');
      refreshApp();
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Link href="/test-marketplace" className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} />
        <span>Back to Marketplace</span>
      </Link>
      
      {/* User info */}
      <div className="bg-muted p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-2">User Info</h2>
        {isAuthenticated ? (
          <div>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-destructive/20 p-4 rounded-lg mb-8">
          <p className="text-destructive">Error: {error.message}</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <p>Loading app details...</p>
        </div>
      )}
      
      {/* App details */}
      {app && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{app.name}</CardTitle>
                <CardDescription className="text-lg">
                  By {app.developer?.name || 'Unknown Developer'}
                </CardDescription>
              </div>
              <Badge className="text-sm">{app.category}</Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{app.description}</p>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Price</h3>
                  <p className="text-2xl font-bold">${app.price?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold">Purchases</h3>
                  <p className="text-2xl font-bold text-center">{app.purchaseCount || 0}</p>
                </div>
              </div>
              
              {app.features && (
                <>
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Features</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {app.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            {user?.role === 'tester' ? (
              hasUserPurchasedApp ? (
                <div className="w-full">
                  <Button disabled className="w-full mb-2">Already Purchased</Button>
                  <p className="text-center text-sm text-muted-foreground">
                    You have lifetime access to this app
                  </p>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? 'Processing...' : `Purchase for $${app.price?.toFixed(2) || '0.00'}`}
                </Button>
              )
            ) : (
              <Button disabled className="w-full">
                {user?.role === 'developer' ? 'Developers Cannot Purchase' : 'Login as Tester to Purchase'}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
