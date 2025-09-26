import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

// Notification types
export enum NotificationType {
  PURCHASE_CONFIRMATION = 'purchase_confirmation',
  APP_UPDATE = 'app_update',
  NEW_MESSAGE = 'new_message',
  REVIEW_RESPONSE = 'review_response',
  COMMUNITY_MENTION = 'community_mention',
  DEVELOPER_PAYOUT = 'developer_payout',
  APP_APPROVED = 'app_approved',
  APP_REJECTED = 'app_rejected',
  PRICE_DROP = 'price_drop',
  WISHLIST_AVAILABLE = 'wishlist_available',
}

// Notification data interface
interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  priority?: 'default' | 'high' | 'max';
  categoryId?: string;
}

// Notification preferences
interface NotificationPreferences {
  purchases: boolean;
  appUpdates: boolean;
  messages: boolean;
  community: boolean;
  marketing: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  purchases: true,
  appUpdates: true,
  messages: true,
  community: true,
  marketing: false,
  sound: true,
  vibration: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;

  constructor() {
    this.initializeNotifications();
    this.loadPreferences();
  }

  // Initialize notification system
  private async initializeNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const preferences = await this.getPreferences();
        const isQuietHours = this.isQuietHours(preferences.quietHours);
        
        return {
          shouldShowAlert: !isQuietHours,
          shouldPlaySound: preferences.sound && !isQuietHours,
          shouldSetBadge: true,
        };
      },
    });

    // Set notification categories
    await this.setupNotificationCategories();

    // Request permissions and get token
    await this.requestPermissions();
  }

  // Setup notification categories for interactive notifications
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('message', [
      {
        identifier: 'reply',
        buttonTitle: 'Reply',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'mark_read',
        buttonTitle: 'Mark as Read',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('purchase', [
      {
        identifier: 'view_app',
        buttonTitle: 'View App',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'download',
        buttonTitle: 'Download',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('review', [
      {
        identifier: 'respond',
        buttonTitle: 'Respond',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'view_review',
        buttonTitle: 'View Review',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    // Get the push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      await this.registerTokenWithServer(token.data);
      return true;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return false;
    }
  }

  // Register push token with server
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiService.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Constants.deviceId,
      });
    } catch (error) {
      console.error('Failed to register push token with server:', error);
    }
  }

  // Load notification preferences
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  // Save notification preferences
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await AsyncStorage.setItem(
        'notification_preferences',
        JSON.stringify(this.preferences)
      );
      
      // Update server preferences
      await apiService.put('/notifications/preferences', this.preferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  // Get current preferences
  async getPreferences(): Promise<NotificationPreferences> {
    return this.preferences;
  }

  // Check if current time is within quiet hours
  private isQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day range (e.g., 22:00 to 23:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Schedule local notification
  async scheduleLocalNotification(
    notificationData: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const preferences = await this.getPreferences();
    
    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(notificationData.type, preferences)) {
      throw new Error('Notification type is disabled');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        sound: notificationData.sound && preferences.sound,
        badge: notificationData.badge,
        priority: notificationData.priority || 'default',
        categoryIdentifier: notificationData.categoryId,
      },
      trigger: trigger || null,
    });

    return notificationId;
  }

  // Check if notification type is enabled
  private isNotificationTypeEnabled(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case NotificationType.PURCHASE_CONFIRMATION:
      case NotificationType.DEVELOPER_PAYOUT:
        return preferences.purchases;
      
      case NotificationType.APP_UPDATE:
      case NotificationType.APP_APPROVED:
      case NotificationType.APP_REJECTED:
        return preferences.appUpdates;
      
      case NotificationType.NEW_MESSAGE:
        return preferences.messages;
      
      case NotificationType.REVIEW_RESPONSE:
      case NotificationType.COMMUNITY_MENTION:
        return preferences.community;
      
      case NotificationType.PRICE_DROP:
      case NotificationType.WISHLIST_AVAILABLE:
        return preferences.marketing;
      
      default:
        return true;
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification response (user tapped notification)
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get all pending notifications
  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get notification history from server
  async getNotificationHistory(limit = 50, offset = 0) {
    try {
      return await apiService.get(`/notifications/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiService.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get('/notifications/unread-count');
      return response.data.count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Update app badge count
  async updateBadgeCount(): Promise<void> {
    try {
      const count = await this.getUnreadCount();
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  // Test notification (for debugging)
  async sendTestNotification(): Promise<void> {
    await this.scheduleLocalNotification({
      type: NotificationType.APP_UPDATE,
      title: 'Test Notification',
      body: 'This is a test notification from AppFounders',
      data: { test: true },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
