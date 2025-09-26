import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import {
  getUserPreferences,
  updateNotificationPreference,
  bulkUpdatePreferences,
  createDefaultPreferences,
  NotificationType,
  NotificationFrequency,
} from '@/lib/notifications/preferences';

// GET /api/notifications/preferences - Get user's notification preferences
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const preferences = await getUserPreferences(user.id);
      
      // If no preferences exist, create defaults
      if (preferences.length === 0) {
        await createDefaultPreferences(user.id);
        const newPreferences = await getUserPreferences(user.id);
        return NextResponse.json({
          success: true,
          preferences: newPreferences,
        });
      }
      
      return NextResponse.json({
        success: true,
        preferences,
      });
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// PUT /api/notifications/preferences - Update notification preferences
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { preferences } = body;

      if (!preferences || !Array.isArray(preferences)) {
        return NextResponse.json(
          { error: 'Preferences array is required' },
          { status: 400 }
        );
      }

      // Validate each preference update
      const validUpdates = [];
      for (const pref of preferences) {
        const { notificationType, updates } = pref;

        // Validate notification type
        if (!Object.values(NotificationType).includes(notificationType)) {
          return NextResponse.json(
            { error: `Invalid notification type: ${notificationType}` },
            { status: 400 }
          );
        }

        // Validate frequency if provided
        if (updates.frequency && !Object.values(NotificationFrequency).includes(updates.frequency)) {
          return NextResponse.json(
            { error: `Invalid frequency: ${updates.frequency}` },
            { status: 400 }
          );
        }

        // Validate boolean fields
        const booleanFields = ['email_enabled', 'in_app_enabled', 'push_enabled', 'sms_enabled'];
        for (const field of booleanFields) {
          if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
            return NextResponse.json(
              { error: `${field} must be a boolean` },
              { status: 400 }
            );
          }
        }

        validUpdates.push({ notificationType, updates });
      }

      // Update preferences
      await bulkUpdatePreferences(user.id, validUpdates);

      // Return updated preferences
      const updatedPreferences = await getUserPreferences(user.id);

      return NextResponse.json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: updatedPreferences,
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// PATCH /api/notifications/preferences - Update single preference
export const PATCH = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { notificationType, updates } = body;

      if (!notificationType || !updates) {
        return NextResponse.json(
          { error: 'Notification type and updates are required' },
          { status: 400 }
        );
      }

      // Validate notification type
      if (!Object.values(NotificationType).includes(notificationType)) {
        return NextResponse.json(
          { error: `Invalid notification type: ${notificationType}` },
          { status: 400 }
        );
      }

      // Validate frequency if provided
      if (updates.frequency && !Object.values(NotificationFrequency).includes(updates.frequency)) {
        return NextResponse.json(
          { error: `Invalid frequency: ${updates.frequency}` },
          { status: 400 }
        );
      }

      // Validate boolean fields
      const booleanFields = ['email_enabled', 'in_app_enabled', 'push_enabled', 'sms_enabled'];
      for (const field of booleanFields) {
        if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
          return NextResponse.json(
            { error: `${field} must be a boolean` },
            { status: 400 }
          );
        }
      }

      // Update preference
      await updateNotificationPreference(user.id, notificationType, updates);

      return NextResponse.json({
        success: true,
        message: 'Notification preference updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      return NextResponse.json(
        { error: 'Failed to update notification preference' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
