'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppDetail } from '@/lib/hooks/useMarketplace';
import { ArrowLeft, Send, Bug, Star, Lightbulb, ThumbsUp } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'review' | 'general';

export default function AppFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    app, 
    isLoading: appLoading, 
    error 
  } = useAppDetail(appId);
  
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/dashboard/tester/feedback/${appId}`));
    }
  }, [authLoading, isAuthenticated, router, appId]);
  
  // Handle loading and error states
  if (authLoading || appLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Link href="/dashboard/tester/apps" className="mt-4 inline-block text-blue-500 hover:underline">
            Return to My Apps
          </Link>
        </div>
      </div>
    );
  }
  
  if (!app) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">App Not Found</h2>
          <p className="text-gray-600">The app you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard/tester/apps" className="mt-4 inline-block text-blue-500 hover:underline">
            Return to My Apps
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackText.trim()) {
      setSubmitError('Please enter your feedback');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      setFeedbackText('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get developer info
  const developerName = typeof app.developer === 'string' 
    ? app.developer 
    : app.developer?.name || 'Unknown Developer';
  
  // Get app image
  const appImage = typeof app.image === 'string' ? app.image : app.image?.url || '/placeholder-app.png';
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex">
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Back button */}
            <Link 
              href={`/dashboard/tester/apps/${appId}`}
              className="inline-flex items-center text-sm mb-6 hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App Details
            </Link>
            
            {/* App info */}
            <div className="flex items-center mb-8">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden mr-4">
                <Image
                  src={appImage}
                  alt={app.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{app.name}</h1>
                <p className="text-gray-500">by {developerName}</p>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-6">Submit Feedback</h2>
            
            {/* Feedback type selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFeedbackType('bug')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  feedbackType === 'bug' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Bug className={`h-6 w-6 mb-2 ${feedbackType === 'bug' ? 'text-red-500' : 'text-gray-500'}`} />
                <span>Bug Report</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFeedbackType('feature')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  feedbackType === 'feature' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lightbulb className={`h-6 w-6 mb-2 ${feedbackType === 'feature' ? 'text-purple-500' : 'text-gray-500'}`} />
                <span>Feature Request</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFeedbackType('review')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  feedbackType === 'review' 
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Star className={`h-6 w-6 mb-2 ${feedbackType === 'review' ? 'text-yellow-500' : 'text-gray-500'}`} />
                <span>App Review</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFeedbackType('general')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  feedbackType === 'general' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ThumbsUp className={`h-6 w-6 mb-2 ${feedbackType === 'general' ? 'text-blue-500' : 'text-gray-500'}`} />
                <span>General Feedback</span>
              </button>
            </div>
            
            {/* Feedback form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Share your ${feedbackType} feedback about this app...`}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {submitError}
                </div>
              )}
              
              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  Your feedback has been submitted successfully!
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
