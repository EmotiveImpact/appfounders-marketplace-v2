'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Save, 
  X, 
  Loader2,
  Toggle,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function TesterSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Settings data
  const [settingsData, setSettingsData] = useState({
    notifications: {
      email: {
        newApps: true,
        feedbackResponses: true,
        testRequests: true,
        systemUpdates: false
      },
      inApp: {
        newApps: true,
        feedbackResponses: true,
        testRequests: true,
        systemUpdates: true
      }
    },
    privacy: {
      shareProfileWithDevelopers: true,
      allowAnonymousFeedback: false,
      showTestingActivity: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30m',
      loginNotifications: true
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      highContrastMode: false
    }
  });
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch settings data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchSettingsData();
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchSettingsData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, we would fetch from API
      // For now, we'll use the default settings
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, we would update the settings data from the API response
      // setSettingsData(data);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching settings data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleChange = (category: string, section: string, setting: string) => {
    setSettingsData(prev => {
      const newData = { ...prev };
      // @ts-ignore - Dynamic property access
      newData[category][section][setting] = !newData[category][section][setting];
      return newData;
    });
  };
  
  const handleSelectChange = (category: string, setting: string, value: string) => {
    setSettingsData(prev => {
      const newData = { ...prev };
      // @ts-ignore - Dynamic property access
      newData[category][setting] = value;
      return newData;
    });
  };
  
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, we would send the settings data to the API
      // const response = await fetch('/api/users/settings', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(settingsData)
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to update settings');
      // }
      
      setSuccess('Settings updated successfully');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-xl font-semibold">Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex flex-col space-y-8">
            {/* Notifications Section */}
            <section>
              <div className="flex items-center mb-4">
                <Bell className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-new-apps" className="text-gray-700">New apps available for testing</label>
                    <button 
                      id="email-new-apps"
                      onClick={() => handleToggleChange('notifications', 'email', 'newApps')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.email.newApps ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.email.newApps ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-feedback" className="text-gray-700">Feedback responses</label>
                    <button 
                      id="email-feedback"
                      onClick={() => handleToggleChange('notifications', 'email', 'feedbackResponses')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.email.feedbackResponses ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.email.feedbackResponses ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-test-requests" className="text-gray-700">Test requests</label>
                    <button 
                      id="email-test-requests"
                      onClick={() => handleToggleChange('notifications', 'email', 'testRequests')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.email.testRequests ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.email.testRequests ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-system-updates" className="text-gray-700">System updates</label>
                    <button 
                      id="email-system-updates"
                      onClick={() => handleToggleChange('notifications', 'email', 'systemUpdates')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.email.systemUpdates ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.email.systemUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">In-App Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="inapp-new-apps" className="text-gray-700">New apps available for testing</label>
                    <button 
                      id="inapp-new-apps"
                      onClick={() => handleToggleChange('notifications', 'inApp', 'newApps')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.inApp.newApps ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.inApp.newApps ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="inapp-feedback" className="text-gray-700">Feedback responses</label>
                    <button 
                      id="inapp-feedback"
                      onClick={() => handleToggleChange('notifications', 'inApp', 'feedbackResponses')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.inApp.feedbackResponses ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.inApp.feedbackResponses ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="inapp-test-requests" className="text-gray-700">Test requests</label>
                    <button 
                      id="inapp-test-requests"
                      onClick={() => handleToggleChange('notifications', 'inApp', 'testRequests')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.inApp.testRequests ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.inApp.testRequests ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="inapp-system-updates" className="text-gray-700">System updates</label>
                    <button 
                      id="inapp-system-updates"
                      onClick={() => handleToggleChange('notifications', 'inApp', 'systemUpdates')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.notifications.inApp.systemUpdates ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.notifications.inApp.systemUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Privacy Section */}
            <section>
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Privacy</h2>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="share-profile" className="text-gray-700 font-medium">Share profile with developers</label>
                      <p className="text-sm text-gray-500">Allow developers to see your profile information when you test their apps</p>
                    </div>
                    <button 
                      id="share-profile"
                      onClick={() => handleToggleChange('privacy', 'shareProfileWithDevelopers', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.privacy.shareProfileWithDevelopers ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.privacy.shareProfileWithDevelopers ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="anonymous-feedback" className="text-gray-700 font-medium">Allow anonymous feedback</label>
                      <p className="text-sm text-gray-500">Submit feedback without revealing your identity to developers</p>
                    </div>
                    <button 
                      id="anonymous-feedback"
                      onClick={() => handleToggleChange('privacy', 'allowAnonymousFeedback', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.privacy.allowAnonymousFeedback ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.privacy.allowAnonymousFeedback ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="show-activity" className="text-gray-700 font-medium">Show testing activity</label>
                      <p className="text-sm text-gray-500">Allow other testers to see your testing activity and statistics</p>
                    </div>
                    <button 
                      id="show-activity"
                      onClick={() => handleToggleChange('privacy', 'showTestingActivity', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.privacy.showTestingActivity ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.privacy.showTestingActivity ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Security Section */}
            <section>
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="two-factor" className="text-gray-700 font-medium">Two-factor authentication</label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button 
                      id="two-factor"
                      onClick={() => handleToggleChange('security', 'twoFactorAuth', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.security.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="session-timeout" className="text-gray-700 font-medium">Session timeout</label>
                      <p className="text-sm text-gray-500">Automatically log out after a period of inactivity</p>
                    </div>
                    <select
                      id="session-timeout"
                      value={settingsData.security.sessionTimeout}
                      onChange={(e) => handleSelectChange('security', 'sessionTimeout', e.target.value)}
                      className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="15m">15 minutes</option>
                      <option value="30m">30 minutes</option>
                      <option value="1h">1 hour</option>
                      <option value="4h">4 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="login-notifications" className="text-gray-700 font-medium">Login notifications</label>
                      <p className="text-sm text-gray-500">Receive notifications when someone logs into your account</p>
                    </div>
                    <button 
                      id="login-notifications"
                      onClick={() => handleToggleChange('security', 'loginNotifications', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.security.loginNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.security.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Appearance Section */}
            <section>
              <div className="flex items-center mb-4">
                <Settings className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <select
                      id="theme"
                      value={settingsData.appearance.theme}
                      onChange={(e) => handleSelectChange('appearance', 'theme', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="compact-mode" className="text-gray-700 font-medium">Compact mode</label>
                      <p className="text-sm text-gray-500">Use a more compact layout to fit more content on screen</p>
                    </div>
                    <button 
                      id="compact-mode"
                      onClick={() => handleToggleChange('appearance', 'compactMode', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.appearance.compactMode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="high-contrast" className="text-gray-700 font-medium">High contrast mode</label>
                      <p className="text-sm text-gray-500">Increase contrast for better readability</p>
                    </div>
                    <button 
                      id="high-contrast"
                      onClick={() => handleToggleChange('appearance', 'highContrastMode', '')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settingsData.appearance.highContrastMode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settingsData.appearance.highContrastMode ? 'translate-x-6' : 'translate-x-1'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <Link 
          href="/dashboard/tester/profile" 
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back to Profile
        </Link>
      </div>
    </div>
  );
}
