'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  Camera, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { updateMockUserProfile } from '@/lib/auth/mock-auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Load user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
      });
      
      if (user.avatar) {
        // If avatar is an object with url property
        if (typeof user.avatar === 'object' && user.avatar.url) {
          setAvatarPreview(user.avatar.url);
        } 
        // If avatar is a string (URL)
        else if (typeof user.avatar === 'string') {
          setAvatarPreview(user.avatar);
        }
      }
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setAvatarPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Check if we're in development mode using mock auth
      if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true') {
        // For development mode, use mock profile update
        const updates: any = {
          name: formData.name,
          bio: formData.bio,
        };
        
        // If there's a new avatar, use the data URL as the avatar
        if (avatarPreview && avatarFile) {
          updates.avatar = avatarPreview;
        }
        
        const result = await updateMockUserProfile(updates);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update profile');
        }
        
        // Update cookie for middleware
        if (user) {
          document.cookie = `auth-user=${JSON.stringify({
            ...user,
            name: formData.name,
            bio: formData.bio,
            avatar: avatarPreview,
          })}; path=/; max-age=86400`;
        }
        
        setSuccessMessage('Profile updated successfully');
        
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh();
        }, 1500);
        
        return;
      }
      
      // For production mode, use Supabase
      // Update profile information via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          bio: formData.bio,
        },
      });
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Upload avatar if changed
      if (avatarFile) {
        // Create a unique file path
        const filePath = `avatars/${user?.id}/${Date.now()}-${avatarFile.name}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, avatarFile);
        
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Continue even if avatar upload fails
        } else {
          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(filePath);
          
          if (publicUrlData?.publicUrl) {
            // Update user with avatar URL
            await supabase.auth.updateUser({
              data: {
                avatar: publicUrlData.publicUrl,
              },
            });
          }
        }
      }
      
      setSuccessMessage('Profile updated successfully');
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Use AuthGuard to protect this page
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <p className="text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative">
                <div 
                  className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  {avatarPreview ? (
                    <Image 
                      src={avatarPreview} 
                      alt="Profile avatar" 
                      width={96} 
                      height={96} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 shadow-md"
                  onClick={handleAvatarClick}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <div className="flex-1 w-full">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Tell us a bit about yourself"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
