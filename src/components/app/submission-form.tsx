'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Plus,
  X,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadManager } from '@/components/upload/upload-manager';

interface AppSubmission {
  id?: string;
  name: string;
  description: string;
  short_description: string;
  category: string;
  price: number;
  platform: string;
  version: string;
  minimum_os_version: string;
  website_url: string;
  support_url: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
  tags: string[];
  features: string[];
  status?: string;
  icon_url?: string;
  screenshots?: string[];
  app_file_url?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const APP_CATEGORIES = [
  { value: 'productivity', label: 'Productivity' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'games', label: 'Games' },
  { value: 'graphics', label: 'Graphics & Design' },
  { value: 'developer', label: 'Developer Tools' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'social', label: 'Social Networking' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'other', label: 'Other' },
];

const PLATFORMS = [
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'web', label: 'Web App' },
];

export function AppSubmissionForm({ 
  submissionId, 
  onSubmissionComplete 
}: { 
  submissionId?: string;
  onSubmissionComplete?: (submission: AppSubmission) => void;
}) {
  const [submission, setSubmission] = useState<AppSubmission>({
    name: '',
    description: '',
    short_description: '',
    category: 'other',
    price: 0,
    platform: 'web',
    version: '1.0.0',
    minimum_os_version: '',
    website_url: '',
    support_url: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    tags: [],
    features: [],
  });

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newTag, setNewTag] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/submit/${submissionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load submission');
      }

      const data = await response.json();
      setSubmission(data.submission);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSubmission = async () => {
    try {
      setSaving(true);
      
      const url = submissionId 
        ? `/api/apps/submit/${submissionId}`
        : '/api/apps/submit';
      
      const method = submissionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save submission');
      }

      const data = await response.json();
      setSubmission(data.submission);
      toast.success('Submission saved successfully');
      
      if (!submissionId) {
        // Redirect to edit mode for new submissions
        window.history.replaceState(null, '', `/developer/apps/submit/${data.submission.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const validateSubmission = async () => {
    try {
      if (!submissionId) {
        toast.error('Please save the submission first');
        return;
      }

      const response = await fetch(`/api/apps/submit/${submissionId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'validate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate submission');
      }

      const data = await response.json();
      setValidation(data.validation);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const submitForReview = async () => {
    try {
      setSubmitting(true);
      
      if (!submissionId) {
        toast.error('Please save the submission first');
        return;
      }

      // Validate first
      await validateSubmission();
      
      if (validation && !validation.isValid) {
        toast.error('Please fix validation errors before submitting');
        return;
      }

      const response = await fetch(`/api/apps/submit/${submissionId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'submit' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit for review');
      }

      const data = await response.json();
      setSubmission(data.submission);
      toast.success('App submitted for review successfully');
      onSubmissionComplete?.(data.submission);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !submission.tags.includes(newTag.trim())) {
      setSubmission(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSubmission(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !submission.features.includes(newFeature.trim())) {
      setSubmission(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setSubmission(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature),
    }));
  };

  const handleUploadComplete = (uploads: any) => {
    if (uploads.appIcon) {
      setSubmission(prev => ({
        ...prev,
        icon_url: uploads.appIcon.url,
      }));
    }
    if (uploads.images && uploads.images.length > 0) {
      setSubmission(prev => ({
        ...prev,
        screenshots: uploads.images.map((img: any) => img.url),
      }));
    }
    if (uploads.binaries && uploads.binaries.length > 0) {
      setSubmission(prev => ({
        ...prev,
        app_file_url: uploads.binaries[0].url,
      }));
    }
  };

  const canSubmit = submission.status === 'draft' || submission.status === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {submissionId ? 'Edit App Submission' : 'Submit New App'}
            </span>
            {submission.status && (
              <Badge 
                variant={
                  submission.status === 'approved' ? 'default' :
                  submission.status === 'rejected' ? 'destructive' :
                  submission.status === 'submitted' ? 'secondary' :
                  'outline'
                }
              >
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardContent className="pt-6">
            {validation.errors.length > 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Validation Errors:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation.isValid && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your app submission is ready for review!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">App Name *</Label>
                  <Input
                    id="name"
                    value={submission.name}
                    onChange={(e) => setSubmission(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter app name"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    value={submission.version}
                    onChange={(e) => setSubmission(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={submission.category}
                    onValueChange={(value) => setSubmission(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select
                    value={submission.platform}
                    onValueChange={(value) => setSubmission(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={submission.price}
                    onChange={(e) => setSubmission(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_os_version">Minimum OS Version</Label>
                  <Input
                    id="minimum_os_version"
                    value={submission.minimum_os_version}
                    onChange={(e) => setSubmission(prev => ({ ...prev, minimum_os_version: e.target.value }))}
                    placeholder="e.g., Windows 10, macOS 11.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description *</Label>
                <Input
                  id="short_description"
                  value={submission.short_description}
                  onChange={(e) => setSubmission(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Brief description (max 200 characters)"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {submission.short_description.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={submission.description}
                  onChange={(e) => setSubmission(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your app (minimum 50 characters)"
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {submission.description.length}/5000 characters (minimum 50)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Key Features</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button onClick={addFeature} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {submission.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{feature}</span>
                      <X 
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive" 
                        onClick={() => removeFeature(feature)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Media</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadManager
                onUploadComplete={handleUploadComplete}
                showTabs={['images', 'binaries']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={submission.website_url}
                  onChange={(e) => setSubmission(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://yourapp.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_url">Support URL</Label>
                <Input
                  id="support_url"
                  type="url"
                  value={submission.support_url}
                  onChange={(e) => setSubmission(prev => ({ ...prev, support_url: e.target.value }))}
                  placeholder="https://support.yourapp.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_policy_url"
                  type="url"
                  value={submission.privacy_policy_url}
                  onChange={(e) => setSubmission(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                  placeholder="https://yourapp.com/privacy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
                <Input
                  id="terms_of_service_url"
                  type="url"
                  value={submission.terms_of_service_url}
                  onChange={(e) => setSubmission(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
                  placeholder="https://yourapp.com/terms"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              onClick={saveSubmission}
              disabled={saving}
              variant="outline"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            {submissionId && (
              <Button
                onClick={validateSubmission}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Validate
              </Button>
            )}

            {canSubmit && (
              <Button
                onClick={submitForReview}
                disabled={submitting || !submissionId}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
