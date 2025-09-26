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
  User,
  Building,
  FileText,
  CreditCard,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface VerificationReview {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  legal_name: string;
  date_of_birth: string;
  phone_number: string;
  address: any;
  business_type: 'individual' | 'business';
  business_name?: string;
  business_registration_number?: string;
  business_address?: any;
  tax_id_type: string;
  tax_country: string;
  identity_document_type: string;
  identity_document_front: string;
  identity_document_back?: string;
  verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
  submitted_at: string;
  created_at: string;
}

interface VerificationReviewProps {
  onStatusUpdate?: () => void;
}

export function VerificationReview({ onStatusUpdate }: VerificationReviewProps) {
  const [verifications, setVerifications] = useState<VerificationReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationReview | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/verifications');
      
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications || []);
      } else {
        toast.error('Failed to load verifications');
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedVerification || !reviewAction) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/verifications/${selectedVerification.id}/review`, {
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
        toast.success(`Verification ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        setSelectedVerification(null);
        setReviewAction(null);
        setRejectionReason('');
        loadVerifications();
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
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Developer Verifications</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Developer Verifications
          <Badge variant="outline">
            {verifications.filter(v => v.verification_status === 'in_review').length} Pending Review
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verifications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Verifications</h3>
            <p className="text-muted-foreground">
              No developer verifications have been submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{verification.legal_name}</h4>
                      {getStatusBadge(verification.verification_status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {verification.user_email} • {verification.business_type}
                      {verification.business_name && ` • ${verification.business_name}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted: {formatDate(verification.submitted_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVerification(verification)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Review Verification - {verification.legal_name}
                          </DialogTitle>
                        </DialogHeader>

                        {selectedVerification && (
                          <Tabs defaultValue="personal" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="personal">Personal</TabsTrigger>
                              <TabsTrigger value="business">Business</TabsTrigger>
                              <TabsTrigger value="documents">Documents</TabsTrigger>
                              <TabsTrigger value="review">Review</TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Personal Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Legal Name</Label>
                                      <p className="text-sm">{selectedVerification.legal_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Date of Birth</Label>
                                      <p className="text-sm">{selectedVerification.date_of_birth}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Phone Number</Label>
                                      <p className="text-sm">{selectedVerification.phone_number}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm">{selectedVerification.user_email}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Address</Label>
                                    <p className="text-sm">
                                      {selectedVerification.address.street}<br />
                                      {selectedVerification.address.city}, {selectedVerification.address.state} {selectedVerification.address.postal_code}<br />
                                      {selectedVerification.address.country}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="business" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Building className="w-5 h-5" />
                                    Business Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Business Type</Label>
                                      <p className="text-sm capitalize">{selectedVerification.business_type}</p>
                                    </div>
                                    {selectedVerification.business_name && (
                                      <div>
                                        <Label className="text-sm font-medium">Business Name</Label>
                                        <p className="text-sm">{selectedVerification.business_name}</p>
                                      </div>
                                    )}
                                    {selectedVerification.business_registration_number && (
                                      <div>
                                        <Label className="text-sm font-medium">Registration Number</Label>
                                        <p className="text-sm">{selectedVerification.business_registration_number}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-sm font-medium">Tax Country</Label>
                                      <p className="text-sm">{selectedVerification.tax_country}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Tax ID Type</Label>
                                      <p className="text-sm uppercase">{selectedVerification.tax_id_type}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Identity Documents
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">Document Type</Label>
                                    <p className="text-sm capitalize">
                                      {selectedVerification.identity_document_type.replace('_', ' ')}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Front of Document</Label>
                                      <div className="mt-2">
                                        <img
                                          src={selectedVerification.identity_document_front}
                                          alt="Document Front"
                                          className="w-full h-48 object-cover border rounded-lg"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="mt-2 w-full"
                                          onClick={() => window.open(selectedVerification.identity_document_front, '_blank')}
                                        >
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          View Full Size
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {selectedVerification.identity_document_back && (
                                      <div>
                                        <Label className="text-sm font-medium">Back of Document</Label>
                                        <div className="mt-2">
                                          <img
                                            src={selectedVerification.identity_document_back}
                                            alt="Document Back"
                                            className="w-full h-48 object-cover border rounded-lg"
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 w-full"
                                            onClick={() => window.open(selectedVerification.identity_document_back!, '_blank')}
                                          >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Full Size
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
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
                                      Approve Verification
                                    </Button>
                                    <Button
                                      variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                                      onClick={() => setReviewAction('reject')}
                                      className="flex-1"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject Verification
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
                                          ? 'The developer will be notified of approval and can start publishing apps.'
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
  );
}
