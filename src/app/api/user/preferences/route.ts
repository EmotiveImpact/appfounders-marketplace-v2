import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  updateUserPreferences, 
  UpdatePreferencesData 
} from '@/lib/user/profile-management';

// PUT /api/user/preferences - Update user preferences
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const {
        email_notifications,
        marketing_emails,
        app_updates,
        security_alerts,
        newsletter,
        theme,
        language,
        timezone,
        currency
      } = body;

      // Validate input
      const updateData: UpdatePreferencesData = {};

      if (email_notifications !== undefined) {
        if (typeof email_notifications !== 'boolean') {
          return NextResponse.json(
            { error: 'email_notifications must be a boolean' },
            { status: 400 }
          );
        }
        updateData.email_notifications = email_notifications;
      }

      if (marketing_emails !== undefined) {
        if (typeof marketing_emails !== 'boolean') {
          return NextResponse.json(
            { error: 'marketing_emails must be a boolean' },
            { status: 400 }
          );
        }
        updateData.marketing_emails = marketing_emails;
      }

      if (app_updates !== undefined) {
        if (typeof app_updates !== 'boolean') {
          return NextResponse.json(
            { error: 'app_updates must be a boolean' },
            { status: 400 }
          );
        }
        updateData.app_updates = app_updates;
      }

      if (security_alerts !== undefined) {
        if (typeof security_alerts !== 'boolean') {
          return NextResponse.json(
            { error: 'security_alerts must be a boolean' },
            { status: 400 }
          );
        }
        updateData.security_alerts = security_alerts;
      }

      if (newsletter !== undefined) {
        if (typeof newsletter !== 'boolean') {
          return NextResponse.json(
            { error: 'newsletter must be a boolean' },
            { status: 400 }
          );
        }
        updateData.newsletter = newsletter;
      }

      if (theme !== undefined) {
        if (!['light', 'dark', 'system'].includes(theme)) {
          return NextResponse.json(
            { error: 'theme must be light, dark, or system' },
            { status: 400 }
          );
        }
        updateData.theme = theme;
      }

      if (language !== undefined) {
        if (typeof language !== 'string' || language.length !== 2) {
          return NextResponse.json(
            { error: 'language must be a 2-character language code' },
            { status: 400 }
          );
        }
        updateData.language = language.toLowerCase();
      }

      if (timezone !== undefined) {
        if (typeof timezone !== 'string') {
          return NextResponse.json(
            { error: 'timezone must be a string' },
            { status: 400 }
          );
        }
        // Basic timezone validation
        if (!isValidTimezone(timezone)) {
          return NextResponse.json(
            { error: 'Invalid timezone' },
            { status: 400 }
          );
        }
        updateData.timezone = timezone;
      }

      if (currency !== undefined) {
        if (typeof currency !== 'string' || currency.length !== 3) {
          return NextResponse.json(
            { error: 'currency must be a 3-character currency code' },
            { status: 400 }
          );
        }
        updateData.currency = currency.toUpperCase();
      }

      // Update preferences
      const updatedPreferences = await updateUserPreferences(user.id, updateData);

      return NextResponse.json({
        success: true,
        preferences: updatedPreferences,
        message: 'Preferences updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update preferences' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

/**
 * Basic timezone validation
 */
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}
