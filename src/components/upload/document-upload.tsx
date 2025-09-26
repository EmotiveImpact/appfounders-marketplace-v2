'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DocumentUploadProps {
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

interface DocumentWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const FILE_TYPE_LABELS: { [key: string]: string } = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
};

export function DocumentUpload({
  category,
  appId,
  maxFiles = 5,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  onUploadComplete,
  onUploadError,
  className = '',
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<UploadedFile | null>(null);

  const validateDocument = (file: File): string | null => {
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please use PDF, DOC, DOCX, TXT, or MD files.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }

    return null;
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    return FILE_TYPE_LABELS[fileType] || fileType.split('/')[1]?.toUpperCase() || 'FILE';
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (documents.length + acceptedFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} documents allowed`);
      return;
    }

    // Validate all files first
    for (const file of acceptedFiles) {
      const error = validateDocument(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
    }

    const newDocuments: DocumentWithProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    setIsUploading(true);

    try {
      // Upload all documents
      const uploadPromises = newDocuments.map((documentWithProgress, index) => 
        uploadDocument(documentWithProgress, documents.length + index)
      );

      await Promise.all(uploadPromises);

      // Get all successfully uploaded files
      const uploadedFiles = documents
        .concat(newDocuments)
        .filter(doc => doc.status === 'completed' && doc.uploadedFile)
        .map(doc => doc.uploadedFile!);

      onUploadComplete?.(uploadedFiles);

    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [documents, maxFiles, category, appId, onUploadComplete, onUploadError]);

  const uploadDocument = async (documentWithProgress: DocumentWithProgress, index: number) => {
    try {
      // Get presigned upload URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: documentWithProgress.file.name,
          fileType: documentWithProgress.file.type,
          fileSize: documentWithProgress.file.size,
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
            setDocuments(prev => prev.map((doc, i) => 
              i === index ? { ...doc, progress } : doc
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const uploadedFile: UploadedFile = {
              key,
              fileName: documentWithProgress.file.name,
              fileType: documentWithProgress.file.type,
              fileSize: documentWithProgress.file.size,
              url: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
            };

            setDocuments(prev => prev.map((doc, i) => 
              i === index ? { ...doc, progress: 100, status: 'completed', uploadedFile } : doc
            ));
            resolve(uploadedFile);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setDocuments(prev => prev.map((doc, i) => 
            i === index ? { ...doc, status: 'error', error: 'Upload failed' } : doc
          ));
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', documentWithProgress.file.type);
        xhr.send(documentWithProgress.file);
      });

    } catch (error: any) {
      console.error('Document upload error:', error);
      setDocuments(prev => prev.map((doc, i) => 
        i === index ? { ...doc, status: 'error', error: error.message } : doc
      ));
      throw error;
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => {
      const newDocuments = prev.filter((_, i) => i !== index);
      
      // Update uploaded files list
      const uploadedFiles = newDocuments
        .filter(doc => doc.status === 'completed' && doc.uploadedFile)
        .map(doc => doc.uploadedFile!);
      
      onUploadComplete?.(uploadedFiles);
      
      return newDocuments;
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
        <input {...getInputProps()} />
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the documents here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag & drop documents here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOC, DOCX, TXT, MD up to {MAX_FILE_SIZE / 1024 / 1024}MB each
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxFiles} document{maxFiles !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((document, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(document.file.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{document.file.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {getFileTypeLabel(document.file.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(document.file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {document.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={document.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {document.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {document.error && (
                      <p className="text-xs text-red-500 mt-1">{document.error}</p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {document.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                    {document.status === 'completed' && (
                      <>
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        {document.uploadedFile && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewDocument(document.uploadedFile!)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(document.uploadedFile!.url, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {document.status === 'error' && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✗</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview - {previewDocument?.fileName}</DialogTitle>
          </DialogHeader>
          {previewDocument && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getFileTypeLabel(previewDocument.fileType)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatFileSize(previewDocument.fileSize)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(previewDocument.url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              {previewDocument.fileType === 'application/pdf' ? (
                <iframe
                  src={previewDocument.url}
                  className="w-full h-[70vh] border rounded"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center p-8 border rounded bg-muted">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Preview not available for this file type.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(previewDocument.url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
