'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Loader2,
  Upload,
  Camera
} from 'lucide-react';
import Image from 'next/image';

export default function TesterProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState<any>({
    name: '',
    email: '',
    bio: '',
    location: '',
    interests: [],
    devices: [],
    joinedDate: '',
    avatar: null
  });
  
  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    interests: '',
    devices: ''
  });
  
  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Redirect if not authenticated or not a tester
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    } else if (!authLoading && isAuthenticated && user?.role !== 'tester') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);
  
  // Fetch profile data
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchProfileData();
    }
  }, [isAuthenticated, authLoading]);
  
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch profile data from API
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      
      // Set profile data
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        bio: data.bio || '',
        location: data.location || '',
        interests: data.interests || [],
        devices: data.devices || [],
        joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '',
        avatar: data.avatar?.url || null
      });
      
      // Initialize form data
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        location: data.location || '',
        interests: data.interests ? data.interests.join(', ') : '',
        devices: data.devices ? data.devices.join(', ') : ''
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching profile data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Convert comma-separated strings to arrays
      const interests = formData.interests.split(',').map(item => item.trim()).filter(Boolean);
      const devices = formData.devices.split(',').map(item => item.trim()).filter(Boolean);
      
      // Update profile data
      const profileResponse = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          interests,
          devices
        })
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const avatarResponse = await fetch('/api/users/avatar', {
          method: 'POST',
          body: formData
        });
        
        if (!avatarResponse.ok) {
          throw new Error('Failed to upload avatar');
        }
      }
      
      // Refresh profile data
      await fetchProfileData();
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    // Reset form data to current profile data
    setFormData({
      name: profileData.name || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      interests: profileData.interests ? profileData.interests.join(', ') : '',
      devices: profileData.devices ? profileData.devices.join(', ') : ''
    });
    
    // Reset avatar preview
    setAvatarPreview(null);
    setAvatarFile(null);
    
    // Exit edit mode
    setIsEditing(false);
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-xl font-semibold">Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Tester Profile</h1>
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
                <Save className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar section */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100">
                {isEditing && avatarPreview ? (
                  <Image 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    fill
                    className="object-cover"
                  />
                ) : profileData.avatar ? (
                  <Image 
                    src={profileData.avatar} 
                    alt="User avatar" 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-indigo-50">
                    <User className="h-20 w-20 text-indigo-300" />
                  </div>
                )}
                
                {isEditing && (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <h2 className="text-xl font-semibold">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.email}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {profileData.joinedDate}
                </p>
              </div>
            </div>
            
            {/* Profile details */}
            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                        Interests (comma separated)
                      </label>
                      <input
                        type="text"
                        id="interests"
                        name="interests"
                        value={formData.interests}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g. Gaming, Productivity, Social Media"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="devices" className="block text-sm font-medium text-gray-700">
                        Devices (comma separated)
                      </label>
                      <input
                        type="text"
                        id="devices"
                        name="devices"
                        value={formData.devices}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g. iPhone 13, MacBook Pro, iPad Air"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
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
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </button>
                  </div>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Bio</h3>
                      <p className="mt-1 text-gray-600">
                        {profileData.bio || 'No bio provided'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Location</h3>
                      <p className="mt-1 text-gray-600">
                        {profileData.location || 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Interests</h3>
                      {profileData.interests && profileData.interests.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profileData.interests.map((interest: string, index: number) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-gray-600">No interests specified</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Devices</h3>
                      {profileData.devices && profileData.devices.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profileData.devices.map((device: string, index: number) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                            >
                              {device}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-gray-600">No devices specified</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Testing Stats Card */}
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Testing Statistics</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">Apps Tested</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">12</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">Feedback Submitted</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">47</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">Developer Responses</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">31</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
