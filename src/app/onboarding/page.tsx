'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (user) {
      checkOnboardingStatus();
    }
  }, [user, isAuthenticated, isLoading, router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/onboarding');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.onboarding.completed) {
          // User has already completed onboarding, redirect to dashboard
          router.push(`/dashboard/${user?.role}`);
          return;
        }
        
        setOnboardingData(data.onboarding.data);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (data: any) => {
    // Onboarding completed, redirect will be handled by the flow component
    console.log('Onboarding completed:', data);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <OnboardingFlow
        userRole={user.role as 'developer' | 'tester'}
        userId={user.id}
        initialData={onboardingData}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
