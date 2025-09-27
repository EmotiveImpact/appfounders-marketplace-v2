import { neonClient } from '@/lib/database/neon-client';
import { sendNotification } from '@/lib/notifications/service';

export interface AppSubmission {
  id: string;
  developer_id: string;
  name: string;
  description: string;
  short_description: string;
  category: string;
  price: number;
  icon_url?: string;
  screenshots: string[];
  app_file_url?: string;
  app_file_size?: number;
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web';
  version: string;
  minimum_os_version?: string;
  website_url?: string;
  support_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  tags: string[];
  features: string[];
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published';
  review_notes?: string;
  reviewer_id?: string;
  submitted_at?: Date;
  reviewed_at?: Date;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReviewDecision {
  action: 'approve' | 'reject' | 'request_changes';
  notes: string;
  reviewer_id: string;
}

/**
 * Create a new app submission draft
 */
export async function createAppSubmission(
  developerId: string,
  data: Partial<AppSubmission>
): Promise<AppSubmission> {
  try {
    const result = await neonClient.sql`
      INSERT INTO apps (
        developer_id, name, description, short_description, category,
        price, platform, version, status, created_at, updated_at
      )
      VALUES (
        ${developerId},
        ${data.name || 'Untitled App'},
        ${data.description || ''},
        ${data.short_description || ''},
        ${data.category || 'other'},
        ${data.price || 0},
        ${data.platform || 'web'},
        ${data.version || '1.0.0'},
        'draft',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return result[0] as AppSubmission;
  } catch (error) {
    console.error('Error creating app submission:', error);
    throw new Error('Failed to create app submission');
  }
}

/**
 * Update an existing app submission
 */
export async function updateAppSubmission(
  submissionId: string,
  developerId: string,
  data: Partial<AppSubmission>
): Promise<AppSubmission> {
  try {
    // Verify ownership
    const ownershipResult = await neonClient.sql`
      SELECT id FROM apps 
      WHERE id = ${submissionId} AND developer_id = ${developerId}
      LIMIT 1
    `;

    if (ownershipResult.length === 0) {
      throw new Error('App not found or access denied');
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.short_description !== undefined) {
      updateFields.push(`short_description = $${paramIndex++}`);
      values.push(data.short_description);
    }
    if (data.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.icon_url !== undefined) {
      updateFields.push(`icon_url = $${paramIndex++}`);
      values.push(data.icon_url);
    }
    if (data.screenshots !== undefined) {
      updateFields.push(`screenshots = $${paramIndex++}`);
      values.push(JSON.stringify(data.screenshots));
    }
    if (data.app_file_url !== undefined) {
      updateFields.push(`app_file_url = $${paramIndex++}`);
      values.push(data.app_file_url);
    }
    if (data.app_file_size !== undefined) {
      updateFields.push(`app_file_size = $${paramIndex++}`);
      values.push(data.app_file_size);
    }
    if (data.platform !== undefined) {
      updateFields.push(`platform = $${paramIndex++}`);
      values.push(data.platform);
    }
    if (data.version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`);
      values.push(data.version);
    }
    if (data.minimum_os_version !== undefined) {
      updateFields.push(`minimum_os_version = $${paramIndex++}`);
      values.push(data.minimum_os_version);
    }
    if (data.website_url !== undefined) {
      updateFields.push(`website_url = $${paramIndex++}`);
      values.push(data.website_url);
    }
    if (data.support_url !== undefined) {
      updateFields.push(`support_url = $${paramIndex++}`);
      values.push(data.support_url);
    }
    if (data.privacy_policy_url !== undefined) {
      updateFields.push(`privacy_policy_url = $${paramIndex++}`);
      values.push(data.privacy_policy_url);
    }
    if (data.terms_of_service_url !== undefined) {
      updateFields.push(`terms_of_service_url = $${paramIndex++}`);
      values.push(data.terms_of_service_url);
    }
    if (data.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(data.tags));
    }
    if (data.features !== undefined) {
      updateFields.push(`features = $${paramIndex++}`);
      values.push(JSON.stringify(data.features));
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(submissionId);

    const query = `
      UPDATE apps 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await neonClient.sql(query, values);
    return result[0] as AppSubmission;
  } catch (error) {
    console.error('Error updating app submission:', error);
    throw error;
  }
}

/**
 * Validate app submission before submission
 */
export async function validateSubmission(submissionId: string): Promise<SubmissionValidation> {
  try {
    const result = await neonClient.sql`
      SELECT * FROM apps WHERE id = ${submissionId} LIMIT 1
    `;

    if (result.length === 0) {
      return {
        isValid: false,
        errors: ['App not found'],
        warnings: [],
      };
    }

    const app = result[0] as AppSubmission;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!app.name || app.name.trim().length === 0) {
      errors.push('App name is required');
    }
    if (!app.description || app.description.trim().length < 50) {
      errors.push('Description must be at least 50 characters long');
    }
    if (!app.short_description || app.short_description.trim().length === 0) {
      errors.push('Short description is required');
    }
    if (!app.category || app.category === 'other') {
      warnings.push('Consider selecting a more specific category');
    }
    if (!app.icon_url) {
      errors.push('App icon is required');
    }
    if (!app.screenshots || app.screenshots.length === 0) {
      errors.push('At least one screenshot is required');
    }
    if (!app.app_file_url) {
      errors.push('App file is required');
    }
    if (!app.version) {
      errors.push('Version number is required');
    }

    // Content validation
    if (app.name && app.name.length > 100) {
      errors.push('App name must be 100 characters or less');
    }
    if (app.short_description && app.short_description.length > 200) {
      errors.push('Short description must be 200 characters or less');
    }
    if (app.description && app.description.length > 5000) {
      errors.push('Description must be 5000 characters or less');
    }

    // Price validation
    if (app.price < 0) {
      errors.push('Price cannot be negative');
    }
    if (app.price > 999.99) {
      errors.push('Price cannot exceed $999.99');
    }

    // URL validation
    if (app.website_url && !isValidUrl(app.website_url)) {
      errors.push('Website URL is not valid');
    }
    if (app.support_url && !isValidUrl(app.support_url)) {
      errors.push('Support URL is not valid');
    }
    if (app.privacy_policy_url && !isValidUrl(app.privacy_policy_url)) {
      errors.push('Privacy policy URL is not valid');
    }
    if (app.terms_of_service_url && !isValidUrl(app.terms_of_service_url)) {
      errors.push('Terms of service URL is not valid');
    }

    // Screenshots validation
    if (app.screenshots && app.screenshots.length > 8) {
      warnings.push('Consider limiting screenshots to 8 or fewer for better presentation');
    }

    // Tags validation
    if (app.tags && app.tags.length > 10) {
      warnings.push('Consider limiting tags to 10 or fewer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('Error validating submission:', error);
    return {
      isValid: false,
      errors: ['Validation failed due to system error'],
      warnings: [],
    };
  }
}

/**
 * Submit app for review
 */
export async function submitForReview(
  submissionId: string,
  developerId: string
): Promise<AppSubmission> {
  try {
    // Validate submission first
    const validation = await validateSubmission(submissionId);
    if (!validation.isValid) {
      throw new Error(`Submission validation failed: ${validation.errors.join(', ')}`);
    }

    // Update status to submitted
    const result = await neonClient.sql`
      UPDATE apps 
      SET 
        status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${submissionId} AND developer_id = ${developerId}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('App not found or access denied');
    }

    const app = result[0] as AppSubmission;

    // Send notification to developer
    await sendNotification(
      developerId,
      'app_submitted' as any,
      'App Submitted for Review',
      `Your app "${app.name}" has been submitted for review. We'll notify you once the review is complete.`,
      { app_id: app.id, app_name: app.name }
    );

    // Notify admin team (get all admin users)
    const adminResult = await neonClient.sql`
      SELECT id FROM users WHERE role = 'admin'
    `;

    for (const admin of adminResult) {
      await sendNotification(
        admin.id,
        'app_review_needed' as any,
        'New App Submission',
        `A new app "${app.name}" has been submitted for review.`,
        { app_id: app.id, app_name: app.name, developer_id: developerId }
      );
    }

    return app;
  } catch (error) {
    console.error('Error submitting app for review:', error);
    throw error;
  }
}

/**
 * Review an app submission (admin only)
 */
export async function reviewSubmission(
  submissionId: string,
  decision: ReviewDecision
): Promise<AppSubmission> {
  try {
    let newStatus: string;
    let publishedAt: string | null = null;

    switch (decision.action) {
      case 'approve':
        newStatus = 'approved';
        publishedAt = 'NOW()';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'request_changes':
        newStatus = 'draft';
        break;
      default:
        throw new Error('Invalid review action');
    }

    // Update app status
    const updateQuery = publishedAt 
      ? `UPDATE apps SET 
           status = $1, 
           review_notes = $2, 
           reviewer_id = $3, 
           reviewed_at = NOW(), 
           published_at = ${publishedAt},
           updated_at = NOW()
         WHERE id = $4 
         RETURNING *`
      : `UPDATE apps SET 
           status = $1, 
           review_notes = $2, 
           reviewer_id = $3, 
           reviewed_at = NOW(),
           updated_at = NOW()
         WHERE id = $4 
         RETURNING *`;

    const result = await neonClient.sql(
      updateQuery,
      [newStatus, decision.notes, decision.reviewer_id, submissionId]
    );

    if (result.length === 0) {
      throw new Error('App not found');
    }

    const app = result[0] as AppSubmission;

    // Send notification to developer
    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;

    switch (decision.action) {
      case 'approve':
        notificationType = 'app_approved' as any;
        notificationTitle = 'App Approved!';
        notificationMessage = `Congratulations! Your app "${app.name}" has been approved and is now live on the marketplace.`;
        break;
      case 'reject':
        notificationType = 'app_rejected' as any;
        notificationTitle = 'App Rejected';
        notificationMessage = `Your app "${app.name}" has been rejected. Please review the feedback and resubmit.`;
        break;
      case 'request_changes':
        notificationType = 'app_changes_requested';
        notificationTitle = 'Changes Requested';
        notificationMessage = `Changes have been requested for your app "${app.name}". Please review the feedback and resubmit.`;
        break;
    }

    await sendNotification(
      app.developer_id,
      notificationType as any,
      notificationTitle,
      notificationMessage,
      { 
        app_id: app.id, 
        app_name: app.name, 
        review_notes: decision.notes 
      }
    );

    return app;
  } catch (error) {
    console.error('Error reviewing submission:', error);
    throw error;
  }
}

/**
 * Get submission by ID
 */
export async function getSubmission(submissionId: string): Promise<AppSubmission | null> {
  try {
    const result = await neonClient.sql`
      SELECT * FROM apps WHERE id = ${submissionId} LIMIT 1
    `;

    return result.length > 0 ? (result[0] as AppSubmission) : null;
  } catch (error) {
    console.error('Error getting submission:', error);
    throw new Error('Failed to get submission');
  }
}

/**
 * Get submissions by developer
 */
export async function getDeveloperSubmissions(
  developerId: string,
  status?: string
): Promise<AppSubmission[]> {
  try {
    const query = status 
      ? `SELECT * FROM apps WHERE developer_id = $1 AND status = $2 ORDER BY updated_at DESC`
      : `SELECT * FROM apps WHERE developer_id = $1 ORDER BY updated_at DESC`;
    
    const params = status ? [developerId, status] : [developerId];
    const result = await neonClient.sql(query, params);

    return result as AppSubmission[];
  } catch (error) {
    console.error('Error getting developer submissions:', error);
    throw new Error('Failed to get developer submissions');
  }
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
