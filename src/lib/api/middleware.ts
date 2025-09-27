import { NextRequest } from 'next/server';
import { db } from '@/lib/database/neon-client';
import { createHash } from 'crypto';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// API Key validation result
interface ApiKeyResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  keyInfo?: {
    id: string;
    name: string;
    permissions: string[];
    rate_limit: number;
  };
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Validate API key
export async function validateApiKey(
  request: NextRequest,
  required = true
): Promise<ApiKeyResult> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    if (required) {
      return { valid: false };
    }
    return { valid: true }; // Allow public access
  }

  try {
    // Hash the API key for database lookup
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');

    // Look up API key in database
    const result = await db.query(`
      SELECT 
        ak.id,
        ak.name,
        ak.permissions,
        ak.rate_limit,
        ak.is_active,
        ak.expires_at,
        u.id as user_id,
        u.email,
        u.name as user_name,
        u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = $1 AND ak.is_active = true
    `, [hashedKey]);

    if (result.length === 0) {
      return { valid: false };
    }

    const keyData = result[0];

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last used timestamp
    await db.query(`
      UPDATE api_keys 
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE id = $1
    `, [keyData.id]);

    return {
      valid: true,
      user: {
        id: keyData.user_id,
        email: keyData.email,
        name: keyData.user_name,
        role: keyData.role,
      },
      keyInfo: {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions || [],
        rate_limit: keyData.rate_limit || 1000,
      },
    };

  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

// Rate limiting check
export async function rateLimitCheck(
  request: NextRequest,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // Get client identifier (IP + API key if available)
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const apiKey = request.headers.get('X-API-Key') || '';
  const key = `${identifier}:${clientIP}:${apiKey}`;

  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }

  // Get current count
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // First request in window or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + (windowSeconds * 1000),
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + (windowSeconds * 1000),
    };
  }

  if (current.count >= limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

// CORS headers for API responses
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

// Add rate limit headers to response
export function addRateLimitHeaders(
  headers: Headers,
  rateLimitResult: RateLimitResult,
  limit: number
): void {
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
}

// Validate webhook signature
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHash('sha256')
    .update(payload + secret)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Log API request for analytics
export async function logApiRequest(
  request: NextRequest,
  response: Response,
  apiKeyResult?: ApiKeyResult
): Promise<void> {
  try {
    const url = new URL(request.url);
    
    await db.query(`
      INSERT INTO api_logs (
        method,
        path,
        query_params,
        status_code,
        user_id,
        api_key_id,
        ip_address,
        user_agent,
        response_time_ms,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      request.method,
      url.pathname,
      url.search,
      response.status,
      apiKeyResult?.user?.id || null,
      apiKeyResult?.keyInfo?.id || null,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      request.headers.get('user-agent'),
      0, // Response time would be calculated in middleware
    ]);
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

// Check API permissions
export function hasPermission(
  apiKeyResult: ApiKeyResult,
  requiredPermission: string
): boolean {
  if (!apiKeyResult.valid || !apiKeyResult.keyInfo) {
    return false;
  }

  // Admin users have all permissions
  if (apiKeyResult.user?.role === 'admin') {
    return true;
  }

  // Check if the API key has the required permission
  return apiKeyResult.keyInfo.permissions.includes(requiredPermission) ||
         apiKeyResult.keyInfo.permissions.includes('*');
}

// Sanitize API response data
export function sanitizeApiResponse(data: any, userRole?: string): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Remove sensitive fields based on user role
  const sensitiveFields = ['password_hash', 'api_keys', 'stripe_customer_id'];
  
  if (userRole !== 'admin') {
    sensitiveFields.push('email', 'phone', 'address');
  }

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    delete sanitized[field];
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeApiResponse(sanitized[key], userRole);
    }
  }

  return sanitized;
}

// Generate API documentation
export function generateApiDocs() {
  return {
    version: 'v1',
    title: 'AppFounders API',
    description: 'Comprehensive API for the AppFounders marketplace platform',
    baseUrl: 'https://api.appfounders.com/v1',
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      description: 'Include your API key in the X-API-Key header',
    },
    endpoints: {
      apps: {
        list: {
          method: 'GET',
          path: '/apps',
          description: 'List apps with filtering and pagination',
          parameters: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (max: 100, default: 20)',
            category: 'Filter by category',
            platform: 'Filter by platform',
            featured: 'Filter featured apps (true/false)',
            search: 'Search in name and description',
            sort: 'Sort by: created_at, name, price, rating',
            order: 'Sort order: asc, desc',
          },
        },
        create: {
          method: 'POST',
          path: '/apps',
          description: 'Create a new app (requires developer role)',
          authentication: 'required',
        },
        get: {
          method: 'GET',
          path: '/apps/{id}',
          description: 'Get app details by ID',
        },
      },
    },
    rateLimits: {
      default: '100 requests per hour',
      authenticated: '1000 requests per hour',
    },
  };
}
