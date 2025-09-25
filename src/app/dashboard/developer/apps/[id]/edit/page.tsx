'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  ChevronLeft, 
  Upload, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface EditAppPageProps {
  params: {
    id: string;
  };
}

export default function EditAppPage({ params }: EditAppPageProps) {
  const appId = params.id;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    category: '',
    status: 'draft',
    platform: '',
    features: [] as string[],
    requirements: [] as string[]
  });
  
  // Current images/files info
  const [currentImages, setCurrentImages] = useState({
    image: '',
    screenshots: [] as string[],
    resources: [] as string[]
  });
  
  // New files to upload
  const [newFiles, setNewFiles] = useState({
    image: null as File | null,
    screenshots: [] as File[],
    resources: [] as File[]
  });
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch app data
  useEffect(() => {
    if (appId && isAuthenticated && !authLoading) {
      fetchAppData();
    }
  }, [appId, isAuthenticated, authLoading]);
  
  const fetchAppData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/apps/${appId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch app data');
      }
      
      const appData = await response.json();
      
      // Set form data
      setFormData({
        name: appData.name || '',
        description: appData.description || '',
        shortDescription: appData.shortDescription || '',
        price: appData.price?.toString() || '',
        category: appData.category || '',
        status: appData.status || 'draft',
        platform: appData.platform || '',
        features: appData.features || [],
        requirements: appData.requirements || []
      });
      
      // Set current images/files
      setCurrentImages({
        image: appData.image || '',
        screenshots: appData.screenshots || [],
        resources: appData.resources || []
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching app data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files) {
      if (fieldName === 'image') {
        setNewFiles(prev => ({ ...prev, image: e.target.files?.[0] || null }));
      } else if (fieldName === 'screenshots') {
        setNewFiles(prev => ({ 
          ...prev, 
          screenshots: [...Array.from(e.target.files || [])]
        }));
      } else if (fieldName === 'resources') {
        setNewFiles(prev => ({ 
          ...prev, 
          resources: [...Array.from(e.target.files || [])]
        }));
      }
    }
  };
  
  const handleArrayInputChange = (index: number, value: string, field: 'features' | 'requirements') => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };
  
  const addArrayItem = (field: 'features' | 'requirements') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };
  
  const removeArrayItem = (index: number, field: 'features' | 'requirements') => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('App name is required');
      }
      
      if (!formData.description.trim()) {
        throw new Error('App description is required');
      }
      
      if (!formData.shortDescription.trim()) {
        throw new Error('Short description is required');
      }
      
      if (!formData.price.trim()) {
        throw new Error('Price is required');
      }
      
      if (!formData.category.trim()) {
        throw new Error('Category is required');
      }
      
      // Create FormData object
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('status', formData.status);
      submitData.append('platform', formData.platform);
      
      // Add features and requirements
      formData.features.forEach((feature, index) => {
        submitData.append(`features[${index}]`, feature);
      });
      
      formData.requirements.forEach((requirement, index) => {
        submitData.append(`requirements[${index}]`, requirement);
      });
      
      // Add current images/files info
      submitData.append('currentImage', currentImages.image);
      currentImages.screenshots.forEach((screenshot, index) => {
        submitData.append(`currentScreenshots[${index}]`, screenshot);
      });
      
      currentImages.resources.forEach((resource, index) => {
        submitData.append(`currentResources[${index}]`, resource);
      });
      
      // Add new files
      if (newFiles.image) {
        submitData.append('image', newFiles.image);
      }
      
      newFiles.screenshots.forEach((screenshot, index) => {
        submitData.append(`screenshots[${index}]`, screenshot);
      });
      
      newFiles.resources.forEach((resource, index) => {
        submitData.append(`resources[${index}]`, resource);
      });
      
      // Send request to API
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'PUT',
        body: submitData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update app');
      }
      
      // Redirect to app management page
      router.push('/dashboard/developer/apps');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the app');
    } finally {
      setIsSubmitting(false);
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
          <div className="mb-6">
            <Link href="/dashboard/developer/apps" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Apps
            </Link>
            <h1 className="text-2xl font-bold mt-2">Edit App</h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  App Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="productivity">Productivity</option>
                  <option value="finance">Finance</option>
                  <option value="social">Social</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health & Fitness</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Short Description* (max 150 characters)
              </label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                maxLength={150}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Full Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price* ($)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a platform</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="web">Web</option>
                  <option value="desktop">Desktop</option>
                  <option value="cross-platform">Cross-platform</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              {formData.features.map((feature, index) => (
                <div key={`feature-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'features')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter a feature"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, 'features')}
                    className="ml-2 p-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('features')}
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Feature
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              {formData.requirements.map((requirement, index) => (
                <div key={`requirement-${index}`} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayInputChange(index, e.target.value, 'requirements')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter a requirement"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(index, 'requirements')}
                    className="ml-2 p-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Requirement
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Icon
              </label>
              {currentImages.image && (
                <div className="mb-2">
                  <p className="text-sm text-gray-500 mb-1">Current icon:</p>
                  <img 
                    src={currentImages.image} 
                    alt="Current app icon" 
                    className="h-16 w-16 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}
              <div className="mt-2">
                <label htmlFor="image" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {currentImages.image ? 'Change Icon' : 'Upload Icon'}
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={(e) => handleFileChange(e, 'image')}
                  accept="image/*"
                  className="hidden"
                />
                {newFiles.image && (
                  <span className="ml-2 text-sm text-gray-500">
                    New icon selected: {newFiles.image.name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screenshots
              </label>
              {currentImages.screenshots.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current screenshots:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentImages.screenshots.map((screenshot, index) => (
                      <img 
                        key={`screenshot-${index}`}
                        src={screenshot} 
                        alt={`Screenshot ${index + 1}`} 
                        className="h-24 object-cover rounded-md border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2">
                <label htmlFor="screenshots" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {currentImages.screenshots.length > 0 ? 'Add More Screenshots' : 'Upload Screenshots'}
                </label>
                <input
                  type="file"
                  id="screenshots"
                  name="screenshots"
                  onChange={(e) => handleFileChange(e, 'screenshots')}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                {newFiles.screenshots.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {newFiles.screenshots.length} new screenshot(s) selected
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resources (APK, IPA, ZIP, etc.)
              </label>
              {currentImages.resources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current resources:</p>
                  <ul className="list-disc pl-5">
                    {currentImages.resources.map((resource, index) => {
                      const resourceName = resource.split('/').pop() || `Resource ${index + 1}`;
                      return (
                        <li key={`resource-${index}`} className="text-sm">
                          {resourceName}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div className="mt-2">
                <label htmlFor="resources" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {currentImages.resources.length > 0 ? 'Add More Resources' : 'Upload Resources'}
                </label>
                <input
                  type="file"
                  id="resources"
                  name="resources"
                  onChange={(e) => handleFileChange(e, 'resources')}
                  multiple
                  className="hidden"
                />
                {newFiles.resources.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {newFiles.resources.length} new resource(s) selected
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Link
                href="/dashboard/developer/apps"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </span>
                ) : (
                  'Update App'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}