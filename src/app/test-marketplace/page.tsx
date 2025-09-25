'use client';

import { useState, useEffect } from 'react';
import { useMarketplace } from '@/lib/hooks/useMarketplace';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestMarketplacePage() {
  const { 
    apps, 
    isLoading, 
    error, 
    filters, 
    updateFilters, 
    resetFilters,
    purchaseApp,
    isPurchasing,
    hasUserPurchasedApp
  } = useMarketplace();
  
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  
  // Fetch apps on initial load
  useEffect(() => {
    const loadApps = async () => {
      await resetFilters();
    };
    
    loadApps();
  }, [resetFilters]);
  
  // Handle search
  const handleSearch = async () => {
    await updateFilters({ search: searchTerm });
  };
  
  // Handle category filter
  const handleCategoryChange = async (value: string) => {
    setCategory(value);
    await updateFilters({ category: value });
  };
  
  // Handle purchase
  const handlePurchase = async (appId: string) => {
    try {
      await purchaseApp(appId);
      alert('Purchase successful!');
    } catch (error: any) {
      alert(`Purchase failed: ${error.message}`);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test Marketplace</h1>
      
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
      
      {/* Search and filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="utility">Utility</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="education">Education</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={() => resetFilters()}>
          Reset Filters
        </Button>
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
          <p>Loading apps...</p>
        </div>
      )}
      
      {/* Apps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app: any) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{app.name}</CardTitle>
                  <CardDescription>{app.developer?.name}</CardDescription>
                </div>
                <Badge>{app.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
              <p className="font-bold">${app.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter>
              {user?.role === 'tester' ? (
                hasUserPurchasedApp(app.id) ? (
                  <Button disabled className="w-full">Already Purchased</Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(app.id)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? 'Processing...' : 'Purchase'}
                  </Button>
                )
              ) : (
                <Button disabled className="w-full">
                  {user?.role === 'developer' ? 'Developers Cannot Purchase' : 'Login as Tester to Purchase'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* No results */}
      {!isLoading && apps.length === 0 && (
        <div className="text-center py-8">
          <p>No apps found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
