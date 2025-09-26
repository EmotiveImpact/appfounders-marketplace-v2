'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ConnectedAccount {
  id: string;
  stripe_account_id: string;
  account_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  verification_status: string;
}

interface Earnings {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  salesCount: number;
}

interface ConnectData {
  connected: boolean;
  account: ConnectedAccount | null;
  earnings: Earnings | null;
}

export function ConnectDashboard() {
  const [connectData, setConnectData] = useState<ConnectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchConnectData();
  }, []);

  const fetchConnectData = async () => {
    try {
      const response = await fetch('/api/stripe/connect');
      if (!response.ok) {
        throw new Error('Failed to fetch Connect data');
      }
      const data = await response.json();
      setConnectData(data);
    } catch (error: any) {
      toast.error('Failed to load Connect data');
      console.error('Error fetching Connect data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConnectAccount = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: 'US' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create Connect account');
      }

      const data = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const createAccountLink = async (type: 'account_onboarding' | 'account_update' = 'account_update') => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/stripe/connect/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account link');
      }

      const data = await response.json();
      
      // Redirect to Stripe
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusBadge = (account: ConnectedAccount) => {
    if (account.charges_enabled && account.payouts_enabled) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    } else if (account.details_submitted) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Setup Required</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading Connect dashboard...
        </CardContent>
      </Card>
    );
  }

  if (!connectData?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Stripe Connect Setup
          </CardTitle>
          <CardDescription>
            Set up your Stripe Connect account to receive payments from app sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to set up a Stripe Connect account to receive payments from your app sales.
              This is required to enable automatic commission splitting and payouts.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-medium">What you'll get:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Automatic 80/20 revenue split (80% to you, 20% platform fee)</li>
              <li>• Direct payments to your bank account</li>
              <li>• Real-time earnings tracking</li>
              <li>• Tax reporting and compliance</li>
            </ul>
          </div>

          <Button 
            onClick={createConnectAccount} 
            disabled={actionLoading}
            className="w-full"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Set Up Stripe Connect
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { account, earnings } = connectData;

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Stripe Connect Account
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(account!)}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchConnectData}
                disabled={actionLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Account ID: {account!.stripe_account_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Charges</span>
                {account!.charges_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payouts</span>
                {account!.payouts_enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Details Submitted</span>
                {account!.details_submitted ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <span className="text-sm capitalize">{account!.account_type}</span>
              </div>
            </div>
          </div>

          {(!account!.charges_enabled || !account!.payouts_enabled) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account setup is incomplete. Complete the setup to start receiving payments.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => createAccountLink('account_update')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Update Account
            </Button>
            
            {!account!.details_submitted && (
              <Button
                onClick={() => createAccountLink('account_onboarding')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(earnings.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                80% of gross sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(earnings.pendingPayouts)}</div>
              <p className="text-xs text-muted-foreground">
                Processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(earnings.completedPayouts)}</div>
              <p className="text-xs text-muted-foreground">
                Paid out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{earnings.salesCount}</div>
              <p className="text-xs text-muted-foreground">
                App purchases
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
