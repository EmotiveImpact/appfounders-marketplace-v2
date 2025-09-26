'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Key, 
  Copy, 
  CheckCircle, 
  XCircle,
  Clock,
  Shield,
  Download,
  Loader2,
  Calendar,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface License {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  issued_at: string;
  expires_at?: string;
  last_validated_at?: string;
  custom_data?: any;
}

interface Purchase {
  id: string;
  app_id: string;
  app_name: string;
  amount: number;
  purchased_at: string;
  requires_license: boolean;
}

interface LicenseManagerProps {
  purchase: Purchase;
  onLicenseGenerated?: (license: License) => void;
}

export function LicenseManager({ purchase, onLicenseGenerated }: LicenseManagerProps) {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (purchase.requires_license) {
      loadLicense();
    } else {
      setLoading(false);
    }
  }, [purchase.id]);

  const loadLicense = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/licenses/generate?purchase_id=${purchase.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.has_license) {
          setLicense(data.license);
        }
      }
    } catch (error) {
      console.error('Error loading license:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLicense = async () => {
    try {
      setGenerating(true);

      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchase_id: purchase.id,
          license_type: 'standard',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLicense(data.license);
        toast.success('License key generated successfully');
        onLicenseGenerated?.(data.license);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate license key');
      }
    } catch (error) {
      console.error('Error generating license:', error);
      toast.error('Failed to generate license key');
    } finally {
      setGenerating(false);
    }
  };

  const copyLicenseKey = async () => {
    if (license?.license_key) {
      try {
        await navigator.clipboard.writeText(license.license_key);
        toast.success('License key copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy license key');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const maskLicenseKey = (key: string) => {
    if (!key) return '';
    const parts = key.split('-');
    return parts.map((part, index) => 
      index === 0 || index === parts.length - 1 
        ? part 
        : '****'
    ).join('-');
  };

  if (!purchase.requires_license) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This app does not require a license key. You can download and use it immediately.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            License Key
          </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          License Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {license ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">License Status</h4>
                {getStatusBadge(license.status)}
              </div>
              <Badge variant="outline" className="capitalize">
                {license.license_type}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">License Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                    {showKey ? license.license_key : maskLicenseKey(license.license_key)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLicenseKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-muted-foreground">Issued</label>
                  <p className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(license.issued_at)}
                  </p>
                </div>
                {license.expires_at && (
                  <div>
                    <label className="font-medium text-muted-foreground">Expires</label>
                    <p className="flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(license.expires_at)}
                    </p>
                  </div>
                )}
                {license.last_validated_at && (
                  <div>
                    <label className="font-medium text-muted-foreground">Last Validated</label>
                    <p className="flex items-center gap-1 mt-1">
                      <Shield className="w-4 h-4" />
                      {formatDate(license.last_validated_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {license.status === 'expired' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your license has expired. Please contact support to renew your license.
                </AlertDescription>
              </Alert>
            )}

            {license.status === 'suspended' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your license has been suspended. Please contact support for assistance.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Activation Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Download and install {purchase.app_name}</li>
                <li>2. Launch the application</li>
                <li>3. Enter your license key when prompted</li>
                <li>4. Follow the activation wizard</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                This app requires a license key for activation. Generate your license key to get started.
              </AlertDescription>
            </Alert>

            <Button
              onClick={generateLicense}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating License...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Generate License Key
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
