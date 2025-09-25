'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

// Define App type
type App = {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: string;
  category: string;
  status: string;
  image: string;
  developer: string;
  createdAt: string;
  updatedAt: string;
};

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get developer ID from session
        const developerId = session?.user?.id;
        const developerEmail = session?.user?.email;
        console.log('Developer ID:', developerId);
        console.log('Developer Email:', developerEmail);
        
        // Fetch apps from API using either ID or email as identifier
        const queryParam = developerId ? `developer=${developerId}` : developerEmail ? `developerEmail=${developerEmail}` : '';
        const response = await fetch(`/api/apps?${queryParam}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch apps');
        }
        
        const data = await response.json();
        console.log('Fetched apps:', data);
        
        if (data && data.docs) {
          setApps(data.docs);
        } else {
          console.warn('Unexpected API response format:', data);
          setApps([]);
        }
      } catch (err) {
        console.error('Error fetching apps:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchApps();
    }
  }, [session]);

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Function to format price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  // Function to get image URL with fallback
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder-app.png';
    
    // Handle relative vs absolute URLs
    return imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL || ''}${imageUrl}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Apps</h1>
        <Link href="/dashboard/developer/apps/create">
          <Button>Create New App</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error && apps.length === 0 ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">You haven't created any apps yet</h2>
          <p className="text-gray-600 mb-6">Get started by creating your first app</p>
          <Link href="/dashboard/developer/apps/create">
            <Button size="lg">Create Your First App</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                <Image
                  src={getImageUrl(app.image)}
                  alt={app.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-app.png';
                  }}
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{app.name}</CardTitle>
                  <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                </div>
                <CardDescription>{formatPrice(app.price)} • {app.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {app.shortDescription || app.description.substring(0, 100) + '...'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/dashboard/developer/apps/${app.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                <Link href={`/dashboard/developer/apps/${app.id}/edit`}>
                  <Button>Edit App</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
