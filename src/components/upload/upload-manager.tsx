'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Package, 
  Trash2, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from './file-upload';
import { ImageUpload } from './image-upload';
import { DocumentUpload } from './document-upload';
import { AppFileUpload } from './app-file-upload';

interface UploadManagerProps {
  onUploadComplete?: (uploads: UploadResults) => void;
  showTabs?: ('images' | 'documents' | 'binaries' | 'appIcon')[];
  maxFiles?: {
    images?: number;
    documents?: number;
    binaries?: number;
    appIcon?: number;
  };
  className?: string;
}

interface UploadResults {
  images?: UploadedFile[];
  documents?: UploadedFile[];
  binaries?: UploadedFile[];
  appIcon?: UploadedFile;
}

interface UploadedFile {
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

const DEFAULT_TABS = ['images', 'documents', 'binaries'] as const;
const DEFAULT_MAX_FILES = {
  images: 10,
  documents: 5,
  binaries: 3,
  appIcon: 1,
};

export function UploadManager({
  onUploadComplete,
  showTabs = DEFAULT_TABS as any,
  maxFiles = DEFAULT_MAX_FILES,
  className = '',
}: UploadManagerProps) {
  const [activeTab, setActiveTab] = useState(showTabs[0] || 'images');
  const [uploads, setUploads] = useState<UploadResults>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = useCallback((category: string, files: UploadedFile[]) => {
    setUploads(prev => {
      const updated = { ...prev };
      
      if (category === 'appIcon') {
        updated.appIcon = files[0];
      } else {
        (updated as any)[category] = files;
      }
      
      onUploadComplete?.(updated);
      return updated;
    });
  }, [onUploadComplete]);

  const handleUploadError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const removeFile = useCallback((category: string, index?: number) => {
    setUploads(prev => {
      const updated = { ...prev };
      
      if (category === 'appIcon') {
        delete updated.appIcon;
      } else {
        const categoryFiles = updated[category as keyof UploadResults] as UploadedFile[];
        if (categoryFiles && typeof index === 'number') {
          (updated as any)[category] = categoryFiles.filter((_, i) => i !== index);
        }
      }
      
      onUploadComplete?.(updated);
      return updated;
    });
  }, [onUploadComplete]);

  const getTotalFiles = () => {
    let total = 0;
    if (uploads.images) total += uploads.images.length;
    if (uploads.documents) total += uploads.documents.length;
    if (uploads.binaries) total += uploads.binaries.length;
    if (uploads.appIcon) total += 1;
    return total;
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'images':
        return <ImageIcon className="w-4 h-4" />;
      case 'documents':
        return <FileText className="w-4 h-4" />;
      case 'binaries':
        return <Package className="w-4 h-4" />;
      case 'appIcon':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const getTabLabel = (tab: string) => {
    const count = tab === 'appIcon' 
      ? (uploads.appIcon ? 1 : 0)
      : (uploads[tab as keyof UploadResults] as UploadedFile[])?.length || 0;
    
    const labels = {
      images: 'Screenshots',
      documents: 'Documents',
      binaries: 'App Files',
      appIcon: 'App Icon',
    };

    return (
      <div className="flex items-center gap-2">
        {getTabIcon(tab)}
        <span>{labels[tab as keyof typeof labels]}</span>
        {count > 0 && (
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        )}
      </div>
    );
  };

  const renderFileList = (files: UploadedFile[], category: string) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">Uploaded Files</h4>
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={file.key}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(category, index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          <span className="font-medium">File Uploads</span>
          {getTotalFiles() > 0 && (
            <Badge variant="default">
              {getTotalFiles()} file{getTotalFiles() !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Upload Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab as any}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {showTabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {getTabLabel(tab)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Images Tab */}
        {showTabs.includes('images') && (
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  App Screenshots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="screenshots"
                  maxFiles={maxFiles.images}
                  onUploadComplete={(files) => handleUploadComplete('images', files)}
                  onUploadError={handleUploadError}
                />
                {renderFileList(uploads.images || [], 'images')}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Documents Tab */}
        {showTabs.includes('documents') && (
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  category="documents"
                  maxFiles={maxFiles.documents}
                  onUploadComplete={(files) => handleUploadComplete('documents', files)}
                  onUploadError={handleUploadError}
                />
                {renderFileList(uploads.documents || [], 'documents')}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Binaries Tab */}
        {showTabs.includes('binaries') && (
          <TabsContent value="binaries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  App Binaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppFileUpload
                  category="binaries"
                  maxFiles={maxFiles.binaries}
                  onUploadComplete={(files) => handleUploadComplete('binaries', files)}
                  onUploadError={handleUploadError}
                />
                {renderFileList(uploads.binaries || [], 'binaries')}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* App Icon Tab */}
        {showTabs.includes('appIcon') && (
          <TabsContent value="appIcon">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  App Icon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="appIcon"
                  maxFiles={1}
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg']}
                  onUploadComplete={(files) => handleUploadComplete('appIcon', files)}
                  onUploadError={handleUploadError}
                />
                {uploads.appIcon && renderFileList([uploads.appIcon], 'appIcon')}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Upload Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Upload Guidelines:</strong>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Images: PNG, JPEG, WebP (max 10MB each)</li>
            <li>• Documents: PDF, DOC, DOCX (max 25MB each)</li>
            <li>• App Files: ZIP, DMG, EXE, APK (max 100MB each)</li>
            <li>• All files are scanned for security before processing</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
