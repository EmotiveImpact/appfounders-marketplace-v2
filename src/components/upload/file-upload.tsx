'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, File, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  validateFile,
  formatFileSize,
  generateUniqueFileName
} from '@/lib/upload/validation';

interface FileUploadProps {
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

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

export function FileUpload({
  category,
  appId,
  maxFiles = 5,
  acceptedFileTypes,
  onUploadComplete,
  onUploadError,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    try {
      const uploadPromises = newFiles.map((fileWithProgress, index) => 
        uploadFile(fileWithProgress, index)
      );

      await Promise.all(uploadPromises);

      // Get all successfully uploaded files
      const uploadedFiles = files
        .concat(newFiles)
        .filter(f => f.status === 'completed' && f.uploadedFile)
        .map(f => f.uploadedFile!);

      onUploadComplete?.(uploadedFiles);

    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [files, maxFiles, category, appId, onUploadComplete, onUploadError]);

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number) => {
    try {
      // Get presigned upload URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileWithProgress.file.name,
          fileType: fileWithProgress.file.type,
          fileSize: fileWithProgress.file.size,
          category,
          appId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key, metadata } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileWithProgress.file,
        headers: {
          'Content-Type': fileWithProgress.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Update file status
      const uploadedFile: UploadedFile = {
        key,
        fileName: fileWithProgress.file.name,
        fileType: fileWithProgress.file.type,
        fileSize: fileWithProgress.file.size,
        url: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
      };

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100, status: 'completed', uploadedFile } : f
      ));

    } catch (error: any) {
      console.error('File upload error:', error);
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: error.message } : f
      ));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? 
      acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : 
      undefined,
    maxFiles,
    disabled: isUploading,
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
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} files, up to 100MB each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileWithProgress, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileWithProgress.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileWithProgress.file.size)}
                </p>
                
                {fileWithProgress.status === 'uploading' && (
                  <Progress value={fileWithProgress.progress} className="mt-1" />
                )}
                
                {fileWithProgress.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {fileWithProgress.error}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {fileWithProgress.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {fileWithProgress.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
