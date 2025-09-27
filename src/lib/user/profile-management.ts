import { neonClient } from '@/lib/database/neon-client';
import bcrypt from 'bcryptjs';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  role: 'admin' | 'developer' | 'tester';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  email_notifications: boolean;
  marketing_emails: boolean;
  app_updates: boolean;
  security_alerts: boolean;
  newsletter: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: string;
}

export interface UserStats {
  apps_purchased: number;
  apps_developed: number;
  total_spent: number;
  total_earned: number;
  reviews_written: number;
  average_rating_given: number;
  average_rating_received: number;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  avatar_url?: string;
}

export interface UpdatePreferencesData {
  email_notifications?: boolean;
  marketing_emails?: boolean;
  app_updates?: boolean;
  security_alerts?: boolean;
  newsletter?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  currency?: string;
}

/**
 * Get complete user profile with preferences and stats
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Get basic user info
    const userResult = await neonClient.sql`
      SELECT 
        id, email, name, avatar_url, bio, company, website, location, 
        role, email_verified, created_at, updated_at
      FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get user preferences
    const preferencesResult = await neonClient.sql`
      SELECT * FROM user_preferences 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const preferences: UserPreferences = preferencesResult.length > 0 
      ? preferencesResult[0] as UserPreferences
      : getDefaultPreferences();

    // Calculate user stats
    const stats = await calculateUserStats(userId);

    return {
      ...user,
      preferences,
      stats,
    } as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string, 
  data: UpdateProfileData
): Promise<UserProfile> {
  try {
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }
    if (data.company !== undefined) {
      updateFields.push(`company = $${paramIndex++}`);
      values.push(data.company);
    }
    if (data.website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      values.push(data.website);
    }
    if (data.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      values.push(data.location);
    }
    if (data.avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = // await neonClient.sql(query, values);
    
    if (result.length === 0) {
      throw new Error('User not found');
    }

    // Return updated profile
    return await getUserProfile(userId) as UserProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: UpdatePreferencesData
): Promise<UserPreferences> {
  try {
    // Upsert preferences
    const result = await neonClient.sql`
      INSERT INTO user_preferences (
        user_id, email_notifications, marketing_emails, app_updates,
        security_alerts, newsletter, theme, language, timezone, currency
      )
      VALUES (
        ${userId},
        ${data.email_notifications ?? true},
        ${data.marketing_emails ?? false},
        ${data.app_updates ?? true},
        ${data.security_alerts ?? true},
        ${data.newsletter ?? false},
        ${data.theme ?? 'system'},
        ${data.language ?? 'en'},
        ${data.timezone ?? 'UTC'},
        ${data.currency ?? 'USD'}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        email_notifications = COALESCE(${data.email_notifications}, user_preferences.email_notifications),
        marketing_emails = COALESCE(${data.marketing_emails}, user_preferences.marketing_emails),
        app_updates = COALESCE(${data.app_updates}, user_preferences.app_updates),
        security_alerts = COALESCE(${data.security_alerts}, user_preferences.security_alerts),
        newsletter = COALESCE(${data.newsletter}, user_preferences.newsletter),
        theme = COALESCE(${data.theme}, user_preferences.theme),
        language = COALESCE(${data.language}, user_preferences.language),
        timezone = COALESCE(${data.timezone}, user_preferences.timezone),
        currency = COALESCE(${data.currency}, user_preferences.currency),
        updated_at = NOW()
      RETURNING *
    `;

    return result[0] as UserPreferences;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update user preferences');
  }
}

/**
 * Change user password
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    // Get current password hash
    const userResult = await neonClient.sql`
      SELECT password_hash FROM users 
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await neonClient.sql`
      UPDATE users 
      SET 
        password_hash = ${newPasswordHash},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Log password change for security
    await neonClient.sql`
      INSERT INTO security_logs (
        user_id, action, ip_address, user_agent, created_at
      )
      VALUES (
        ${userId}, 'password_changed', '', '', NOW()
      )
    `;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    // Start transaction
    await neonClient.sql`BEGIN`;

    try {
      // Delete user preferences
      await neonClient.sql`DELETE FROM user_preferences WHERE user_id = ${userId}`;
      
      // Delete notifications
      await neonClient.sql`DELETE FROM notifications WHERE user_id = ${userId}`;
      
      // Delete download access
      await neonClient.sql`DELETE FROM download_access WHERE user_id = ${userId}`;
      
      // Delete reviews
      await neonClient.sql`DELETE FROM reviews WHERE user_id = ${userId}`;
      
      // Delete purchases (keep for financial records but anonymize)
      await neonClient.sql`
        UPDATE purchases 
        SET user_id = NULL 
        WHERE user_id = ${userId}
      `;
      
      // Delete apps (if developer)
      await neonClient.sql`DELETE FROM apps WHERE developer_id = ${userId}`;
      
      // Finally delete user
      await neonClient.sql`DELETE FROM users WHERE id = ${userId}`;
      
      // Commit transaction
      await neonClient.sql`COMMIT`;
    } catch (error) {
      // Rollback on error
      await neonClient.sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete user account');
  }
}

/**
 * Calculate user statistics
 */
async function calculateUserStats(userId: string): Promise<UserStats> {
  try {
    // Apps purchased
    const purchasedResult = await neonClient.sql`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_spent
      FROM purchases 
      WHERE user_id = ${userId} AND status = 'completed'
    `;

    // Apps developed
    const developedResult = await neonClient.sql`
      SELECT COUNT(*) as count
      FROM apps 
      WHERE developer_id = ${userId}
    `;

    // Total earned (for developers)
    const earnedResult = await neonClient.sql`
      SELECT COALESCE(SUM(amount * 0.8), 0) as total_earned
      FROM purchases p
      JOIN apps a ON p.app_id = a.id
      WHERE a.developer_id = ${userId} AND p.status = 'completed'
    `;

    // Reviews written
    const reviewsResult = await neonClient.sql`
      SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating
      FROM reviews 
      WHERE user_id = ${userId}
    `;

    // Average rating received (for developers)
    const receivedRatingResult = await neonClient.sql`
      SELECT COALESCE(AVG(r.rating), 0) as avg_rating
      FROM reviews r
      JOIN apps a ON r.app_id = a.id
      WHERE a.developer_id = ${userId}
    `;

    return {
      apps_purchased: parseInt(purchasedResult[0].count),
      apps_developed: parseInt(developedResult[0].count),
      total_spent: parseFloat(purchasedResult[0].total_spent),
      total_earned: parseFloat(earnedResult[0].total_earned),
      reviews_written: parseInt(reviewsResult[0].count),
      average_rating_given: parseFloat(reviewsResult[0].avg_rating),
      average_rating_received: parseFloat(receivedRatingResult[0].avg_rating),
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return {
      apps_purchased: 0,
      apps_developed: 0,
      total_spent: 0,
      total_earned: 0,
      reviews_written: 0,
      average_rating_given: 0,
      average_rating_received: 0,
    };
  }
}

/**
 * Get default user preferences
 */
function getDefaultPreferences(): UserPreferences {
  return {
    email_notifications: true,
    marketing_emails: false,
    app_updates: true,
    security_alerts: true,
    newsletter: false,
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
  };
}
