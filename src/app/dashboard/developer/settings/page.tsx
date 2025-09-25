'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Loader2,
  User,
  CreditCard,
  Bell,
  Shield,
  Key,
  Globe,
  Save,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

export default function DeveloperSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    profile: {
      companyName: '',
      website: '',
      bio: '',
      contactEmail: '',
      contactPhone: ''
    },
    payment: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      paypalEmail: '',
      preferredMethod: 'bank'
    },
    notifications: {
      emailNotifications: true,
      salesNotifications: true,
      feedbackNotifications: true,
      marketingNotifications: false,
      appUpdatesNotifications: true
    },
    security: {
      twoFactorEnabled: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    developer: {
      apiKey: 'sk_dev_12345678901234567890',
      webhookUrl: '',
      ipWhitelist: [''],
      developerMode: false
    }
  });
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch user settings
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchUserSettings();
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock data
      setFormData({
        profile: {
          companyName: 'Acme Development Studios',
          website: 'https://acmedev.example.com',
          bio: 'We create innovative applications for productivity and entertainment.',
          contactEmail: 'contact@acmedev.example.com',
          contactPhone: '+1 (555) 123-4567'
        },
        payment: {
          accountName: 'Acme Development LLC',
          accountNumber: '************1234',
          bankName: 'First National Bank',
          routingNumber: '******789',
          paypalEmail: 'payments@acmedev.example.com',
          preferredMethod: 'bank'
        },
        notifications: {
          emailNotifications: true,
          salesNotifications: true,
          feedbackNotifications: true,
          marketingNotifications: false,
          appUpdatesNotifications: true
        },
        security: {
          twoFactorEnabled: true,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        },
        developer: {
          apiKey: 'sk_dev_12345678901234567890',
          webhookUrl: 'https://api.acmedev.example.com/webhooks/appfounders',
          ipWhitelist: ['192.168.1.1', '10.0.0.1'],
          developerMode: true
        }
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching user settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };
  
  const handleCheckboxChange = (section: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: !prev[section as keyof typeof prev][field as keyof typeof prev[keyof typeof prev]]
      }
    }));
  };
  
  const handleAddIPAddress = () => {
    const ipWhitelist = [...formData.developer.ipWhitelist, ''];
    handleInputChange('developer', 'ipWhitelist', ipWhitelist);
  };
  
  const handleRemoveIPAddress = (index: number) => {
    const ipWhitelist = [...formData.developer.ipWhitelist];
    ipWhitelist.splice(index, 1);
    handleInputChange('developer', 'ipWhitelist', ipWhitelist);
  };
  
  const handleIPAddressChange = (index: number, value: string) => {
    const ipWhitelist = [...formData.developer.ipWhitelist];
    ipWhitelist[index] = value;
    handleInputChange('developer', 'ipWhitelist', ipWhitelist);
  };
  
  const handleGenerateNewAPIKey = async () => {
    try {
      setIsSaving(true);
      
      // In a real application, you would call your API to generate a new key
      // For now, we'll simulate it
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock API key
      const newApiKey = 'sk_dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      handleInputChange('developer', 'apiKey', newApiKey);
      setSuccessMessage('New API key generated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating a new API key');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate password fields if they are filled
      if (activeTab === 'security' && 
          (formData.security.newPassword || formData.security.confirmPassword)) {
        
        if (!formData.security.currentPassword) {
          throw new Error('Current password is required');
        }
        
        if (formData.security.newPassword !== formData.security.confirmPassword) {
          throw new Error('New password and confirmation do not match');
        }
        
        if (formData.security.newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long');
        }
      }
      
      // In a real application, you would send this data to your API
      // For now, we'll simulate it
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSuccessMessage('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Clear password fields
      if (activeTab === 'security') {
        setFormData(prev => ({
          ...prev,
          security: {
            ...prev.security,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        }));
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Developer Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-5 w-5 inline-block mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => handleTabChange('payment')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'payment'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5 inline-block mr-2" />
                  Payment
                </button>
                <button
                  onClick={() => handleTabChange('notifications')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'notifications'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Bell className="h-5 w-5 inline-block mr-2" />
                  Notifications
                </button>
                <button
                  onClick={() => handleTabChange('security')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'security'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Shield className="h-5 w-5 inline-block mr-2" />
                  Security
                </button>
                <button
                  onClick={() => handleTabChange('developer')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'developer'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Key className="h-5 w-5 inline-block mr-2" />
                  Developer
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-500">
                    Update your company information and public profile.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.profile.companyName}
                        onChange={(e) => handleInputChange('profile', 'companyName', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          <Globe className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          id="website"
                          className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="https://example.com"
                          value={formData.profile.website}
                          onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Company Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Brief description of your company"
                        value={formData.profile.bio}
                        onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                      ></textarea>
                      <p className="mt-2 text-sm text-gray-500">
                        Brief description of your company. This will be displayed on your public profile.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        id="contactEmail"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.profile.contactEmail}
                        onChange={(e) => handleInputChange('profile', 'contactEmail', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        id="contactPhone"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.profile.contactPhone}
                        onChange={(e) => handleInputChange('profile', 'contactPhone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
                  <p className="text-sm text-gray-500">
                    Update your payment details for receiving funds from app sales.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        id="bank"
                        name="paymentMethod"
                        type="radio"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        checked={formData.payment.preferredMethod === 'bank'}
                        onChange={() => handleInputChange('payment', 'preferredMethod', 'bank')}
                      />
                      <label htmlFor="bank" className="block text-sm font-medium text-gray-700">
                        Bank Account (Direct Deposit)
                      </label>
                    </div>
                    
                    {formData.payment.preferredMethod === 'bank' && (
                      <div className="ml-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            id="accountName"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.payment.accountName}
                            onChange={(e) => handleInputChange('payment', 'accountName', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                            Account Number
                          </label>
                          <input
                            type="text"
                            id="accountNumber"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.payment.accountNumber}
                            onChange={(e) => handleInputChange('payment', 'accountNumber', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                            Bank Name
                          </label>
                          <input
                            type="text"
                            id="bankName"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.payment.bankName}
                            onChange={(e) => handleInputChange('payment', 'bankName', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
                            Routing Number
                          </label>
                          <input
                            type="text"
                            id="routingNumber"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.payment.routingNumber}
                            onChange={(e) => handleInputChange('payment', 'routingNumber', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 mt-4">
                      <input
                        id="paypal"
                        name="paymentMethod"
                        type="radio"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        checked={formData.payment.preferredMethod === 'paypal'}
                        onChange={() => handleInputChange('payment', 'preferredMethod', 'paypal')}
                      />
                      <label htmlFor="paypal" className="block text-sm font-medium text-gray-700">
                        PayPal
                      </label>
                    </div>
                    
                    {formData.payment.preferredMethod === 'paypal' && (
                      <div className="ml-7">
                        <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700">
                          PayPal Email
                        </label>
                        <input
                          type="email"
                          id="paypalEmail"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.payment.paypalEmail}
                          onChange={(e) => handleInputChange('payment', 'paypalEmail', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md mt-6">
                    <h3 className="text-sm font-medium text-gray-900">Payment Schedule</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Payments are processed on the 1st and 15th of each month for the previous period's sales.
                      There is a minimum payout threshold of $50.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500">
                    Manage how and when you receive notifications.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="emailNotifications"
                          name="emailNotifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.notifications.emailNotifications}
                          onChange={() => handleCheckboxChange('notifications', 'emailNotifications')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                          Email Notifications
                        </label>
                        <p className="text-gray-500">Receive notifications via email.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="salesNotifications"
                          name="salesNotifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.notifications.salesNotifications}
                          onChange={() => handleCheckboxChange('notifications', 'salesNotifications')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="salesNotifications" className="font-medium text-gray-700">
                          Sales Notifications
                        </label>
                        <p className="text-gray-500">Receive notifications when your apps are purchased.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="feedbackNotifications"
                          name="feedbackNotifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.notifications.feedbackNotifications}
                          onChange={() => handleCheckboxChange('notifications', 'feedbackNotifications')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="feedbackNotifications" className="font-medium text-gray-700">
                          Feedback Notifications
                        </label>
                        <p className="text-gray-500">Receive notifications when users leave feedback on your apps.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="marketingNotifications"
                          name="marketingNotifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.notifications.marketingNotifications}
                          onChange={() => handleCheckboxChange('notifications', 'marketingNotifications')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="marketingNotifications" className="font-medium text-gray-700">
                          Marketing Notifications
                        </label>
                        <p className="text-gray-500">Receive marketing and promotional emails.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="appUpdatesNotifications"
                          name="appUpdatesNotifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.notifications.appUpdatesNotifications}
                          onChange={() => handleCheckboxChange('notifications', 'appUpdatesNotifications')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="appUpdatesNotifications" className="font-medium text-gray-700">
                          Platform Updates
                        </label>
                        <p className="text-gray-500">Receive notifications about platform updates and changes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                  <p className="text-sm text-gray-500">
                    Manage your account security and password.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="twoFactorEnabled"
                          name="twoFactorEnabled"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.security.twoFactorEnabled}
                          onChange={() => handleCheckboxChange('security', 'twoFactorEnabled')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="twoFactorEnabled" className="font-medium text-gray-700">
                          Two-Factor Authentication
                        </label>
                        <p className="text-gray-500">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                      
                      <div className="mt-4 grid grid-cols-1 gap-6">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="currentPassword"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.security.currentPassword}
                            onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.security.newPassword}
                            onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.security.confirmPassword}
                            onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Developer Settings */}
              {activeTab === 'developer' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Developer Settings</h2>
                  <p className="text-sm text-gray-500">
                    Manage your API keys and developer options.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                        API Key
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          id="apiKey"
                          readOnly
                          className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.developer.apiKey}
                        />
                        <button
                          type="button"
                          onClick={handleGenerateNewAPIKey}
                          disabled={isSaving}
                          className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Generate New'
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your API key provides access to the AppFounders API. Keep it secure and never share it publicly.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
                        Webhook URL
                      </label>
                      <input
                        type="text"
                        id="webhookUrl"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="https://your-domain.com/webhook"
                        value={formData.developer.webhookUrl}
                        onChange={(e) => handleInputChange('developer', 'webhookUrl', e.target.value)}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        We'll send notifications to this URL when events occur (e.g., new purchases, feedback).
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        IP Whitelist
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Restrict API access to these IP addresses only. Leave empty to allow all IPs.
                      </p>
                      
                      <div className="space-y-2">
                        {formData.developer.ipWhitelist.map((ip, index) => (
                          <div key={index} className="flex rounded-md shadow-sm">
                            <input
                              type="text"
                              className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="192.168.1.1"
                              value={ip}
                              onChange={(e) => handleIPAddressChange(index, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveIPAddress(index)}
                              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={handleAddIPAddress}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add IP Address
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="developerMode"
                          name="developerMode"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.developer.developerMode}
                          onChange={() => handleCheckboxChange('developer', 'developerMode')}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="developerMode" className="font-medium text-gray-700">
                          Developer Mode
                        </label>
                        <p className="text-gray-500">
                          Enable developer mode to access additional debugging features and detailed error messages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Save Button */}
              <div className="mt-6 pt-5 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}