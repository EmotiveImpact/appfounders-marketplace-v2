'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProfileManager } from '@/components/user/profile-manager';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Crown,
  Calendar,
  Mail
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAccountInfo();
    }
  }, [user]);

  const loadAccountInfo = async () => {
    try {
      const response = await fetch('/api/user/account-info');
      if (response.ok) {
        const data = await response.json();
        setAccountInfo(data.accountInfo);
      }
    } catch (error) {
      console.error('Error loading account info:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'developer':
        return 'bg-blue-100 text-blue-800';
      case 'tester':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'developer':
        return <Settings className="w-4 h-4" />;
      case 'tester':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile, preferences, and account security
            </p>
          </div>
        </div>

        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge className={`${getRoleBadgeColor(user?.role || '')} flex items-center gap-1`}>
                  {getRoleIcon(user?.role || '')}
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Status</span>
                <div className="flex items-center gap-1">
                  {user?.email_verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Unverified</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {user?.role === 'developer' ? 'Apps Published' : 'Apps Tested'}
                </span>
                <span className="font-medium">{accountInfo?.apps_count || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reviews Written</span>
                <span className="font-medium">{accountInfo?.reviews_count || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {user?.role === 'developer' ? 'Total Earned' : 'Total Spent'}
                </span>
                <span className="font-medium">
                  ${accountInfo?.total_amount || '0.00'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Two-Factor Auth</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Login Sessions</span>
                <span className="font-medium">1 Active</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Login</span>
                <span className="text-sm">
                  {accountInfo?.last_login ? new Date(accountInfo.last_login).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Verification Alert */}
        {!user?.email_verified && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Your email address is not verified. Please check your inbox for a verification email.
              <button className="ml-2 text-blue-600 hover:underline">
                Resend verification email
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Management */}
        <ProfileManager />
      </div>
    </AuthGuard>
  );
}
