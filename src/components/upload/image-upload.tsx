'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Crop, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ImageUploadProps {
  category: string;
  appId?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadedFile {
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface ImageWithProgress {
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const DEFAULT_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({
  category,
  appId,
  maxFiles = 5,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  onUploadComplete,
  onUploadError,
  className = '',
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use PNG, JPEG, or WebP.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }

    return null;
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Validate all files first
    for (const file of acceptedFiles) {
      const error = validateImage(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
    }

    const newImages: ImageWithProgress[] = [];
    
    // Create previews for all files
    for (const file of acceptedFiles) {
      const preview = await createImagePreview(file);
      newImages.push({
        file,
        preview,
        progress: 0,
        status: 'uploading',
      });
    }

    setImages(prev => [...prev, ...newImages]);
    setIsUploading(true);

    try {
      // Upload all images
      const uploadPromises = newImages.map((imageWithProgress, index) => 
        uploadImage(imageWithProgress, images.length + index)
      );

      await Promise.all(uploadPromises);

      // Get all successfully uploaded files
      const uploadedFiles = images
        .concat(newImages)
        .filter(img => img.status === 'completed' && img.uploadedFile)
        .map(img => img.uploadedFile!);

      onUploadComplete?.(uploadedFiles);

    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [images, maxFiles, category, appId, onUploadComplete, onUploadError]);

  const uploadImage = async (imageWithProgress: ImageWithProgress, index: number) => {
    try {
      // Get presigned upload URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: imageWithProgress.file.name,
          fileType: imageWithProgress.file.type,
          fileSize: imageWithProgress.file.size,
          category,
          appId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = await response.json();

      // Upload file to S3 with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setImages(prev => prev.map((img, i) => 
              i === index ? { ...img, progress } : img
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const uploadedFile: UploadedFile = {
              key,
              fileName: imageWithProgress.file.name,
              fileType: imageWithProgress.file.type,
              fileSize: imageWithProgress.file.size,
              url: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
            };

            setImages(prev => prev.map((img, i) => 
              i === index ? { ...img, progress: 100, status: 'completed', uploadedFile } : img
            ));
            resolve(uploadedFile);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setImages(prev => prev.map((img, i) => 
            i === index ? { ...img, status: 'error', error: 'Upload failed' } : img
          ));
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', imageWithProgress.file.type);
        xhr.send(imageWithProgress.file);
      });

    } catch (error: any) {
      console.error('Image upload error:', error);
      setImages(prev => prev.map((img, i) => 
        i === index ? { ...img, status: 'error', error: error.message } : img
      ));
      throw error;
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      
      // Update uploaded files list
      const uploadedFiles = newImages
        .filter(img => img.status === 'completed' && img.uploadedFile)
        .map(img => img.uploadedFile!);
      
      onUploadComplete?.(uploadedFiles);
      
      return newImages;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled: isUploading,
    multiple: maxFiles > 1,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the images here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPEG, WebP up to {MAX_FILE_SIZE / 1024 / 1024}MB each
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} image{maxFiles !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {image.status === 'uploading' && (
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <div className="text-xs">{image.progress}%</div>
                      </div>
                    )}
                    {image.status === 'completed' && (
                      <div className="text-white text-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          ✓
                        </div>
                        <div className="text-xs">Uploaded</div>
                      </div>
                    )}
                    {image.status === 'error' && (
                      <div className="text-white text-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          ✗
                        </div>
                        <div className="text-xs">Error</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image.preview);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {image.status === 'uploading' && (
                  <div className="p-2">
                    <Progress value={image.progress} className="h-1" />
                  </div>
                )}

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{image.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.file.size)}
                  </p>
                  {image.error && (
                    <p className="text-xs text-red-500 mt-1">{image.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple AvatarUpload component for profile pictures
interface AvatarUploadProps {
  onUpload: (files: any[]) => void;
  currentAvatar?: string;
}

export function AvatarUpload({ onUpload, currentAvatar }: AvatarUploadProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500 text-sm">No Image</span>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          // Mock upload for now
          onUpload([{ url: 'https://via.placeholder.com/150' }]);
        }}
      >
        Upload Avatar
      </Button>
    </div>
  );
}
