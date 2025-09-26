'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  User,
  CheckCircle,
  Send,
  Edit,
  Trash2,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  user_id: string;
  app_id: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  verified_purchase: boolean;
  status: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  developer_response?: {
    id: string;
    content: string;
    created_at: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function ReviewSystem({ 
  appId, 
  currentUserId,
  isDeveloper = false 
}: { 
  appId: string;
  currentUserId?: string;
  isDeveloper?: boolean;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');
  
  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // New review form
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  // Developer response form
  const [responseForm, setResponseForm] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [appId, ratingFilter, sortBy, verifiedOnly]);

  const loadReviews = async () => {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        sort_by: sortBy,
        verified_only: verifiedOnly.toString(),
      });

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }

      const response = await fetch(`/api/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/stats?app_id=${appId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load review stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          ...newReview,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      setNewReview({ rating: 5, title: '', content: '' });
      toast.success('Review submitted successfully');
      loadReviews();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'helpful' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark review as helpful');
      }

      loadReviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const submitDeveloperResponse = async (reviewId: string) => {
    try {
      const content = responseForm[reviewId];
      if (!content || content.trim().length === 0) {
        toast.error('Response content is required');
        return;
      }

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'respond',
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit response');
      }

      setResponseForm(prev => ({ ...prev, [reviewId]: '' }));
      toast.success('Response submitted successfully');
      loadReviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats || stats.total_reviews === 0) return 0;
    return (stats.rating_distribution[rating as keyof typeof stats.rating_distribution] / stats.total_reviews) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Reviews & Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {stats.average_rating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Progress 
                      value={getRatingPercentage(rating)} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {stats.rating_distribution[rating as keyof typeof stats.rating_distribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reviews">All Reviews</TabsTrigger>
          {currentUserId && !isDeveloper && (
            <TabsTrigger value="write">Write Review</TabsTrigger>
          )}
        </TabsList>

        {/* Reviews List */}
        <TabsContent value="reviews" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Label>Filter by rating:</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="5">5 stars</SelectItem>
                      <SelectItem value="4">4 stars</SelectItem>
                      <SelectItem value="3">3 stars</SelectItem>
                      <SelectItem value="2">2 stars</SelectItem>
                      <SelectItem value="1">1 star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label>Sort by:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="highest_rated">Highest Rated</SelectItem>
                      <SelectItem value="lowest_rated">Lowest Rated</SelectItem>
                      <SelectItem value="most_helpful">Most Helpful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <Label htmlFor="verified">Verified purchases only</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this app!</p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {review.user_avatar ? (
                            <img
                              src={review.user_avatar}
                              alt={review.user_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.user_name}</span>
                              {review.verified_purchase && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div>
                        <h4 className="font-medium mb-2">{review.title}</h4>
                        <p className="text-muted-foreground">{review.content}</p>
                      </div>

                      {/* Review Actions */}
                      <div className="flex items-center gap-4">
                        {currentUserId && currentUserId !== review.user_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markHelpful(review.id)}
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Helpful ({review.helpful_count})
                          </Button>
                        )}
                      </div>

                      {/* Developer Response */}
                      {review.developer_response && (
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">Developer Response</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.developer_response.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{review.developer_response.content}</p>
                        </div>
                      )}

                      {/* Developer Response Form */}
                      {isDeveloper && !review.developer_response && (
                        <div className="border-t pt-4">
                          <div className="space-y-2">
                            <Label>Respond to this review</Label>
                            <Textarea
                              value={responseForm[review.id] || ''}
                              onChange={(e) => setResponseForm(prev => ({
                                ...prev,
                                [review.id]: e.target.value
                              }))}
                              placeholder="Write your response..."
                              rows={3}
                              maxLength={1000}
                            />
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">
                                {(responseForm[review.id] || '').length}/1000 characters
                              </span>
                              <Button
                                size="sm"
                                onClick={() => submitDeveloperResponse(review.id)}
                                disabled={!responseForm[review.id]?.trim()}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Response
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Write Review Tab */}
        {currentUserId && !isDeveloper && (
          <TabsContent value="write">
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2">
                    {renderStars(newReview.rating, true, (rating) => 
                      setNewReview(prev => ({ ...prev, rating }))
                    )}
                    <span className="text-sm text-muted-foreground">
                      ({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Review Title</Label>
                  <Input
                    id="title"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newReview.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Review Content</Label>
                  <Textarea
                    id="content"
                    value={newReview.content}
                    onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your detailed experience with this app..."
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newReview.content.length}/2000 characters (minimum 10)
                  </p>
                </div>

                <Button
                  onClick={submitReview}
                  disabled={
                    submitting || 
                    !newReview.title.trim() || 
                    newReview.content.trim().length < 10
                  }
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
