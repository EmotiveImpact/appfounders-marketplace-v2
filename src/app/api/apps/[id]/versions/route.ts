import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';
import { sendEmail } from '@/lib/email/email-service';

interface AppVersionRequest {
  version: string;
  changelog: string;
  app_file_url?: string;
  screenshots?: string[];
  minimum_os_version?: string;
  breaking_changes?: boolean;
  release_notes?: string;
}

// POST /api/apps/[id]/versions - Submit a new version of an app
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const appId = params.id;
      const {
        version,
        changelog,
        app_file_url,
        screenshots,
        minimum_os_version,
        breaking_changes = false,
        release_notes,
      }: AppVersionRequest = await req.json();

      // Validate input
      if (!version || !changelog) {
        return NextResponse.json(
          { error: 'Version and changelog are required' },
          { status: 400 }
        );
      }

      // Check if user owns the app
      const appQuery = `
        SELECT * FROM apps 
        WHERE id = $1 AND developer_id = $2
      `;

      const appResult = await neonClient.sql(appQuery, [appId, user.id]);

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App not found or you do not have permission to update it' },
          { status: 404 }
        );
      }

      const app = appResult[0];

      // Check if version already exists
      const versionCheckQuery = `
        SELECT id FROM app_versions 
        WHERE app_id = $1 AND version = $2
      `;

      const existingVersion = await neonClient.sql(versionCheckQuery, [appId, version]);

      if (existingVersion.length > 0) {
        return NextResponse.json(
          { error: 'Version already exists for this app' },
          { status: 400 }
        );
      }

      // Create new app version
      const insertVersionQuery = `
        INSERT INTO app_versions (
          app_id,
          version,
          changelog,
          app_file_url,
          screenshots,
          minimum_os_version,
          breaking_changes,
          release_notes,
          status,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;

      const newVersion = await neonClient.sql(insertVersionQuery, [
        appId,
        version,
        changelog,
        app_file_url || app.app_file_url,
        screenshots ? JSON.stringify(screenshots) : app.screenshots,
        minimum_os_version || app.minimum_os_version,
        breaking_changes,
        release_notes,
        'pending', // New versions start as pending
        user.id,
      ]);

      // Log activity
      const activityQuery = `
        INSERT INTO user_activities (
          user_id,
          activity_type,
          activity_data,
          created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      await neonClient.sql(activityQuery, [
        user.id,
        'app_version_submitted',
        JSON.stringify({
          app_id: appId,
          app_name: app.name,
          version,
          breaking_changes,
        }),
      ]);

      // Get users who have purchased this app for notifications
      const purchasersQuery = `
        SELECT DISTINCT u.id, u.email, u.name
        FROM users u
        JOIN purchases p ON u.id = p.user_id
        WHERE p.app_id = $1 AND p.status = 'completed'
        AND u.notification_preferences->>'app_updates' = 'true'
      `;

      const purchasers = await neonClient.sql(purchasersQuery, [appId]);

      // Send notification emails to purchasers (async, don't wait)
      if (purchasers.length > 0) {
        Promise.all(
          purchasers.map(async (purchaser) => {
            try {
              // For now, send a simple email without template
              await sendEmail({
                to: purchaser.email,
                subject: `📱 ${app.name} has a new update available!`,
                html: `<p>A new update is available for ${app.name}.</p>`,
                text: `A new update is available for ${app.name}.`,
              });
            } catch (error) {
              console.error(`Failed to send update notification to ${purchaser.email}:`, error);
            }
          })
        ).catch(console.error);
      }

      return NextResponse.json({
        success: true,
        message: 'App version submitted successfully',
        version: newVersion[0],
        notified_users: purchasers.length,
      });
    } catch (error: any) {
      console.error('Error submitting app version:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to submit app version' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
  }
);

// GET /api/apps/[id]/versions - Get all versions of an app
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const appId = params.id;
      const { searchParams } = new URL(req.url);
      const includeAll = searchParams.get('include_all') === 'true';

      // Check if user has access to the app
      let accessQuery = '';
      let accessParams: any[] = [appId];

      if (user.role === 'admin') {
        // Admins can see all versions
        accessQuery = 'SELECT * FROM apps WHERE id = $1';
      } else if (user.role === 'developer') {
        // Developers can see their own app versions
        accessQuery = 'SELECT * FROM apps WHERE id = $1 AND developer_id = $2';
        accessParams.push(user.id);
      } else {
        // Regular users can only see approved versions of apps they've purchased
        accessQuery = `
          SELECT a.* FROM apps a
          JOIN purchases p ON a.id = p.app_id
          WHERE a.id = $1 AND p.user_id = $2 AND p.status = 'completed'
        `;
        accessParams.push(user.id);
      }

      const appResult = await neonClient.sql(accessQuery, accessParams);

      if (appResult.length === 0) {
        return NextResponse.json(
          { error: 'App not found or access denied' },
          { status: 404 }
        );
      }

      // Get versions based on user role
      let versionsQuery = `
        SELECT 
          av.*,
          u.name as created_by_name
        FROM app_versions av
        JOIN users u ON av.created_by = u.id
        WHERE av.app_id = $1
      `;

      if (!includeAll && user.role !== 'admin' && user.role !== 'developer') {
        // Regular users only see approved versions
        versionsQuery += ` AND av.status = 'approved'`;
      }

      versionsQuery += ` ORDER BY av.created_at DESC`;

      const versions = await neonClient.sql(versionsQuery, [appId]);

      return NextResponse.json({
        success: true,
        versions,
      });
    } catch (error: any) {
      console.error('Error fetching app versions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch app versions' },
        { status: 500 }
      );
    }
  }
);
