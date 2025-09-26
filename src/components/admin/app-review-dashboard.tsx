'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Star,
  DollarSign,
  Smartphone,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface AppSubmission {
  id: string;
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
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  icon_url?: string;
  screenshots?: string[];
  app_file_url?: string;
  developer_id: string;
  developer_name: string;
  developer_email: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
}

interface AppReviewDashboardProps {
  onStatusUpdate?: () => void;
}

export function AppReviewDashboard({ onStatusUpdate }: AppReviewDashboardProps) {
  const [submissions, setSubmissions] = useState<AppSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AppSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/app-submissions?status=${filter === 'all' ? '' : filter}`);
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        toast.error('Failed to load app submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load app submissions');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/app-submissions/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          rejection_reason: reviewAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`App ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        setSelectedSubmission(null);
        setReviewAction(null);
        setRejectionReason('');
        loadSubmissions();
        onStatusUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Submissions</CardTitle>
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
      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            App Submissions Review
            <div className="flex gap-2">
              {['all', 'pending', 'in_review', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status as any)}
                  className="capitalize"
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                  {status !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      {submissions.filter(s => s.status === status).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Submissions</h3>
              <p className="text-muted-foreground">
                No app submissions found for the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {submission.icon_url && (
                        <img
                          src={submission.icon_url}
                          alt={submission.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{submission.name}</h4>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {submission.short_description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatPrice(submission.price)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Smartphone className="w-4 h-4" />
                            {submission.platform}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(submission.submitted_at)}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Developer:</span>{' '}
                          <span className="font-medium">{submission.developer_name}</span>
                          <span className="text-muted-foreground ml-2">({submission.developer_email})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Review App Submission - {submission.name}
                            </DialogTitle>
                          </DialogHeader>

                          {selectedSubmission && (
                            <Tabs defaultValue="details" className="space-y-4">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="media">Media</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="review">Review</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium">App Name</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Category</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.category}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Platform</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.platform}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Price</Label>
                                      <p className="text-sm mt-1">{formatPrice(selectedSubmission.price)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Version</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.version}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium">Developer</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.developer_name}</p>
                                      <p className="text-xs text-muted-foreground">{selectedSubmission.developer_email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Minimum OS Version</Label>
                                      <p className="text-sm mt-1">{selectedSubmission.minimum_os_version}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Website</Label>
                                      <a 
                                        href={selectedSubmission.website_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        {selectedSubmission.website_url}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Support URL</Label>
                                      <a 
                                        href={selectedSubmission.support_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        {selectedSubmission.support_url}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium">Description</Label>
                                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedSubmission.description}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Features</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSubmission.features.map((feature, index) => (
                                      <Badge key={index} variant="outline">{feature}</Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Tags</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSubmission.tags.map((tag, index) => (
                                      <Badge key={index} variant="secondary">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="media" className="space-y-4">
                                <div className="space-y-4">
                                  {selectedSubmission.icon_url && (
                                    <div>
                                      <Label className="text-sm font-medium">App Icon</Label>
                                      <div className="mt-2">
                                        <img
                                          src={selectedSubmission.icon_url}
                                          alt="App Icon"
                                          className="w-24 h-24 rounded-lg object-cover border"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedSubmission.screenshots && selectedSubmission.screenshots.length > 0 && (
                                    <div>
                                      <Label className="text-sm font-medium">Screenshots</Label>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                        {selectedSubmission.screenshots.map((screenshot, index) => (
                                          <img
                                            key={index}
                                            src={screenshot}
                                            alt={`Screenshot ${index + 1}`}
                                            className="w-full h-48 object-cover border rounded-lg"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="files" className="space-y-4">
                                <div className="space-y-4">
                                  {selectedSubmission.app_file_url && (
                                    <div>
                                      <Label className="text-sm font-medium">App File</Label>
                                      <div className="mt-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => window.open(selectedSubmission.app_file_url, '_blank')}
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Download App File
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Privacy Policy</Label>
                                      <a 
                                        href={selectedSubmission.privacy_policy_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                      >
                                        View Privacy Policy
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Terms of Service</Label>
                                      <a 
                                        href={selectedSubmission.terms_of_service_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                      >
                                        View Terms of Service
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="review" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Review Decision</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="flex gap-4">
                                      <Button
                                        variant={reviewAction === 'approve' ? 'default' : 'outline'}
                                        onClick={() => setReviewAction('approve')}
                                        className="flex-1"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve App
                                      </Button>
                                      <Button
                                        variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                                        onClick={() => setReviewAction('reject')}
                                        className="flex-1"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject App
                                      </Button>
                                    </div>

                                    {reviewAction === 'reject' && (
                                      <div className="space-y-2">
                                        <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                                        <Textarea
                                          id="rejection_reason"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Please provide a clear reason for rejection..."
                                          rows={4}
                                        />
                                      </div>
                                    )}

                                    {reviewAction && (
                                      <Alert>
                                        <AlertDescription>
                                          {reviewAction === 'approve' 
                                            ? 'The app will be published to the marketplace and the developer will be notified.'
                                            : 'The developer will be notified of rejection and can resubmit with corrections.'
                                          }
                                        </AlertDescription>
                                      </Alert>
                                    )}

                                    <Button
                                      onClick={submitReview}
                                      disabled={!reviewAction || (reviewAction === 'reject' && !rejectionReason.trim()) || submitting}
                                      className="w-full"
                                    >
                                      {submitting ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Submitting...
                                        </>
                                      ) : (
                                        `Submit ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`
                                      )}
                                    </Button>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
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
