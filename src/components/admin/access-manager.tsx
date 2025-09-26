'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Ban, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Key,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface AccessManagerProps {
  onAccessChanged?: () => void;
}

export function AccessManager({ onAccessChanged }: AccessManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Revocation form state
  const [revokeForm, setRevokeForm] = useState({
    revocation_type: '',
    purchase_id: '',
    user_id: '',
    app_id: '',
    license_id: '',
    reason: '',
    notify_user: true,
  });

  // Restoration form state
  const [restoreForm, setRestoreForm] = useState({
    restoration_type: '',
    purchase_id: '',
    user_id: '',
    app_id: '',
    license_id: '',
    reason: '',
    notify_user: true,
  });

  const handleRevoke = async () => {
    if (!revokeForm.revocation_type || !revokeForm.reason) {
      toast.error('Revocation type and reason are required');
      return;
    }

    // Validate required fields based on revocation type
    if (revokeForm.revocation_type === 'purchase' && !revokeForm.purchase_id) {
      toast.error('Purchase ID is required for purchase revocation');
      return;
    }

    if (revokeForm.revocation_type === 'user_app_access' && (!revokeForm.user_id || !revokeForm.app_id)) {
      toast.error('User ID and App ID are required for user app access revocation');
      return;
    }

    if (revokeForm.revocation_type === 'user_all_access' && !revokeForm.user_id) {
      toast.error('User ID is required for user all access revocation');
      return;
    }

    if (revokeForm.revocation_type === 'license' && !revokeForm.license_id) {
      toast.error('License ID is required for license revocation');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/access/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revokeForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Access revoked successfully. ${data.affected_records} record(s) affected.`);
        setShowRevokeDialog(false);
        setRevokeForm({
          revocation_type: '',
          purchase_id: '',
          user_id: '',
          app_id: '',
          license_id: '',
          reason: '',
          notify_user: true,
        });
        onAccessChanged?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreForm.restoration_type || !restoreForm.reason) {
      toast.error('Restoration type and reason are required');
      return;
    }

    // Validate required fields based on restoration type
    if (restoreForm.restoration_type === 'purchase' && !restoreForm.purchase_id) {
      toast.error('Purchase ID is required for purchase restoration');
      return;
    }

    if (restoreForm.restoration_type === 'user_app_access' && (!restoreForm.user_id || !restoreForm.app_id)) {
      toast.error('User ID and App ID are required for user app access restoration');
      return;
    }

    if (restoreForm.restoration_type === 'license' && !restoreForm.license_id) {
      toast.error('License ID is required for license restoration');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/access/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restoreForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Access restored successfully. ${data.affected_records} record(s) affected.`);
        setShowRestoreDialog(false);
        setRestoreForm({
          restoration_type: '',
          purchase_id: '',
          user_id: '',
          app_id: '',
          license_id: '',
          reason: '',
          notify_user: true,
        });
        onAccessChanged?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to restore access');
      }
    } catch (error) {
      console.error('Error restoring access:', error);
      toast.error('Failed to restore access');
    } finally {
      setLoading(false);
    }
  };

  const renderRevocationFields = () => {
    switch (revokeForm.revocation_type) {
      case 'purchase':
        return (
          <div>
            <Label htmlFor="purchase_id">Purchase ID *</Label>
            <Input
              id="purchase_id"
              value={revokeForm.purchase_id}
              onChange={(e) => setRevokeForm({ ...revokeForm, purchase_id: e.target.value })}
              placeholder="Enter purchase ID"
            />
          </div>
        );

      case 'user_app_access':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user_id">User ID *</Label>
              <Input
                id="user_id"
                value={revokeForm.user_id}
                onChange={(e) => setRevokeForm({ ...revokeForm, user_id: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="app_id">App ID *</Label>
              <Input
                id="app_id"
                value={revokeForm.app_id}
                onChange={(e) => setRevokeForm({ ...revokeForm, app_id: e.target.value })}
                placeholder="Enter app ID"
              />
            </div>
          </div>
        );

      case 'user_all_access':
        return (
          <div>
            <Label htmlFor="user_id_all">User ID *</Label>
            <Input
              id="user_id_all"
              value={revokeForm.user_id}
              onChange={(e) => setRevokeForm({ ...revokeForm, user_id: e.target.value })}
              placeholder="Enter user ID"
            />
          </div>
        );

      case 'license':
        return (
          <div>
            <Label htmlFor="license_id">License ID *</Label>
            <Input
              id="license_id"
              value={revokeForm.license_id}
              onChange={(e) => setRevokeForm({ ...revokeForm, license_id: e.target.value })}
              placeholder="Enter license ID"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderRestorationFields = () => {
    switch (restoreForm.restoration_type) {
      case 'purchase':
        return (
          <div>
            <Label htmlFor="restore_purchase_id">Purchase ID *</Label>
            <Input
              id="restore_purchase_id"
              value={restoreForm.purchase_id}
              onChange={(e) => setRestoreForm({ ...restoreForm, purchase_id: e.target.value })}
              placeholder="Enter purchase ID"
            />
          </div>
        );

      case 'user_app_access':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restore_user_id">User ID *</Label>
              <Input
                id="restore_user_id"
                value={restoreForm.user_id}
                onChange={(e) => setRestoreForm({ ...restoreForm, user_id: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="restore_app_id">App ID *</Label>
              <Input
                id="restore_app_id"
                value={restoreForm.app_id}
                onChange={(e) => setRestoreForm({ ...restoreForm, app_id: e.target.value })}
                placeholder="Enter app ID"
              />
            </div>
          </div>
        );

      case 'license':
        return (
          <div>
            <Label htmlFor="restore_license_id">License ID *</Label>
            <Input
              id="restore_license_id"
              value={restoreForm.license_id}
              onChange={(e) => setRestoreForm({ ...restoreForm, license_id: e.target.value })}
              placeholder="Enter license ID"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Access Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Revoke or restore access to purchases, licenses, and user accounts.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Ban className="w-4 h-4 mr-2" />
                Revoke Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Revoke Access
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="revocation_type">Revocation Type *</Label>
                  <Select
                    value={revokeForm.revocation_type}
                    onValueChange={(value) => setRevokeForm({ ...revokeForm, revocation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select revocation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Single Purchase
                        </div>
                      </SelectItem>
                      <SelectItem value="user_app_access">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          User App Access
                        </div>
                      </SelectItem>
                      <SelectItem value="user_all_access">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4" />
                          All User Access
                        </div>
                      </SelectItem>
                      <SelectItem value="license">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          License Key
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderRevocationFields()}

                <div>
                  <Label htmlFor="revoke_reason">Reason for Revocation *</Label>
                  <Textarea
                    id="revoke_reason"
                    value={revokeForm.reason}
                    onChange={(e) => setRevokeForm({ ...revokeForm, reason: e.target.value })}
                    placeholder="Explain why access is being revoked..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notify_user_revoke"
                    checked={revokeForm.notify_user}
                    onChange={(e) => setRevokeForm({ ...revokeForm, notify_user: e.target.checked })}
                  />
                  <Label htmlFor="notify_user_revoke" className="text-sm">
                    Send notification email to affected user
                  </Label>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This action will immediately revoke access and cannot be undone 
                    without manual restoration. The user will lose access to their purchased content.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleRevoke}
                    disabled={loading || !revokeForm.revocation_type || !revokeForm.reason}
                    variant="destructive"
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Revoke Access
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRevokeDialog(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Restore Access
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="restoration_type">Restoration Type *</Label>
                  <Select
                    value={restoreForm.restoration_type}
                    onValueChange={(value) => setRestoreForm({ ...restoreForm, restoration_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select restoration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Single Purchase
                        </div>
                      </SelectItem>
                      <SelectItem value="user_app_access">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          User App Access
                        </div>
                      </SelectItem>
                      <SelectItem value="license">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          License Key
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderRestorationFields()}

                <div>
                  <Label htmlFor="restore_reason">Reason for Restoration *</Label>
                  <Textarea
                    id="restore_reason"
                    value={restoreForm.reason}
                    onChange={(e) => setRestoreForm({ ...restoreForm, reason: e.target.value })}
                    placeholder="Explain why access is being restored..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notify_user_restore"
                    checked={restoreForm.notify_user}
                    onChange={(e) => setRestoreForm({ ...restoreForm, notify_user: e.target.checked })}
                  />
                  <Label htmlFor="notify_user_restore" className="text-sm">
                    Send notification email to affected user
                  </Label>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This action will restore access to previously revoked content. The user will 
                    regain access to their purchased apps and licenses.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleRestore}
                    disabled={loading || !restoreForm.restoration_type || !restoreForm.reason}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore Access
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRestoreDialog(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
