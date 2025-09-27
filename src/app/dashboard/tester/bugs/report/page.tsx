'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserPurchases, useCreateBug } from '@/lib/hooks/usePayloadAPI';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function BugReportPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: purchases, loading: purchasesLoading } = useUserPurchases();
  const { execute: createBug, loading: submitting, error: submitError } = useCreateBug();
  
  // Form state
  const [selectedApp, setSelectedApp] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [steps, setSteps] = useState(['']);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [platform, setPlatform] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [browser, setBrowser] = useState('');
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Fetch purchases on initial load
  useEffect(() => {
    if (isAuthenticated && user && !purchases && !purchasesLoading) {
      // fetchPurchases(); // Removed since fetchPurchases doesn't exist
    }
  }, [isAuthenticated, user, purchases, purchasesLoading]);
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!authLoading && isAuthenticated && (user as any)?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Handle adding a new step
  const addStep = () => {
    setSteps([...steps, '']);
  };
  
  // Handle removing a step
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };
  
  // Handle updating a step
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedApp) newErrors.app = 'Please select an app';
    if (!title.trim()) newErrors.title = 'Please enter a title';
    if (!description.trim()) newErrors.description = 'Please enter a description';
    if (!severity) newErrors.severity = 'Please select a severity level';
    
    // Check if at least one step is filled
    if (steps.length === 0 || !steps[0].trim()) {
      newErrors.steps = 'Please add at least one step to reproduce';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Format steps to match the Payload CMS schema
      const formattedSteps = steps
        .filter(step => step.trim())
        .map(step => ({ step }));
      
      // Create bug report
      await createBug({
        data: {
          title,
          description,
          app: selectedApp,
          severity,
          stepsToReproduce: formattedSteps,
          expectedBehavior,
          actualBehavior,
          environment: {
            platform,
            version: appVersion,
            deviceModel,
            osVersion,
            browser,
          },
          // reportedBy will be set on the server based on the authenticated user
        },
      });
      
      // Show success message and reset form
      setSubmitSuccess(true);
      
      // Reset form
      setSelectedApp('');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setSteps(['']);
      setExpectedBehavior('');
      setActualBehavior('');
      setPlatform('');
      setAppVersion('');
      setDeviceModel('');
      setOsVersion('');
      setBrowser('');
      
      // Redirect to bugs list after a short delay
      setTimeout(() => {
        router.push('/dashboard/tester/bugs');
      }, 2000);
    } catch (error) {
      console.error('Error submitting bug report:', error);
    }
  };
  
  // Loading state - only show loading if there's no error
  if ((authLoading || purchasesLoading) && !submitError) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }
  
  // No purchased apps
  const availableApps = purchases?.docs || [];
  if (availableApps.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
            </div>
            
            <h1 className="text-3xl font-bold mb-6">Report a Bug</h1>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">No apps available</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to purchase apps from the marketplace before you can report bugs.
                  </p>
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Browse Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>
          
          <h1 className="text-3xl font-bold mb-6">Report a Bug</h1>
          
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-green-800">
                Bug report submitted successfully! Redirecting...
              </p>
            </div>
          )}
          
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">
                Error submitting bug report: {submitError.message}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* App Selection */}
            <div>
              <label htmlFor="app" className="block text-sm font-medium text-gray-700 mb-1">
                App <span className="text-red-500">*</span>
              </label>
              <select
                id="app"
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className={`w-full p-2 border rounded-md ${errors.app ? 'border-red-500' : 'border-gray-300'}`}
                disabled={submitting}
              >
                <option value="">Select an app</option>
                {availableApps.map((purchase: any) => (
                  <option key={purchase.app.id} value={purchase.app.id}>
                    {purchase.app.name}
                  </option>
                ))}
              </select>
              {errors.app && <p className="text-red-500 text-sm mt-1">{errors.app}</p>}
            </div>
            
            {/* Bug Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Bug Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Brief description of the bug"
                disabled={submitting}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            {/* Bug Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Bug Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-2 border rounded-md h-24 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Detailed description of the bug"
                disabled={submitting}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            {/* Severity */}
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className={`w-full p-2 border rounded-md ${errors.severity ? 'border-red-500' : 'border-gray-300'}`}
                disabled={submitting}
              >
                <option value="critical">Critical - App crashes or data loss</option>
                <option value="high">High - Major feature broken</option>
                <option value="medium">Medium - Feature works incorrectly</option>
                <option value="low">Low - Minor visual or UX issue</option>
              </select>
              {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity}</p>}
            </div>
            
            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Steps to Reproduce <span className="text-red-500">*</span>
              </label>
              {steps.map((step, index) => (
                <div key={index} className="flex items-center mb-2">
                  <span className="mr-2 text-sm text-gray-500">{index + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    className={`flex-1 p-2 border rounded-md ${errors.steps && index === 0 ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={`Step ${index + 1}`}
                    disabled={submitting}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={submitting}
              >
                + Add Step
              </button>
              {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps}</p>}
            </div>
            
            {/* Expected Behavior */}
            <div>
              <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Behavior
              </label>
              <textarea
                id="expectedBehavior"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md h-20"
                placeholder="What should happen when the steps are followed"
                disabled={submitting}
              />
            </div>
            
            {/* Actual Behavior */}
            <div>
              <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                Actual Behavior
              </label>
              <textarea
                id="actualBehavior"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md h-20"
                placeholder="What actually happens when the steps are followed"
                disabled={submitting}
              />
            </div>
            
            {/* Environment Information */}
            <div>
              <h3 className="text-md font-medium mb-3">Environment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={submitting}
                  >
                    <option value="">Select platform</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                    <option value="web">Web</option>
                    <option value="mac">Mac</option>
                    <option value="pc">PC</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="appVersion" className="block text-sm font-medium text-gray-700 mb-1">
                    App Version
                  </label>
                  <input
                    type="text"
                    id="appVersion"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g. 1.2.3"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-700 mb-1">
                    Device Model
                  </label>
                  <input
                    type="text"
                    id="deviceModel"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g. iPhone 13, Samsung Galaxy S21"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="osVersion" className="block text-sm font-medium text-gray-700 mb-1">
                    OS Version
                  </label>
                  <input
                    type="text"
                    id="osVersion"
                    value={osVersion}
                    onChange={(e) => setOsVersion(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g. iOS 15.4, Android 12"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="browser" className="block text-sm font-medium text-gray-700 mb-1">
                    Browser (if applicable)
                  </label>
                  <input
                    type="text"
                    id="browser"
                    value={browser}
                    onChange={(e) => setBrowser(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g. Chrome 98, Safari 15"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Bug Report'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}