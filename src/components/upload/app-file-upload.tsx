'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Package, Download, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AppFileUploadProps {
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
  platform?: string;
  architecture?: string;
}

interface AppFileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'validating';
  error?: string;
  uploadedFile?: UploadedFile;
  platform?: string;
  architecture?: string;
  validationResults?: ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  platform: string;
  architecture: string;
  fileType: string;
  warnings: string[];
  errors: string[];
}

const PLATFORM_FILE_TYPES: { [key: string]: string[] } = {
  windows: ['application/x-msdownload', 'application/x-msdos-program', 'application/zip'],
  macos: ['application/x-apple-diskimage', 'application/zip', 'application/x-tar'],
  linux: ['application/x-debian-package', 'application/x-rpm', 'application/zip', 'application/x-tar'],
  android: ['application/vnd.android.package-archive'],
  ios: ['application/octet-stream'], // .ipa files
  web: ['application/zip', 'application/x-tar'],
};

const PLATFORM_LABELS = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  ios: 'iOS',
  web: 'Web App',
};

const ARCHITECTURE_OPTIONS = {
  windows: ['x64', 'x86', 'arm64'],
  macos: ['x64', 'arm64'],
  linux: ['x64', 'x86', 'arm64', 'arm'],
  android: ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86'],
  ios: ['arm64'],
  web: ['universal'],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function AppFileUpload({
  category,
  appId,
  maxFiles = 3,
  acceptedFileTypes,
  onUploadComplete,
  onUploadError,
  className = '',
}: AppFileUploadProps) {
  const [appFiles, setAppFiles] = useState<AppFileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedArchitecture, setSelectedArchitecture] = useState<string>('');

  const validateAppFile = (file: File, platform: string): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      platform,
      architecture: selectedArchitecture,
      fileType: file.type,
      warnings: [],
      errors: [],
    };

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      result.errors.push(`File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      result.isValid = false;
    }

    // Check platform-specific file types
    const allowedTypes = PLATFORM_FILE_TYPES[platform];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      result.errors.push(`File type ${file.type} not supported for ${PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]}.`);
      result.isValid = false;
    }

    // Platform-specific validations
    switch (platform) {
      case 'windows':
        if (file.name.endsWith('.exe') && file.type !== 'application/x-msdownload') {
          result.warnings.push('Windows executable detected but MIME type is not recognized.');
        }
        break;
      case 'macos':
        if (file.name.endsWith('.dmg') && file.type !== 'application/x-apple-diskimage') {
          result.warnings.push('macOS disk image detected but MIME type is not recognized.');
        }
        break;
      case 'android':
        if (!file.name.endsWith('.apk')) {
          result.errors.push('Android apps must be in APK format.');
          result.isValid = false;
        }
        break;
      case 'ios':
        if (!file.name.endsWith('.ipa')) {
          result.errors.push('iOS apps must be in IPA format.');
          result.isValid = false;
        }
        break;
    }

    return result;
  };

  const detectPlatformFromFile = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'exe':
      case 'msi':
        return 'windows';
      case 'dmg':
      case 'pkg':
        return 'macos';
      case 'deb':
      case 'rpm':
      case 'appimage':
        return 'linux';
      case 'apk':
        return 'android';
      case 'ipa':
        return 'ios';
      default:
        return '';
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (appFiles.length + acceptedFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} app files allowed`);
      return;
    }

    if (!selectedPlatform) {
      // Try to auto-detect platform
      const detectedPlatform = detectPlatformFromFile(acceptedFiles[0]);
      if (detectedPlatform) {
        setSelectedPlatform(detectedPlatform);
        setSelectedArchitecture(ARCHITECTURE_OPTIONS[detectedPlatform as keyof typeof ARCHITECTURE_OPTIONS][0]);
      } else {
        onUploadError?.('Please select a platform first');
        return;
      }
    }

    const newAppFiles: AppFileWithProgress[] = [];
    
    // Validate all files first
    for (const file of acceptedFiles) {
      const validationResults = validateAppFile(file, selectedPlatform);
      
      if (!validationResults.isValid) {
        onUploadError?.(validationResults.errors.join(', '));
        return;
      }

      newAppFiles.push({
        file,
        progress: 0,
        status: 'validating',
        platform: selectedPlatform,
        architecture: selectedArchitecture,
        validationResults,
      });
    }

    setAppFiles(prev => [...prev, ...newAppFiles]);
    setIsUploading(true);

    try {
      // Upload all files
      const uploadPromises = newAppFiles.map((appFileWithProgress, index) => 
        uploadAppFile(appFileWithProgress, appFiles.length + index)
      );

      await Promise.all(uploadPromises);

      // Get all successfully uploaded files
      const uploadedFiles = appFiles
        .concat(newAppFiles)
        .filter(file => file.status === 'completed' && file.uploadedFile)
        .map(file => file.uploadedFile!);

      onUploadComplete?.(uploadedFiles);

    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [appFiles, maxFiles, selectedPlatform, selectedArchitecture, category, appId, onUploadComplete, onUploadError]);

  const uploadAppFile = async (appFileWithProgress: AppFileWithProgress, index: number) => {
    try {
      // Update status to uploading
      setAppFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, status: 'uploading' } : file
      ));

      // Get presigned upload URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: appFileWithProgress.file.name,
          fileType: appFileWithProgress.file.type,
          fileSize: appFileWithProgress.file.size,
          category,
          appId,
          metadata: {
            platform: appFileWithProgress.platform,
            architecture: appFileWithProgress.architecture,
          },
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
            setAppFiles(prev => prev.map((file, i) => 
              i === index ? { ...file, progress } : file
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const uploadedFile: UploadedFile = {
              key,
              fileName: appFileWithProgress.file.name,
              fileType: appFileWithProgress.file.type,
              fileSize: appFileWithProgress.file.size,
              url: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
              platform: appFileWithProgress.platform,
              architecture: appFileWithProgress.architecture,
            };

            setAppFiles(prev => prev.map((file, i) => 
              i === index ? { ...file, progress: 100, status: 'completed', uploadedFile } : file
            ));
            resolve(uploadedFile);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setAppFiles(prev => prev.map((file, i) => 
            i === index ? { ...file, status: 'error', error: 'Upload failed' } : file
          ));
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', appFileWithProgress.file.type);
        xhr.send(appFileWithProgress.file);
      });

    } catch (error: any) {
      console.error('App file upload error:', error);
      setAppFiles(prev => prev.map((file, i) => 
        i === index ? { ...file, status: 'error', error: error.message } : file
      ));
      throw error;
    }
  };

  const removeAppFile = (index: number) => {
    setAppFiles(prev => {
      const newAppFiles = prev.filter((_, i) => i !== index);
      
      // Update uploaded files list
      const uploadedFiles = newAppFiles
        .filter(file => file.status === 'completed' && file.uploadedFile)
        .map(file => file.uploadedFile!);
      
      onUploadComplete?.(uploadedFiles);
      
      return newAppFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    disabled: isUploading || !selectedPlatform,
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
      {/* Platform Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="platform">Target Platform</Label>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="architecture">Architecture</Label>
          <Select 
            value={selectedArchitecture} 
            onValueChange={setSelectedArchitecture}
            disabled={!selectedPlatform}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select architecture" />
            </SelectTrigger>
            <SelectContent>
              {selectedPlatform && ARCHITECTURE_OPTIONS[selectedPlatform as keyof typeof ARCHITECTURE_OPTIONS]?.map((arch) => (
                <SelectItem key={arch} value={arch}>
                  {arch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading || !selectedPlatform ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {!selectedPlatform ? (
          <p className="text-gray-500">Please select a platform first</p>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop the app files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop app files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              {selectedPlatform && PLATFORM_FILE_TYPES[selectedPlatform] && 
                `Supported: ${PLATFORM_FILE_TYPES[selectedPlatform].join(', ')}`
              }
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} file{maxFiles !== 1 ? 's' : ''}, up to {MAX_FILE_SIZE / 1024 / 1024}MB each
            </p>
          </div>
        )}
      </div>

      {/* App Files List */}
      {appFiles.length > 0 && (
        <div className="space-y-3">
          {appFiles.map((appFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* File Header */}
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{appFile.file.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {PLATFORM_LABELS[appFile.platform as keyof typeof PLATFORM_LABELS]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {appFile.architecture}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(appFile.file.size)}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      {appFile.status === 'validating' && (
                        <div className="flex items-center gap-2 text-orange-500">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs">Validating...</span>
                        </div>
                      )}
                      {appFile.status === 'uploading' && (
                        <div className="flex items-center gap-2 text-blue-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">{appFile.progress}%</span>
                        </div>
                      )}
                      {appFile.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          {appFile.uploadedFile && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(appFile.uploadedFile!.url, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      {appFile.status === 'error' && (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✗</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAppFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {appFile.status === 'uploading' && (
                    <Progress value={appFile.progress} className="h-1" />
                  )}

                  {/* Validation Results */}
                  {appFile.validationResults && (
                    <div className="space-y-2">
                      {appFile.validationResults.warnings.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warnings:</strong>
                            <ul className="mt-1 text-sm">
                              {appFile.validationResults.warnings.map((warning, i) => (
                                <li key={i}>• {warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {appFile.validationResults.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Errors:</strong>
                            <ul className="mt-1 text-sm">
                              {appFile.validationResults.errors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {appFile.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{appFile.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All uploaded app files are automatically scanned for malware and security vulnerabilities. Files that fail security checks will be rejected.
        </AlertDescription>
      </Alert>
    </div>
  );
}
