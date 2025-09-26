'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bell, Mail, Smartphone, MessageSquare, Shield, CreditCard, Star, Megaphone, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  frequency: string;
}

interface NotificationCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  types: Array<{
    type: string;
    label: string;
    description: string;
    required?: boolean;
  }>;
}

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    title: 'Account & Security',
    description: 'Important notifications about your account and security',
    icon: <Shield className="w-5 h-5" />,
    types: [
      {
        type: 'welcome',
        label: 'Welcome Messages',
        description: 'Welcome emails and onboarding information',
      },
      {
        type: 'email_verification',
        label: 'Email Verification',
        description: 'Email address verification requests',
        required: true,
      },
      {
        type: 'password_reset',
        label: 'Password Reset',
        description: 'Password reset and recovery emails',
        required: true,
      },
      {
        type: 'account_security',
        label: 'Security Alerts',
        description: 'Login attempts and security notifications',
        required: true,
      },
    ],
  },
  {
    title: 'Purchases & Payments',
    description: 'Notifications about your purchases and transactions',
    icon: <CreditCard className="w-5 h-5" />,
    types: [
      {
        type: 'purchase_confirmation',
        label: 'Purchase Confirmations',
        description: 'Receipts and download links for purchases',
      },
      {
        type: 'payment_failed',
        label: 'Payment Issues',
        description: 'Failed payments and billing problems',
      },
      {
        type: 'refund_processed',
        label: 'Refunds',
        description: 'Refund confirmations and processing updates',
      },
    ],
  },
  {
    title: 'App Development',
    description: 'Notifications for app developers',
    icon: <Settings className="w-5 h-5" />,
    types: [
      {
        type: 'app_approved',
        label: 'App Approvals',
        description: 'When your app submissions are approved',
      },
      {
        type: 'app_rejected',
        label: 'App Rejections',
        description: 'When your app submissions need changes',
      },
      {
        type: 'new_review',
        label: 'New Reviews',
        description: 'When users review your apps',
      },
      {
        type: 'payout_processed',
        label: 'Payouts',
        description: 'Developer payout notifications',
      },
    ],
  },
  {
    title: 'Community',
    description: 'Social interactions and community updates',
    icon: <MessageSquare className="w-5 h-5" />,
    types: [
      {
        type: 'forum_reply',
        label: 'Forum Replies',
        description: 'Replies to your forum posts and comments',
      },
      {
        type: 'direct_message',
        label: 'Direct Messages',
        description: 'Private messages from other users',
      },
      {
        type: 'mention',
        label: 'Mentions',
        description: 'When someone mentions you in discussions',
      },
    ],
  },
  {
    title: 'Marketing & Updates',
    description: 'Platform updates and promotional content',
    icon: <Megaphone className="w-5 h-5" />,
    types: [
      {
        type: 'weekly_digest',
        label: 'Weekly Digest',
        description: 'Weekly summary of platform activity',
      },
      {
        type: 'new_features',
        label: 'New Features',
        description: 'Announcements about new platform features',
      },
      {
        type: 'promotional',
        label: 'Promotional Emails',
        description: 'Special offers and promotional content',
      },
      {
        type: 'newsletter',
        label: 'Newsletter',
        description: 'Monthly newsletter with industry insights',
      },
    ],
  },
];

const FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'monthly', label: 'Monthly Digest' },
  { value: 'never', label: 'Never' },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      const data = await response.json();
      setPreferences(data.preferences || []);
    } catch (error: any) {
      setError(error.message);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const getPreference = (type: string): NotificationPreference | undefined => {
    return preferences.find(p => p.notification_type === type);
  };

  const updatePreference = async (
    type: string,
    field: keyof Pick<NotificationPreference, 'email_enabled' | 'in_app_enabled' | 'push_enabled' | 'sms_enabled' | 'frequency'>,
    value: boolean | string
  ) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationType: type,
          updates: { [field]: value },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      // Update local state
      setPreferences(prev => 
        prev.map(p => 
          p.notification_type === type 
            ? { ...p, [field]: value }
            : p
        )
      );

      toast.success('Preference updated successfully');
    } catch (error: any) {
      toast.error('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading notification preferences...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load notification preferences: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how and when you receive notifications from AppFounders.
            Some security-related notifications cannot be disabled.
          </CardDescription>
        </CardHeader>
      </Card>

      {NOTIFICATION_CATEGORIES.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {category.icon}
              {category.title}
            </CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {category.types.map((type, index) => {
              const preference = getPreference(type.type);
              const isRequired = type.required;

              return (
                <div key={type.type}>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            {type.label}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Delivery Methods
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">Email</span>
                            </div>
                            <Switch
                              checked={preference?.email_enabled ?? true}
                              onCheckedChange={(checked) => 
                                updatePreference(type.type, 'email_enabled', checked)
                              }
                              disabled={isRequired || saving}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4" />
                              <span className="text-sm">In-App</span>
                            </div>
                            <Switch
                              checked={preference?.in_app_enabled ?? true}
                              onCheckedChange={(checked) => 
                                updatePreference(type.type, 'in_app_enabled', checked)
                              }
                              disabled={saving}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              <span className="text-sm">Push</span>
                            </div>
                            <Switch
                              checked={preference?.push_enabled ?? false}
                              onCheckedChange={(checked) => 
                                updatePreference(type.type, 'push_enabled', checked)
                              }
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Frequency
                        </Label>
                        <Select
                          value={preference?.frequency ?? 'immediate'}
                          onValueChange={(value) => 
                            updatePreference(type.type, 'frequency', value)
                          }
                          disabled={isRequired || saving}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                disabled={isRequired && option.value === 'never'}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  {index < category.types.length - 1 && <Separator className="mt-6" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Note:</strong> Some notifications marked with * are required for security and legal compliance.
            </p>
            <p>
              Changes to your notification preferences take effect immediately. You can update these settings at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
