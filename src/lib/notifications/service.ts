import { neonClient } from '@/lib/database/neon-client';
import { sendTemplatedEmail } from '@/lib/email/service';
import { 
  shouldSendNotification, 
  NotificationType, 
  DeliveryMethod 
} from './preferences';

export interface NotificationData {
  id?: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  expires_at?: Date;
}

/**
 * Send a notification through multiple channels based on user preferences
 */
export async function sendNotification(
  userId: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>,
  emailData?: any
): Promise<{ success: boolean; channels: string[] }> {
  const sentChannels: string[] = [];
  
  try {
    // Check if user should receive in-app notification
    const shouldSendInApp = await shouldSendNotification(
      userId,
      notificationType,
      DeliveryMethod.IN_APP
    );
    
    if (shouldSendInApp) {
      await createInAppNotification({
        user_id: userId,
        notification_type: notificationType,
        title,
        message,
        data,
      });
      sentChannels.push('in-app');
    }
    
    // Check if user should receive email notification
    const shouldSendEmail = await shouldSendNotification(
      userId,
      notificationType,
      DeliveryMethod.EMAIL
    );
    
    if (shouldSendEmail && emailData) {
      // Get user email
      const userResult = await neonClient.sql`
        SELECT email, name FROM users WHERE id = ${userId} LIMIT 1
      `;
      
      if (userResult.length > 0) {
        const user = userResult[0];
        const emailSent = await sendTemplatedEmail(
          notificationType as any,
          user.email,
          { ...emailData, userName: user.name }
        );
        
        if (emailSent) {
          sentChannels.push('email');
        }
      }
    }
    
    // TODO: Add push notification support
    // const shouldSendPush = await shouldSendNotification(
    //   userId,
    //   notificationType,
    //   DeliveryMethod.PUSH
    // );
    
    return {
      success: sentChannels.length > 0,
      channels: sentChannels,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      channels: [],
    };
  }
}

/**
 * Create an in-app notification
 */
export async function createInAppNotification(
  notification: NotificationData
): Promise<string> {
  const result = await neonClient.sql`
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      data,
      expires_at
    )
    VALUES (
      ${notification.user_id},
      ${notification.notification_type},
      ${notification.title},
      ${notification.message},
      ${JSON.stringify(notification.data || {})},
      ${notification.expires_at?.toISOString() || null}
    )
    RETURNING id
  `;
  
  return result[0].id;
}

/**
 * Get user's in-app notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<NotificationData[]> {
  const whereClause = unreadOnly 
    ? `WHERE user_id = ${userId} AND read = false`
    : `WHERE user_id = ${userId}`;
  
  const result = await neonClient.sql`
    SELECT * FROM notifications
    ${whereClause}
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  return result.map(row => ({
    ...row,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
  })) as NotificationData[];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await neonClient.sql`
    UPDATE notifications
    SET read = true, read_at = NOW()
    WHERE id = ${notificationId} AND user_id = ${userId}
  `;
  
  return result.length > 0;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await neonClient.sql`
    UPDATE notifications
    SET read = true, read_at = NOW()
    WHERE user_id = ${userId} AND read = false
  `;
  
  return result.length;
}

/**
 * Delete notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await neonClient.sql`
    DELETE FROM notifications
    WHERE id = ${notificationId} AND user_id = ${userId}
  `;
  
  return result.length > 0;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await neonClient.sql`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ${userId} 
    AND read = false
    AND (expires_at IS NULL OR expires_at > NOW())
  `;
  
  return parseInt(result[0].count);
}

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  const result = await neonClient.sql`
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at <= NOW()
  `;
  
  return result.length;
}

/**
 * Send welcome notification
 */
export async function sendWelcomeNotification(
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  await sendNotification(
    userId,
    NotificationType.WELCOME,
    'Welcome to AppFounders! 🎉',
    `Hi ${userName}! Welcome to the AppFounders beta tester marketplace. Start exploring apps and earning rewards for your feedback.`,
    {
      action: 'explore_apps',
      url: '/dashboard',
    },
    {
      userName,
      userEmail,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
    }
  );
}

/**
 * Send app approval notification
 */
export async function sendAppApprovalNotification(
  developerId: string,
  appName: string,
  appId: string
): Promise<void> {
  await sendNotification(
    developerId,
    NotificationType.APP_APPROVED,
    'Your app has been approved! 🎉',
    `Great news! Your app "${appName}" has been approved and is now live on the marketplace.`,
    {
      action: 'view_app',
      appId,
      url: `/apps/${appId}`,
    },
    {
      appName,
      appUrl: `${process.env.NEXTAUTH_URL}/apps/${appId}`,
      dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard/developer`,
    }
  );
}

/**
 * Send purchase confirmation notification
 */
export async function sendPurchaseNotification(
  userId: string,
  appName: string,
  amount: string,
  downloadUrl: string,
  receiptUrl: string
): Promise<void> {
  await sendNotification(
    userId,
    NotificationType.PURCHASE_CONFIRMATION,
    'Purchase confirmed! 🛒',
    `Your purchase of "${appName}" has been confirmed. You can now download the app.`,
    {
      action: 'download_app',
      url: downloadUrl,
      appName,
      amount,
    },
    {
      appName,
      amount,
      downloadUrl,
      receiptUrl,
    }
  );
}

/**
 * Send new review notification
 */
export async function sendNewReviewNotification(
  developerId: string,
  appName: string,
  reviewerName: string,
  rating: number,
  comment: string,
  appId: string
): Promise<void> {
  await sendNotification(
    developerId,
    NotificationType.NEW_REVIEW,
    'New review for your app ⭐',
    `${reviewerName} left a ${rating}-star review for "${appName}".`,
    {
      action: 'view_reviews',
      appId,
      url: `/dashboard/developer/apps/${appId}/reviews`,
      rating,
      reviewerName,
    },
    {
      appName,
      reviewerName,
      rating,
      comment,
      appUrl: `${process.env.NEXTAUTH_URL}/apps/${appId}`,
    }
  );
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedNotification(
  userId: string,
  appName: string,
  amount: string,
  reason: string,
  retryUrl: string
): Promise<void> {
  await sendNotification(
    userId,
    NotificationType.PAYMENT_FAILED,
    'Payment failed ❌',
    `Your payment for "${appName}" could not be processed. Please try again.`,
    {
      action: 'retry_payment',
      url: retryUrl,
      appName,
      amount,
      reason,
    },
    {
      appName,
      amount,
      reason,
      retryUrl,
    }
  );
}
