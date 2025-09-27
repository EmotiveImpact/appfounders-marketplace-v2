'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppDetail } from '@/lib/hooks/useMarketplace';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  FileText, 
  Github, 
  Globe, 
  Package, 
  Info
} from 'lucide-react';

export default function TesterAppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    app, 
    isLoading: appLoading, 
    error: appError, 
    hasUserPurchasedApp
  } = useAppDetail(appId);
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!authLoading && isAuthenticated && (user as any)?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Redirect if user hasn't purchased this app
  useEffect(() => {
    if (!authLoading && !appLoading && isAuthenticated && !hasUserPurchasedApp) {
      router.push('/dashboard/tester');
    }
  }, [authLoading, appLoading, isAuthenticated, hasUserPurchasedApp, router]);
  
  if (authLoading || appLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }
  
  if (appError || !app) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">App Not Found</h1>
            <p className="mb-6">The app you're looking for doesn't exist or has been removed.</p>
            <Link 
              href="/dashboard/tester" 
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  // Get developer info
  const developerName = typeof app.developer === 'string' 
    ? app.developer 
    : app.developer?.name || 'Unknown Developer';
  
  // Get app image
  const appImage = typeof app.image === 'string' ? app.image : app.image?.url || '/placeholder-app.png';
  
  // Mock resources - in a real app, these would come from the backend
  const resources = [
    {
      type: 'download',
      name: 'App Installer',
      description: 'Download the latest version of the app',
      icon: <Download className="h-5 w-5" />,
      url: '#'
    },
    {
      type: 'documentation',
      name: 'User Guide',
      description: 'Learn how to use all features of the app',
      icon: <FileText className="h-5 w-5" />,
      url: '#'
    },
    {
      type: 'website',
      name: 'App Website',
      description: 'Visit the official website for more information',
      icon: <Globe className="h-5 w-5" />,
      url: '#'
    },
    {
      type: 'github',
      name: 'GitHub Repository',
      description: 'Access the source code and contribute',
      icon: <Github className="h-5 w-5" />,
      url: '#'
    }
  ];
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Back button */}
            <Link 
              href="/dashboard/tester" 
              className="inline-flex items-center text-sm mb-6 hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Apps
            </Link>
            
            {/* App header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={appImage}
                  alt={app.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">{app.name}</h1>
                <p className="text-muted-foreground mb-4">By {developerName}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {app.type || 'App'}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Version {app.version || '1.0.0'}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Released {formatDate(app.releaseDate || app.createdAt)}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/dashboard/tester/feedback/${app.id}`)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Provide Feedback
                  </button>
                </div>
              </div>
            </div>
            
            {/* App description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About This App</h2>
              <p className="text-muted-foreground whitespace-pre-line">{app.description}</p>
            </div>
            
            {/* Resources */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Resources</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md mr-4">
                        {resource.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{resource.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                        <a 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium inline-flex items-center hover:underline"
                        >
                          Access Resource
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {resources.length === 0 && (
                <div className="border rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="font-medium mb-2">No Resources Available</h3>
                  <p className="text-muted-foreground text-sm">
                    The developer hasn't added any resources for this app yet.
                  </p>
                </div>
              )}
            </div>
            
            {/* Support information */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md mr-4">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you're experiencing issues with this app or have questions, you can contact the developer directly.
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/tester/feedback/${app.id}`)}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm"
                  >
                    Contact Developer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
