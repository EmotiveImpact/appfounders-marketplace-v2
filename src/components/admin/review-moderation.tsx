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
  Flag,
  FlagOff,
  Eye,
  Star,
  Calendar,
  User,
  Loader2,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  app_id: string;
  app_name: string;
  user_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_reason?: string;
  moderator_name?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

interface ReviewModerationProps {
  onReviewModerated?: () => void;
}

export function ReviewModeration({ onReviewModerated }: ReviewModerationProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'flag' | 'unflag' | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'flagged'>('pending');

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reviews/moderate?status=${filter}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitModeration = async () => {
    if (!selectedReview || !moderationAction) return;

    if ((moderationAction === 'reject' || moderationAction === 'flag') && !moderationReason.trim()) {
      toast.error('Reason is required for rejection or flagging');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/admin/reviews/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_id: selectedReview.id,
          action: moderationAction,
          reason: moderationReason.trim() || undefined,
          notify_user: true,
        }),
      });

      if (response.ok) {
        toast.success(`Review ${moderationAction}ed successfully`);
        setSelectedReview(null);
        setModerationAction(null);
        setModerationReason('');
        loadReviews();
        onReviewModerated?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to moderate review');
      }
    } catch (error) {
      console.error('Error moderating review:', error);
      toast.error('Failed to moderate review');
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
      case 'flagged':
        return <Badge className="bg-orange-100 text-orange-800">Flagged</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
          <CardTitle>Review Moderation</CardTitle>
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
            Review Moderation
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'flagged'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status as any)}
                  className="capitalize"
                >
                  {status}
                  <Badge variant="secondary" className="ml-2">
                    {reviews.filter(r => r.status === status).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Reviews</h3>
              <p className="text-muted-foreground">
                No reviews found for the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(review.created_at)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {review.reviewer_name}
                      </div>
                      <div>
                        App: <span className="font-medium">{review.app_name}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm whitespace-pre-wrap">{review.content}</p>
                    </div>

                    {review.moderation_reason && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Moderation Reason:</strong> {review.moderation_reason}
                          {review.moderator_name && (
                            <span className="block text-xs mt-1">
                              By {review.moderator_name} on {formatDate(review.moderated_at!)}
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReview(review)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Moderate
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Moderate Review - {review.app_name}
                            </DialogTitle>
                          </DialogHeader>

                          {selectedReview && (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {renderStars(selectedReview.rating)}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    by {selectedReview.reviewer_name}
                                  </span>
                                </div>

                                <div className="p-4 bg-muted rounded-lg">
                                  <p className="whitespace-pre-wrap">{selectedReview.content}</p>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                  Submitted on {formatDate(selectedReview.created_at)}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Moderation Action</Label>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      variant={moderationAction === 'approve' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setModerationAction('approve')}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant={moderationAction === 'reject' ? 'destructive' : 'outline'}
                                      size="sm"
                                      onClick={() => setModerationAction('reject')}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button
                                      variant={moderationAction === 'flag' ? 'secondary' : 'outline'}
                                      size="sm"
                                      onClick={() => setModerationAction('flag')}
                                    >
                                      <Flag className="w-4 h-4 mr-2" />
                                      Flag
                                    </Button>
                                    {selectedReview.status === 'flagged' && (
                                      <Button
                                        variant={moderationAction === 'unflag' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setModerationAction('unflag')}
                                      >
                                        <FlagOff className="w-4 h-4 mr-2" />
                                        Unflag
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {(moderationAction === 'reject' || moderationAction === 'flag') && (
                                  <div>
                                    <Label htmlFor="moderation_reason">Reason *</Label>
                                    <Textarea
                                      id="moderation_reason"
                                      value={moderationReason}
                                      onChange={(e) => setModerationReason(e.target.value)}
                                      placeholder="Explain why this review is being rejected or flagged..."
                                      rows={3}
                                    />
                                  </div>
                                )}

                                {moderationAction && (
                                  <Alert>
                                    <AlertDescription>
                                      {moderationAction === 'approve' && 
                                        'The review will be published and visible to all users.'
                                      }
                                      {moderationAction === 'reject' && 
                                        'The review will be hidden and the user will be notified.'
                                      }
                                      {moderationAction === 'flag' && 
                                        'The review will be flagged for further review.'
                                      }
                                      {moderationAction === 'unflag' && 
                                        'The review will be unflagged and approved.'
                                      }
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={submitModeration}
                                    disabled={
                                      !moderationAction || 
                                      ((moderationAction === 'reject' || moderationAction === 'flag') && !moderationReason.trim()) ||
                                      submitting
                                    }
                                    className="flex-1"
                                  >
                                    {submitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                      </>
                                    ) : (
                                      `${moderationAction?.charAt(0).toUpperCase()}${moderationAction?.slice(1)} Review`
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedReview(null);
                                      setModerationAction(null);
                                      setModerationReason('');
                                    }}
                                    disabled={submitting}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
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
