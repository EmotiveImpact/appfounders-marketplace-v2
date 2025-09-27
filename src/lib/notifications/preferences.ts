import { neonClient } from '@/lib/database/neon-client';

// Notification types
export enum NotificationType {
  // Account notifications
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_SECURITY = 'account_security',
  
  // Purchase notifications
  PURCHASE_CONFIRMATION = 'purchase_confirmation',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  
  // App notifications (for developers)
  APP_APPROVED = 'app_approved' as any,
  APP_REJECTED = 'app_rejected' as any,
  NEW_REVIEW = 'new_review',
  PAYOUT_PROCESSED = 'payout_processed',
  
  // Community notifications
  FORUM_REPLY = 'forum_reply',
  DIRECT_MESSAGE = 'direct_message',
  MENTION = 'mention',
  
  // Marketing notifications
  WEEKLY_DIGEST = 'weekly_digest',
  NEW_FEATURES = 'new_features',
  PROMOTIONAL = 'promotional',
  NEWSLETTER = 'newsletter',
  
  // System notifications
  MAINTENANCE = 'maintenance',
  SECURITY_ALERT = 'security_alert',
  POLICY_UPDATE = 'policy_update',
}

// Notification frequency options
export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never',
}

// Notification delivery methods
export enum DeliveryMethod {
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push',
  SMS = 'sms',
}

// Notification preference interface
export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  frequency: NotificationFrequency;
  created_at: string;
  updated_at: string;
}

// Default notification preferences for new users
export const DEFAULT_PREFERENCES: Partial<Record<NotificationType, Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>>> = {
  // Account notifications (always enabled for security)
  [NotificationType.WELCOME]: {
    notification_type: NotificationType.WELCOME,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.EMAIL_VERIFICATION]: {
    notification_type: NotificationType.EMAIL_VERIFICATION,
    email_enabled: true,
    in_app_enabled: false,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.PASSWORD_RESET]: {
    notification_type: NotificationType.PASSWORD_RESET,
    email_enabled: true,
    in_app_enabled: false,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.ACCOUNT_SECURITY]: {
    notification_type: NotificationType.ACCOUNT_SECURITY,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  
  // Purchase notifications
  [NotificationType.PURCHASE_CONFIRMATION]: {
    notification_type: NotificationType.PURCHASE_CONFIRMATION,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.PAYMENT_FAILED]: {
    notification_type: NotificationType.PAYMENT_FAILED,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  
  // App notifications (for developers)
  [NotificationType.APP_APPROVED]: {
    notification_type: NotificationType.APP_APPROVED,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.NEW_REVIEW]: {
    notification_type: NotificationType.NEW_REVIEW,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.DAILY,
  },
  
  // Community notifications
  [NotificationType.FORUM_REPLY]: {
    notification_type: NotificationType.FORUM_REPLY,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.DIRECT_MESSAGE]: {
    notification_type: NotificationType.DIRECT_MESSAGE,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  
  // Marketing notifications (opt-in by default)
  [NotificationType.WEEKLY_DIGEST]: {
    notification_type: NotificationType.WEEKLY_DIGEST,
    email_enabled: true,
    in_app_enabled: false,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.WEEKLY,
  },
  [NotificationType.NEW_FEATURES]: {
    notification_type: NotificationType.NEW_FEATURES,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.MONTHLY,
  },
  [NotificationType.PROMOTIONAL]: {
    notification_type: NotificationType.PROMOTIONAL,
    email_enabled: false,
    in_app_enabled: false,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.NEVER,
  },
  
  // System notifications
  [NotificationType.MAINTENANCE]: {
    notification_type: NotificationType.MAINTENANCE,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
  [NotificationType.SECURITY_ALERT]: {
    notification_type: NotificationType.SECURITY_ALERT,
    email_enabled: true,
    in_app_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    frequency: NotificationFrequency.IMMEDIATE,
  },
};

/**
 * Create default notification preferences for a new user
 */
export async function createDefaultPreferences(userId: string): Promise<void> {
  const preferences = Object.values(DEFAULT_PREFERENCES);
  
  for (const pref of preferences) {
    if (pref) {
      await neonClient.sql`
        INSERT INTO notification_preferences (
          user_id, 
          notification_type, 
          email_enabled, 
          in_app_enabled, 
          push_enabled, 
          sms_enabled, 
          frequency
        )
        VALUES (
          ${userId},
          ${pref.notification_type},
          ${pref.email_enabled},
          ${pref.in_app_enabled},
          ${pref.push_enabled},
          ${pref.sms_enabled},
          ${pref.frequency}
        )
        ON CONFLICT (user_id, notification_type) DO NOTHING
      `;
    }
  }
}

/**
 * Get user's notification preferences
 */
export async function getUserPreferences(userId: string): Promise<NotificationPreference[]> {
  const result = await neonClient.sql`
    SELECT * FROM notification_preferences
    WHERE user_id = ${userId}
    ORDER BY notification_type
  `;
  
  return result as NotificationPreference[];
}

/**
 * Get specific notification preference
 */
export async function getNotificationPreference(
  userId: string,
  notificationType: NotificationType
): Promise<NotificationPreference | null> {
  const result = await neonClient.sql`
    SELECT * FROM notification_preferences
    WHERE user_id = ${userId} AND notification_type = ${notificationType}
    LIMIT 1
  `;
  
  return result.length > 0 ? (result[0] as NotificationPreference) : null;
}

/**
 * Update notification preference
 */
export async function updateNotificationPreference(
  userId: string,
  notificationType: NotificationType,
  updates: Partial<Pick<NotificationPreference, 'email_enabled' | 'in_app_enabled' | 'push_enabled' | 'sms_enabled' | 'frequency'>>
): Promise<void> {
  const updateFields = [];
  const values = [];
  
  if (updates.email_enabled !== undefined) {
    updateFields.push('email_enabled = $' + (values.length + 1));
    values.push(updates.email_enabled);
  }
  if (updates.in_app_enabled !== undefined) {
    updateFields.push('in_app_enabled = $' + (values.length + 1));
    values.push(updates.in_app_enabled);
  }
  if (updates.push_enabled !== undefined) {
    updateFields.push('push_enabled = $' + (values.length + 1));
    values.push(updates.push_enabled);
  }
  if (updates.sms_enabled !== undefined) {
    updateFields.push('sms_enabled = $' + (values.length + 1));
    values.push(updates.sms_enabled);
  }
  if (updates.frequency !== undefined) {
    updateFields.push('frequency = $' + (values.length + 1));
    values.push(updates.frequency);
  }
  
  if (updateFields.length === 0) return;
  
  updateFields.push('updated_at = NOW()');
  
  await neonClient.sql`
    UPDATE notification_preferences
    SET ${updateFields.join(', ')}
    WHERE user_id = ${userId} AND notification_type = ${notificationType}
  `;
}

/**
 * Check if user should receive notification
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType,
  deliveryMethod: DeliveryMethod
): Promise<boolean> {
  const preference = await getNotificationPreference(userId, notificationType);
  
  if (!preference) {
    // If no preference exists, use default
    const defaultPref = DEFAULT_PREFERENCES[notificationType];
    if (!defaultPref) return false;
    
    switch (deliveryMethod) {
      case DeliveryMethod.EMAIL:
        return defaultPref.email_enabled;
      case DeliveryMethod.IN_APP:
        return defaultPref.in_app_enabled;
      case DeliveryMethod.PUSH:
        return defaultPref.push_enabled;
      case DeliveryMethod.SMS:
        return defaultPref.sms_enabled;
      default:
        return false;
    }
  }
  
  // Check if frequency allows sending
  if (preference.frequency === NotificationFrequency.NEVER) {
    return false;
  }
  
  // Check delivery method
  switch (deliveryMethod) {
    case DeliveryMethod.EMAIL:
      return preference.email_enabled;
    case DeliveryMethod.IN_APP:
      return preference.in_app_enabled;
    case DeliveryMethod.PUSH:
      return preference.push_enabled;
    case DeliveryMethod.SMS:
      return preference.sms_enabled;
    default:
      return false;
  }
}

/**
 * Bulk update preferences
 */
export async function bulkUpdatePreferences(
  userId: string,
  updates: Array<{
    notificationType: NotificationType;
    updates: Partial<Pick<NotificationPreference, 'email_enabled' | 'in_app_enabled' | 'push_enabled' | 'sms_enabled' | 'frequency'>>;
  }>
): Promise<void> {
  for (const update of updates) {
    await updateNotificationPreference(userId, update.notificationType, update.updates);
  }
}
