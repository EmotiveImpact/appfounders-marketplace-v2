import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendNotification } from '@/lib/notifications/service';

interface OnboardingData {
  name: string;
  bio?: string;
  avatar_url?: string;
  company?: string;
  website?: string;
  location?: string;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  specializations: string[];
  interests: string[];
  notification_preferences: {
    email_notifications: boolean;
    app_updates: boolean;
    marketing_emails: boolean;
    security_alerts: boolean;
  };
  completed_steps: string[];
  onboarding_completed: boolean;
}

// POST /api/user/onboarding - Complete user onboarding
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const data: OnboardingData = await req.json();

      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      if (!data.experience_level || !['beginner', 'intermediate', 'expert'].includes(data.experience_level)) {
        return NextResponse.json(
          { error: 'Valid experience level is required' },
          { status: 400 }
        );
      }

      if (!Array.isArray(data.specializations)) {
        return NextResponse.json(
          { error: 'Specializations must be an array' },
          { status: 400 }
        );
      }

      // Update user profile
      await neonClient.sql`
        UPDATE users
        SET 
          name = ${data.name.trim()},
          bio = ${data.bio?.trim() || null},
          avatar_url = ${data.avatar_url || null},
          company = ${data.company?.trim() || null},
          website = ${data.website?.trim() || null},
          location = ${data.location?.trim() || null},
          experience_level = ${data.experience_level},
          specializations = ${JSON.stringify(data.specializations)},
          interests = ${JSON.stringify(data.interests || [])},
          onboarding_completed = ${data.onboarding_completed},
          onboarding_completed_at = ${data.onboarding_completed ? 'NOW()' : null},
          updated_at = NOW()
        WHERE id = ${user.id}
      `;

      // Update notification preferences
      await neonClient.sql`
        INSERT INTO user_preferences (
          user_id,
          email_notifications,
          marketing_emails,
          app_updates,
          security_alerts,
          created_at,
          updated_at
        )
        VALUES (
          ${user.id},
          ${data.notification_preferences.email_notifications},
          ${data.notification_preferences.marketing_emails},
          ${data.notification_preferences.app_updates},
          ${data.notification_preferences.security_alerts},
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email_notifications = ${data.notification_preferences.email_notifications},
          marketing_emails = ${data.notification_preferences.marketing_emails},
          app_updates = ${data.notification_preferences.app_updates},
          security_alerts = ${data.notification_preferences.security_alerts},
          updated_at = NOW()
      `;

      // Log onboarding completion
      if (data.onboarding_completed) {
        await neonClient.sql`
          INSERT INTO user_activity_logs (
            user_id,
            action,
            details,
            created_at
          )
          VALUES (
            ${user.id},
            'onboarding_completed',
            ${JSON.stringify({
              experience_level: data.experience_level,
              specializations_count: data.specializations.length,
              completed_steps: data.completed_steps,
            })},
            NOW()
          )
        `;

        // Send welcome notification
        try {
          await sendNotification(
            user.id,
            'welcome',
            'Welcome to AppFounders!',
            `Welcome ${data.name}! Your ${user.role} profile has been set up successfully. Start exploring the platform and connect with the community.`,
            {
              type: 'onboarding_complete',
              user_role: user.role,
              experience_level: data.experience_level,
            }
          );
        } catch (notificationError) {
          console.error('Failed to send welcome notification:', notificationError);
          // Don't fail the onboarding if notification fails
        }
      }

      // Get updated user data
      const updatedUserResult = await neonClient.sql`
        SELECT 
          u.*,
          up.email_notifications,
          up.marketing_emails,
          up.app_updates,
          up.security_alerts
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.id = ${user.id}
        LIMIT 1
      `;

      const updatedUser = updatedUserResult[0];

      return NextResponse.json({
        success: true,
        message: data.onboarding_completed 
          ? 'Onboarding completed successfully' 
          : 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatar_url,
          company: updatedUser.company,
          website: updatedUser.website,
          location: updatedUser.location,
          experience_level: updatedUser.experience_level,
          specializations: JSON.parse(updatedUser.specializations || '[]'),
          interests: JSON.parse(updatedUser.interests || '[]'),
          onboarding_completed: updatedUser.onboarding_completed,
          preferences: {
            email_notifications: updatedUser.email_notifications,
            marketing_emails: updatedUser.marketing_emails,
            app_updates: updatedUser.app_updates,
            security_alerts: updatedUser.security_alerts,
          },
        },
      });
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to complete onboarding' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

// GET /api/user/onboarding - Get onboarding status
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const userResult = await neonClient.sql`
        SELECT 
          u.onboarding_completed,
          u.onboarding_completed_at,
          u.name,
          u.bio,
          u.avatar_url,
          u.company,
          u.website,
          u.location,
          u.experience_level,
          u.specializations,
          u.interests,
          up.email_notifications,
          up.marketing_emails,
          up.app_updates,
          up.security_alerts
        FROM users u
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.id = ${user.id}
        LIMIT 1
      `;

      if (userResult.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = userResult[0];

      return NextResponse.json({
        success: true,
        onboarding: {
          completed: userData.onboarding_completed,
          completed_at: userData.onboarding_completed_at,
          data: {
            name: userData.name || '',
            bio: userData.bio || '',
            avatar_url: userData.avatar_url,
            company: userData.company,
            website: userData.website,
            location: userData.location,
            experience_level: userData.experience_level || 'intermediate',
            specializations: JSON.parse(userData.specializations || '[]'),
            interests: JSON.parse(userData.interests || '[]'),
            notification_preferences: {
              email_notifications: userData.email_notifications ?? true,
              marketing_emails: userData.marketing_emails ?? false,
              app_updates: userData.app_updates ?? true,
              security_alerts: userData.security_alerts ?? true,
            },
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting onboarding status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get onboarding status' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);
