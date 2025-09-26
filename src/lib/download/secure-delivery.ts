import { neonClient } from '@/lib/database/neon-client';
import { getFileInfo } from '@/lib/storage/s3-service';
import crypto from 'crypto';

export interface DownloadToken {
  token: string;
  user_id: string;
  file_key: string;
  expires_at: Date;
  download_count: number;
  max_downloads: number;
  metadata: Record<string, any>;
}

export interface FileInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  exists: boolean;
}

export interface AccessValidation {
  allowed: boolean;
  reason?: string;
  fileInfo?: FileInfo;
}

export interface TokenValidation {
  valid: boolean;
  reason?: string;
  tokenData?: DownloadToken;
  fileInfo?: FileInfo;
}

/**
 * Generate a secure download token
 */
export async function generateSecureDownloadToken(
  userId: string,
  fileKey: string,
  expiresIn: number = 3600, // seconds
  metadata: Record<string, any> = {}
): Promise<{
  token: string;
  expiresAt: Date;
  metadata: Record<string, any>;
}> {
  try {
    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Store token in database
    await neonClient.sql`
      INSERT INTO download_tokens (
        token,
        user_id,
        file_key,
        expires_at,
        download_count,
        max_downloads,
        metadata,
        created_at
      )
      VALUES (
        ${token},
        ${userId},
        ${fileKey},
        ${expiresAt.toISOString()},
        0,
        5,
        ${JSON.stringify(metadata)},
        NOW()
      )
    `;

    return {
      token,
      expiresAt,
      metadata,
    };
  } catch (error) {
    console.error('Error generating download token:', error);
    throw new Error('Failed to generate download token');
  }
}

/**
 * Validate download access for a user
 */
export async function validateDownloadAccess(
  userId: string,
  fileKey: string,
  appId?: string,
  category?: string
): Promise<AccessValidation> {
  try {
    // Get user information
    const userResult = await neonClient.sql`
      SELECT id, role, email FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (userResult.length === 0) {
      return { allowed: false, reason: 'User not found' };
    }

    const user = userResult[0];

    // Admin users have access to all files
    if (user.role === 'admin') {
      const fileInfo = await getFileInfoSafe(fileKey);
      return { allowed: true, fileInfo };
    }

    // Parse file key to extract ownership information
    const keyParts = fileKey.split('/');
    if (keyParts.length < 2) {
      return { allowed: false, reason: 'Invalid file key format' };
    }

    const fileCategory = keyParts[0];
    const fileOwnerId = keyParts[1];

    // Users can access their own files
    if (fileOwnerId === userId) {
      const fileInfo = await getFileInfoSafe(fileKey);
      return { allowed: true, fileInfo };
    }

    // For app-related files, check purchase status
    if (appId && (fileCategory === 'binaries' || fileCategory === 'app-files')) {
      const purchaseResult = await neonClient.sql`
        SELECT id FROM purchases
        WHERE user_id = ${userId}
        AND app_id = ${appId}
        AND status = 'completed'
        LIMIT 1
      `;

      if (purchaseResult.length > 0) {
        const fileInfo = await getFileInfoSafe(fileKey);
        return { allowed: true, fileInfo };
      } else {
        return { allowed: false, reason: 'Purchase required to access this file' };
      }
    }

    // For public files (screenshots, previews), allow access
    if (fileCategory === 'screenshots' || fileCategory === 'images') {
      const fileInfo = await getFileInfoSafe(fileKey);
      return { allowed: true, fileInfo };
    }

    // Default deny
    return { allowed: false, reason: 'Access denied' };
  } catch (error) {
    console.error('Error validating download access:', error);
    return { allowed: false, reason: 'Access validation failed' };
  }
}

/**
 * Validate a download token
 */
export async function validateDownloadToken(
  token: string,
  options: {
    userAgent?: string;
    ipAddress?: string;
    skipDownloadCount?: boolean;
  } = {}
): Promise<TokenValidation> {
  try {
    // Get token from database
    const tokenResult = await neonClient.sql`
      SELECT * FROM download_tokens
      WHERE token = ${token}
      LIMIT 1
    `;

    if (tokenResult.length === 0) {
      return { valid: false, reason: 'Invalid token' };
    }

    const tokenData = tokenResult[0] as DownloadToken;

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return { valid: false, reason: 'Token has expired' };
    }

    // Check download count limit
    if (tokenData.download_count >= tokenData.max_downloads) {
      return { valid: false, reason: 'Download limit exceeded' };
    }

    // Validate IP address if stored in metadata
    if (tokenData.metadata.ipAddress && options.ipAddress) {
      if (tokenData.metadata.ipAddress !== options.ipAddress) {
        return { valid: false, reason: 'IP address mismatch' };
      }
    }

    // Get file information
    const fileInfo = await getFileInfoSafe(tokenData.file_key);
    if (!fileInfo.exists) {
      return { valid: false, reason: 'File not found' };
    }

    // Increment download count (unless skipped)
    if (!options.skipDownloadCount) {
      await neonClient.sql`
        UPDATE download_tokens
        SET 
          download_count = download_count + 1,
          last_accessed_at = NOW()
        WHERE token = ${token}
      `;
    }

    return {
      valid: true,
      tokenData,
      fileInfo,
    };
  } catch (error) {
    console.error('Error validating download token:', error);
    return { valid: false, reason: 'Token validation failed' };
  }
}

/**
 * Log download access activity
 */
export async function logDownloadAccess(
  userId: string,
  fileKey: string,
  action: string,
  ipAddress: string,
  userAgent: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await neonClient.sql`
      INSERT INTO download_access_logs (
        user_id,
        file_key,
        action,
        ip_address,
        user_agent,
        metadata,
        created_at
      )
      VALUES (
        ${userId},
        ${fileKey},
        ${action},
        ${ipAddress},
        ${userAgent},
        ${JSON.stringify(metadata)},
        NOW()
      )
    `;
  } catch (error) {
    console.error('Error logging download access:', error);
    // Don't throw error as logging is not critical
  }
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await neonClient.sql`
      DELETE FROM download_tokens
      WHERE expires_at < NOW()
    `;

    return result.length;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Get download statistics for a user
 */
export async function getDownloadStats(
  userId: string,
  timeframe: 'day' | 'week' | 'month' = 'month'
): Promise<{
  totalDownloads: number;
  uniqueFiles: number;
  recentActivity: any[];
}> {
  try {
    let dateFilter = '';
    switch (timeframe) {
      case 'day':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
        break;
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 week'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 month'";
        break;
    }

    // Get total downloads
    const totalResult = await neonClient.sql`
      SELECT COUNT(*) as total
      FROM download_access_logs
      WHERE user_id = ${userId}
      AND action IN ('download_started', 'download_completed')
      ${dateFilter}
    `;

    // Get unique files
    const uniqueResult = await neonClient.sql`
      SELECT COUNT(DISTINCT file_key) as unique_files
      FROM download_access_logs
      WHERE user_id = ${userId}
      AND action IN ('download_started', 'download_completed')
      ${dateFilter}
    `;

    // Get recent activity
    const activityResult = await neonClient.sql`
      SELECT 
        file_key,
        action,
        created_at,
        metadata
      FROM download_access_logs
      WHERE user_id = ${userId}
      ${dateFilter}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      totalDownloads: parseInt(totalResult[0]?.total || '0'),
      uniqueFiles: parseInt(uniqueResult[0]?.unique_files || '0'),
      recentActivity: activityResult,
    };
  } catch (error) {
    console.error('Error getting download stats:', error);
    return {
      totalDownloads: 0,
      uniqueFiles: 0,
      recentActivity: [],
    };
  }
}

/**
 * Safely get file information
 */
async function getFileInfoSafe(fileKey: string): Promise<FileInfo> {
  try {
    const info = await getFileInfo(fileKey);
    return {
      fileName: fileKey.split('/').pop() || 'unknown',
      fileSize: info.size || 0,
      fileType: info.contentType || 'application/octet-stream',
      exists: true,
    };
  } catch (error) {
    return {
      fileName: fileKey.split('/').pop() || 'unknown',
      fileSize: 0,
      fileType: 'application/octet-stream',
      exists: false,
    };
  }
}
