'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Loader2,
  ArrowLeft,
  Upload,
  File,
  FileText,
  Image,
  Film,
  Archive,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  X
} from 'lucide-react';

// Resource type icons mapping
const resourceTypeIcons: { [key: string]: any } = {
  'image': Image,
  'document': FileText,
  'video': Film,
  'archive': Archive,
  'other': File
};

// Get icon component based on file type
const getResourceIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return resourceTypeIcons['image'];
  if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('txt')) return resourceTypeIcons['document'];
  if (fileType.includes('video')) return resourceTypeIcons['video'];
  if (fileType.includes('zip') || fileType.includes('rar')) return resourceTypeIcons['archive'];
  return resourceTypeIcons['other'];
};

export default function ResourcesManagementPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceType, setResourceType] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch app data and resources
  useEffect(() => {
    if (isAuthenticated && !authLoading && appId) {
      fetchAppData();
      fetchResources();
    }
  }, [isAuthenticated, authLoading, appId]);
  
  const fetchAppData = async () => {
    try {
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Set mock data
      setApp({
        id: appId,
        name: 'Super App Pro',
        icon: '/images/app-icon.png',
        description: 'A powerful productivity app for professionals',
        category: 'Productivity',
        platform: 'iOS, Android',
        status: 'published',
        createdAt: '2025-01-15T12:00:00Z',
        updatedAt: '2025-03-01T15:30:00Z'
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching app data');
    }
  };
  
  const fetchResources = async () => {
    try {
      setIsLoading(true);
      
      // Fetch resources from the API
      const response = await fetch(`/api/resources?appId=${appId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      const data = await response.json();
      setResources(data.resources);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching resources');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleResourceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceType(e.target.value);
  };
  
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      // Process each file and create resources via API
      for (const file of selectedFiles) {
        // In a real application, you would upload the file to a storage service
        // and get a URL back. For now, we'll create a fake URL.
        const fileUrl = URL.createObjectURL(file);
        
        // Create resource via API
        const resourceData = {
          appId: appId,
          name: file.name,
          description: '',
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.includes('pdf') || file.type.includes('doc') ? 'document' :
                file.type.includes('video') ? 'video' :
                file.type.includes('zip') || file.type.includes('rar') ? 'archive' : 'other',
          mimeType: file.type,
          size: file.size,
          url: fileUrl
        };
        
        const response = await fetch('/api/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resourceData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create resource');
        }
      }
      
      // Refresh resources list
      await fetchResources();
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading resources');
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Reset state
      setIsUploading(false);
      setSelectedFiles([]);
      setUploadModalOpen(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      // Delete resource via API
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      // Remove the resource from the state
      setResources(prev => prev.filter(resource => resource.id !== resourceId));
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the resource');
    }
  };
  
  // Filter resources based on search query and type
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = resourceType === 'all' || resource.type === resourceType;
    return matchesSearch && matchesType;
  });
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href={`/dashboard/developer/apps/${appId}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to App
            </Link>
            
            {app && (
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 mr-4 overflow-hidden">
                  {app.icon && (
                    <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{app.name} Resources</h1>
                  <p className="text-gray-600 mt-1">
                    Manage documentation, images, and other resources for your app
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                {/* Filter by type */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={resourceType}
                    onChange={handleResourceTypeChange}
                  >
                    <option value="all">All Types</option>
                    <option value="document">Documents</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="archive">Archives</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              {/* Upload button */}
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Resources
              </button>
            </div>
          </div>
          
          {/* Resources list */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredResources.length === 0 ? (
              <div className="p-8 text-center">
                <File className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resources</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || resourceType !== 'all' ? 
                    'No resources match your search criteria.' : 
                    'Get started by uploading resources for your app.'}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Resources
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Added
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResources.map((resource) => {
                      const IconComponent = getResourceIcon(resource.mimeType);
                      
                      return (
                        <tr key={resource.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                                <IconComponent className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                                <div className="text-sm text-gray-500">{resource.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(resource.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(resource.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <a
                                href={resource.url}
                                download={resource.name}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Download className="h-5 w-5" />
                              </a>
                              <button
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Upload Modal */}
          {uploadModalOpen && (
            <div className="fixed inset-0 overflow-y-auto z-50">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => setUploadModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Upload Resources
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Select files to upload as resources for your app. You can upload documents, images, videos, and more.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                    
                    {selectedFiles.length === 0 ? (
                      <div 
                        onClick={handleFileSelect}
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500"
                      >
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <p className="pl-1">Click to select files or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, PNG, JPG, GIF, MP4, ZIP up to 10MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <div className="mb-2 flex justify-between items-center">
                          <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
                          <button 
                            onClick={handleFileSelect}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Add More
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 rounded-md">
                                  {getResourceIcon(file.type)({ className: "h-5 w-5 text-gray-600" })}
                                </div>
                                <div className="ml-3 flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                  <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isUploading && (
                      <div className="mt-4">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                                Uploading
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-indigo-600">
                                {uploadProgress}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                            <div 
                              style={{ width: `${uploadProgress}%` }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleUpload}
                      disabled={isUploading || selectedFiles.length === 0}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setUploadModalOpen(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}