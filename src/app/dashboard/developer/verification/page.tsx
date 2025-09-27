'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { DeveloperVerificationFlow } from '@/components/developer/verification-flow';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  FileText,
  Building,
  CreditCard,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface VerificationStatus {
  status: 'pending' | 'in_review' | 'verified' | 'rejected' | null;
  submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  legal_name?: string;
  business_type?: string;
  business_name?: string;
}

export default function DeveloperVerificationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [verification, setVerification] = useState<VerificationStatus>({ status: null });
  const [loading, setLoading] = useState(true);
  const [showFlow, setShowFlow] = useState(false);

  useEffect(() => {
    if (user && (user as any).role === 'developer') {
      loadVerificationStatus();
    }
  }, [user]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/verification');
      
      if (response.ok) {
        const data = await response.json();
        setVerification(data.verification || { status: null });
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        );
      case 'in_review':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4 mr-1" />
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Not Started
          </Badge>
        );
    }
  };

  const getStatusDescription = (status: string | null) => {
    switch (status) {
      case 'verified':
        return 'Your developer account has been verified. You can now publish apps and receive payments.';
      case 'in_review':
        return 'Your verification is being reviewed by our team. This typically takes 2-3 business days.';
      case 'rejected':
        return 'Your verification was rejected. Please review the feedback and resubmit with corrections.';
      case 'pending':
        return 'Your verification has been submitted and is waiting for review.';
      default:
        return 'Complete the verification process to publish apps and receive payments on the platform.';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'developer') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page is only accessible to developers. Please contact support if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showFlow) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
          <DeveloperVerificationFlow
            userId={(user as any)?.id}
            onComplete={() => {
              setShowFlow(false);
              loadVerificationStatus();
            }}
          />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Developer Verification</h1>
            <p className="text-muted-foreground mt-1">
              Verify your identity to publish apps and receive payments
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadVerificationStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification Status
              </div>
              {getStatusBadge(verification.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {getStatusDescription(verification.status)}
            </p>

            {verification.status === 'verified' && verification.verified_at && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Verification Complete</span>
                </div>
                <p className="text-green-700 mt-1">
                  Verified on {new Date(verification.verified_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {verification.status === 'in_review' && verification.submitted_at && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Under Review</span>
                </div>
                <p className="text-blue-700 mt-1">
                  Submitted on {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {verification.status === 'rejected' && verification.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Verification Rejected</span>
                </div>
                <p className="text-red-700 mt-1">
                  {verification.rejection_reason}
                </p>
              </div>
            )}

            {verification.legal_name && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Verification Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Legal Name:</span>
                    <span className="ml-2">{verification.legal_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business Type:</span>
                    <span className="ml-2 capitalize">{verification.business_type}</span>
                  </div>
                  {verification.business_name && (
                    <div>
                      <span className="text-muted-foreground">Business Name:</span>
                      <span className="ml-2">{verification.business_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!verification.status || verification.status === 'rejected') && (
              <Button onClick={() => setShowFlow(true)} className="w-full">
                {verification.status === 'rejected' ? 'Resubmit Verification' : 'Start Verification'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Verification Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Personal Info</h4>
                  <p className="text-sm text-muted-foreground">
                    Legal name, address, and contact details
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Business Info</h4>
                  <p className="text-sm text-muted-foreground">
                    Business type and registration details
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Tax & Identity</h4>
                  <p className="text-sm text-muted-foreground">
                    Tax ID and government-issued ID
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Banking</h4>
                  <p className="text-sm text-muted-foreground">
                    Bank account for receiving payments
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits of Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits of Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Publish Apps</h4>
                <p className="text-sm text-muted-foreground">
                  Upload and sell your applications on the marketplace
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">Receive Payments</h4>
                <p className="text-sm text-muted-foreground">
                  Get paid directly to your bank account with 80% revenue share
                </p>
              </div>

              <div className="text-center p-4">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">Trusted Badge</h4>
                <p className="text-sm text-muted-foreground">
                  Display verified developer badge to build user trust
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
