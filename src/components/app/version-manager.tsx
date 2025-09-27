'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Calendar,
  User,
  FileText,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadManager } from '@/components/upload/upload-manager';

interface AppVersion {
  id: string;
  app_id: string;
  version: string;
  changelog: string;
  app_file_url?: string;
  screenshots?: string[];
  minimum_os_version?: string;
  breaking_changes: boolean;
  release_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_by: string;
  created_by_name: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

interface VersionManagerProps {
  appId: string;
  appName: string;
  currentVersion?: string;
  userRole: string;
}

export function VersionManager({ appId, appName, currentVersion, userRole }: VersionManagerProps) {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New version form state
  const [newVersion, setNewVersion] = useState({
    version: '',
    changelog: '',
    app_file_url: '',
    screenshots: [] as string[],
    minimum_os_version: '',
    breaking_changes: false,
    release_notes: '',
  });

  useEffect(() => {
    loadVersions();
  }, [appId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/${appId}/versions?include_all=true`);
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      } else {
        toast.error('Failed to load app versions');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load app versions');
    } finally {
      setLoading(false);
    }
  };

  const submitNewVersion = async () => {
    if (!newVersion.version || !newVersion.changelog) {
      toast.error('Version and changelog are required');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/apps/${appId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVersion),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('New version submitted successfully');
        setShowNewVersionDialog(false);
        setNewVersion({
          version: '',
          changelog: '',
          app_file_url: '',
          screenshots: [],
          minimum_os_version: '',
          breaking_changes: false,
          release_notes: '',
        });
        loadVersions();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit new version');
      }
    } catch (error) {
      console.error('Error submitting version:', error);
      toast.error('Failed to submit new version');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Version History - {appName}
            {userRole === 'developer' && (
              <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Version
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit New Version</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="version">Version Number *</Label>
                        <Input
                          id="version"
                          value={newVersion.version}
                          onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                          placeholder="e.g., 1.2.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimum_os_version">Minimum OS Version</Label>
                        <Input
                          id="minimum_os_version"
                          value={newVersion.minimum_os_version}
                          onChange={(e) => setNewVersion({ ...newVersion, minimum_os_version: e.target.value })}
                          placeholder="e.g., iOS 14.0, Android 8.0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="changelog">Changelog *</Label>
                      <Textarea
                        id="changelog"
                        value={newVersion.changelog}
                        onChange={(e) => setNewVersion({ ...newVersion, changelog: e.target.value })}
                        placeholder="Describe what's new in this version..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="release_notes">Release Notes</Label>
                      <Textarea
                        id="release_notes"
                        value={newVersion.release_notes}
                        onChange={(e) => setNewVersion({ ...newVersion, release_notes: e.target.value })}
                        placeholder="Additional notes for users..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="breaking_changes"
                        checked={newVersion.breaking_changes}
                        onCheckedChange={(checked) => 
                          setNewVersion({ ...newVersion, breaking_changes: checked as boolean })
                        }
                      />
                      <Label htmlFor="breaking_changes" className="text-sm">
                        This version contains breaking changes
                      </Label>
                    </div>

                    <div>
                      <Label>App File</Label>
                      <UploadManager
                        onUploadComplete={(urls: any) => {
                          if (urls.length > 0) {
                            setNewVersion({ ...newVersion, app_file_url: urls[0] });
                          }
                        }}
                        maxFiles={{ binaries: 1 }}

                      />
                      {newVersion.app_file_url && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ App file uploaded successfully
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Screenshots (Optional)</Label>
                      <UploadManager
                        onUploadComplete={(urls: any) => {
                          setNewVersion({ ...newVersion, screenshots: urls });
                        }}
                        maxFiles={{ images: 6 }}

                      />
                      {newVersion.screenshots.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {newVersion.screenshots.length} screenshot(s) uploaded
                        </p>
                      )}
                    </div>

                    {newVersion.breaking_changes && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Breaking changes will be highlighted to users when they receive the update notification.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={submitNewVersion}
                        disabled={!newVersion.version || !newVersion.changelog || submitting}
                        className="flex-1"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Version
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewVersionDialog(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Versions</h3>
              <p className="text-muted-foreground">
                {userRole === 'developer' 
                  ? 'Submit your first version to get started.'
                  : 'No versions have been submitted for this app yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">v{version.version}</h4>
                      {getStatusBadge(version.status)}
                      {version.breaking_changes && (
                        <Badge variant="destructive" className="text-xs">
                          Breaking Changes
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(version.created_at)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Changelog</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{version.changelog}</p>
                    </div>

                    {version.release_notes && (
                      <div>
                        <Label className="text-sm font-medium">Release Notes</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{version.release_notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {version.created_by_name}
                      </div>
                      {version.minimum_os_version && (
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-4 h-4" />
                          Min OS: {version.minimum_os_version}
                        </div>
                      )}
                      {version.app_file_url && (
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          App File Available
                        </div>
                      )}
                    </div>

                    {version.status === 'rejected' && version.rejection_reason && (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {version.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {version.reviewed_at && (
                      <div className="text-xs text-muted-foreground">
                        Reviewed on {formatDate(version.reviewed_at)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
