'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface UserWithRole {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}
import { 
  ChevronLeft, 
  Upload, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function CreateAppPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    category: '',
    image: null as File | null,
    screenshots: [] as File[],
    resources: [] as File[],
    status: 'draft'
  });
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    const userWithRole = user as UserWithRole;
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!authLoading && isAuthenticated && userWithRole?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files) {
      if (fieldName === 'image') {
        setFormData(prev => ({ ...prev, [fieldName]: e.target.files?.[0] || null }));
      } else {
        const filesArray = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, [fieldName]: filesArray }));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.image) {
        throw new Error('Please upload an app icon');
      }
      
      // Create FormData object for file uploads
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('status', formData.status);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      formData.screenshots.forEach((file, index) => {
        submitData.append(`screenshots.${index}`, file);
      });
      
      formData.resources.forEach((file, index) => {
        submitData.append(`resources.${index}`, file);
      });
      
      console.log('Submitting app creation form...');
      
      // Submit to API
      const response = await fetch('/api/apps', {
        method: 'POST',
        body: submitData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create app');
      }
      
      const responseData = await response.json();
      console.log('App created successfully:', responseData);
      
      // Redirect to app management page
      router.push('/dashboard/developer/apps');
    } catch (err) {
      console.error('Error creating app:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex">
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Link
                href="/dashboard/developer/apps"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Apps
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold mb-6">Create New App</h1>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md mb-6 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h2 className="text-lg font-medium mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                          App Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="shortDescription" className="block text-sm font-medium mb-1">
                          Short Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="shortDescription"
                          name="shortDescription"
                          value={formData.shortDescription}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="A brief one-line description of your app"
                          maxLength={100}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.shortDescription.length}/100 characters
                        </p>
                      </div>
                      
                      <div>
                        <RichTextEditor
                          label="Full Description"
                          value={formData.description}
                          onChange={handleDescriptionChange}
                          required
                          placeholder="Provide a detailed description of your app, including features, benefits, and use cases..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium mb-1">
                            Price (USD) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium mb-1">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                          >
                            <option value="">Select a category</option>
                            <option value="productivity">Productivity</option>
                            <option value="utilities">Utilities</option>
                            <option value="education">Education</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="social">Social</option>
                            <option value="games">Games</option>
                            <option value="health">Health & Fitness</option>
                            <option value="finance">Finance</option>
                            <option value="business">Business</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Media */}
                  <div>
                    <h2 className="text-lg font-medium mb-4">Media</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="image" className="block text-sm font-medium mb-1">
                          App Icon <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed rounded-md p-4">
                          <div className="flex items-center justify-center">
                            {formData.image ? (
                              <div className="text-center">
                                <p className="text-sm text-gray-500">{formData.image.name}</p>
                                <button
                                  type="button"
                                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer text-center">
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <span className="text-sm font-medium">Click to upload</span>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                <input
                                  type="file"
                                  id="image"
                                  name="image"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, 'image')}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="screenshots" className="block text-sm font-medium mb-1">
                          Screenshots
                        </label>
                        <div className="border-2 border-dashed rounded-md p-4">
                          <div className="flex items-center justify-center">
                            {formData.screenshots.length > 0 ? (
                              <div className="text-center">
                                <p className="text-sm text-gray-500">
                                  {formData.screenshots.length} file(s) selected
                                </p>
                                <button
                                  type="button"
                                  className="mt-2 text-sm text-red-500 hover:text-red-700"
                                  onClick={() => setFormData(prev => ({ ...prev, screenshots: [] }))}
                                >
                                  Remove All
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer text-center">
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <span className="text-sm font-medium">Click to upload screenshots</span>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                                <input
                                  type="file"
                                  id="screenshots"
                                  name="screenshots"
                                  className="hidden"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleFileChange(e, 'screenshots')}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resources */}
                  <div>
                    <h2 className="text-lg font-medium mb-4">Resources</h2>
                    <div>
                      <label htmlFor="resources" className="block text-sm font-medium mb-1">
                        App Resources
                      </label>
                      <div className="border-2 border-dashed rounded-md p-4">
                        <div className="flex items-center justify-center">
                          {formData.resources.length > 0 ? (
                            <div className="text-center">
                              <p className="text-sm text-gray-500">
                                {formData.resources.length} file(s) selected
                              </p>
                              <button
                                type="button"
                                className="mt-2 text-sm text-red-500 hover:text-red-700"
                                onClick={() => setFormData(prev => ({ ...prev, resources: [] }))}
                              >
                                Remove All
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer text-center">
                              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm font-medium">Click to upload resources</span>
                              <p className="text-xs text-gray-500">ZIP, PDF, DOC up to 50MB each</p>
                              <input
                                type="file"
                                id="resources"
                                name="resources"
                                className="hidden"
                                multiple
                                onChange={(e) => handleFileChange(e, 'resources')}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Publishing Options */}
                  <div>
                    <h2 className="text-lg font-medium mb-4">Publishing Options</h2>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="draft">Save as Draft</option>
                        <option value="published">Publish Immediately</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Link
                      href="/dashboard/developer/apps"
                      className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {formData.status === 'published' ? 'Create & Publish App' : 'Create App'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
