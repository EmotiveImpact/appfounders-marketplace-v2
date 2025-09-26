'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Shield, 
  Clock, 
  FileText, 
  Package, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface SecureDownloadProps {
  fileKey: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  category?: string;
  appId?: string;
  requiresPurchase?: boolean;
  className?: string;
}

interface DownloadState {
  status: 'idle' | 'generating' | 'ready' | 'downloading' | 'completed' | 'error';
  downloadUrl?: string;
  expiresAt?: Date;
  progress?: number;
  error?: string;
}

export function SecureDownload({
  fileKey,
  fileName,
  fileSize,
  fileType,
  category,
  appId,
  requiresPurchase = false,
  className = '',
}: SecureDownloadProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>({ status: 'idle' });

  const getFileIcon = () => {
    if (fileType?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (fileType?.includes('application') || category === 'binaries') {
      return <Package className="w-5 h-5" />;
    } else {
      return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return 'Expired';
    }
  };

  const generateDownloadUrl = async () => {
    try {
      setDownloadState({ status: 'generating' });

      const response = await fetch(`/api/download/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          appId,
          category,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate download URL');
      }

      const data = await response.json();
      
      setDownloadState({
        status: 'ready',
        downloadUrl: data.downloadUrl,
        expiresAt: new Date(Date.now() + data.expiresIn * 1000),
      });

      toast.success('Download URL generated successfully');
    } catch (error: any) {
      setDownloadState({
        status: 'error',
        error: error.message,
      });
      toast.error(error.message);
    }
  };

  const startDownload = async () => {
    if (!downloadState.downloadUrl) {
      await generateDownloadUrl();
      return;
    }

    try {
      setDownloadState(prev => ({ ...prev, status: 'downloading', progress: 0 }));

      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = downloadState.downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Simulate download progress (in real implementation, you'd track actual progress)
      const progressInterval = setInterval(() => {
        setDownloadState(prev => {
          const newProgress = (prev.progress || 0) + Math.random() * 20;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return { ...prev, status: 'completed', progress: 100 };
          }
          return { ...prev, progress: newProgress };
        });
      }, 200);

      link.click();
      document.body.removeChild(link);

      // Log the download
      await fetch('/api/download/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          fileName,
          appId,
        }),
      });

      toast.success('Download started successfully');
    } catch (error: any) {
      setDownloadState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      toast.error(error.message);
    }
  };

  const resetDownload = () => {
    setDownloadState({ status: 'idle' });
  };

  const isExpired = downloadState.expiresAt && new Date() > downloadState.expiresAt;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getFileIcon()}
          <span className="truncate">{fileName}</span>
          {requiresPurchase && (
            <Badge variant="secondary">
              <Shield className="w-3 h-3 mr-1" />
              Protected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Size: {formatFileSize(fileSize)}</span>
          {fileType && <span>Type: {fileType.split('/')[1]?.toUpperCase()}</span>}
        </div>

        {/* Download Status */}
        {downloadState.status === 'idle' && (
          <Button onClick={generateDownloadUrl} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Prepare Download
          </Button>
        )}

        {downloadState.status === 'generating' && (
          <Button disabled className="w-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating secure link...
          </Button>
        )}

        {downloadState.status === 'ready' && !isExpired && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Secure download link ready</span>
            </div>
            
            {downloadState.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Expires in: {getTimeRemaining(downloadState.expiresAt)}</span>
              </div>
            )}

            <Button onClick={startDownload} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Now
            </Button>
          </div>
        )}

        {downloadState.status === 'downloading' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Downloading...</span>
            </div>
            
            {downloadState.progress !== undefined && (
              <div className="space-y-1">
                <Progress value={downloadState.progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(downloadState.progress)}% complete
                </p>
              </div>
            )}
          </div>
        )}

        {downloadState.status === 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Download completed successfully</span>
            </div>
            
            <Button variant="outline" onClick={resetDownload} className="w-full">
              Download Again
            </Button>
          </div>
        )}

        {(downloadState.status === 'error' || isExpired) && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {downloadState.error || 'Download link has expired'}
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" onClick={resetDownload} className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security Notice:</strong> This download link is time-limited and tracked for security purposes. 
            Only authorized users can access this file.
          </AlertDescription>
        </Alert>

        {/* Additional Actions */}
        {downloadState.downloadUrl && !isExpired && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(downloadState.downloadUrl, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Open in Browser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(downloadState.downloadUrl!);
                toast.success('Download URL copied to clipboard');
              }}
              className="flex-1"
            >
              Copy Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
