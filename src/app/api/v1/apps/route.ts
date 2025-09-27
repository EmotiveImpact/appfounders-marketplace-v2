import { NextRequest, NextResponse } from 'next/server';
import { neonClient } from '@/lib/database/neon-client';
import { validateApiKey, rateLimitCheck } from '@/lib/api/middleware';
import { z } from 'zod';

// API Response wrapper
function apiResponse(data: any, success = true, message?: string) {
  return NextResponse.json({
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
    version: 'v1',
  });
}

// Error response wrapper
function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  }, { status });
}

// Validation schemas
const appsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  category: z.string().optional(),
  platform: z.string().optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  sort: z.enum(['created_at', 'updated_at', 'name', 'price', 'rating']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  min_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  max_price: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  min_rating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
});

const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  short_description: z.string().min(10).max(200),
  category: z.string().min(1),
  platforms: z.array(z.string()).min(1),
  price: z.number().min(0),
  original_price: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  requirements: z.object({
    minimum: z.string().optional(),
    recommended: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  website_url: z.string().url().optional(),
  support_url: z.string().url().optional(),
  privacy_policy_url: z.string().url().optional(),
  terms_of_service_url: z.string().url().optional(),
});

// GET /api/v1/apps - List apps with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitCheck(request, 'api_apps_list', 100, 3600);
    if (!rateLimitResult.allowed) {
      return apiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // API key validation (optional for public endpoints)
    const apiKeyResult = await validateApiKey(request, false);
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validatedQuery = appsQuerySchema.parse(queryParams);
    const { page, limit, category, platform, featured, sort, order, search, min_price, max_price, min_rating } = validatedQuery;

    // Build SQL query
    let query = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.short_description,
        a.category,
        a.platforms,
        a.price,
        a.original_price,
        a.discount_percentage,
        a.featured,
        a.status,
        a.created_at,
        a.updated_at,
        u.name as developer_name,
        u.id as developer_id,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count,
        COUNT(p.id) as purchase_count,
        array_agg(DISTINCT ai.image_url) FILTER (WHERE ai.image_url IS NOT NULL) as screenshots
      FROM apps a
      LEFT JOIN users u ON a.developer_id = u.id
      LEFT JOIN reviews r ON a.id = r.app_id
      LEFT JOIN purchases p ON a.id = p.app_id
      LEFT JOIN app_images ai ON a.id = ai.app_id
      WHERE a.status = 'approved'
    `;

    const queryParams_db: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      queryParams_db.push(category);
      paramIndex++;
    }

    if (platform) {
      query += ` AND $${paramIndex} = ANY(a.platforms)`;
      queryParams_db.push(platform);
      paramIndex++;
    }

    if (featured !== undefined) {
      query += ` AND a.featured = $${paramIndex}`;
      queryParams_db.push(featured);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        a.name ILIKE $${paramIndex} OR 
        a.description ILIKE $${paramIndex} OR 
        a.short_description ILIKE $${paramIndex}
      )`;
      queryParams_db.push(`%${search}%`);
      paramIndex++;
    }

    if (min_price !== undefined) {
      query += ` AND a.price >= $${paramIndex}`;
      queryParams_db.push(min_price);
      paramIndex++;
    }

    if (max_price !== undefined) {
      query += ` AND a.price <= $${paramIndex}`;
      queryParams_db.push(max_price);
      paramIndex++;
    }

    // Group by for aggregations
    query += ` GROUP BY a.id, u.name, u.id`;

    // Add rating filter after GROUP BY
    if (min_rating !== undefined) {
      query += ` HAVING COALESCE(AVG(r.rating), 0) >= $${paramIndex}`;
      queryParams_db.push(min_rating);
      paramIndex++;
    }

    // Add sorting
    const sortColumn = sort === 'rating' ? 'average_rating' : `a.${sort}`;
    query += ` ORDER BY ${sortColumn} ${order.toUpperCase()}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams_db.push(limit, offset);

    // Execute query
    const result = await neonClient.query(query, queryParams_db);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM apps a
      LEFT JOIN users u ON a.developer_id = u.id
      LEFT JOIN reviews r ON a.id = r.app_id
      WHERE a.status = 'approved'
    `;

    const countParams: any[] = [];
    let countParamIndex = 1;

    // Apply same filters for count
    if (category) {
      countQuery += ` AND a.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (platform) {
      countQuery += ` AND $${countParamIndex} = ANY(a.platforms)`;
      countParams.push(platform);
      countParamIndex++;
    }

    if (featured !== undefined) {
      countQuery += ` AND a.featured = $${countParamIndex}`;
      countParams.push(featured);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        a.name ILIKE $${countParamIndex} OR 
        a.description ILIKE $${countParamIndex} OR 
        a.short_description ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (min_price !== undefined) {
      countQuery += ` AND a.price >= $${countParamIndex}`;
      countParams.push(min_price);
      countParamIndex++;
    }

    if (max_price !== undefined) {
      countQuery += ` AND a.price <= $${countParamIndex}`;
      countParams.push(max_price);
      countParamIndex++;
    }

    if (min_rating !== undefined) {
      countQuery += ` AND a.id IN (
        SELECT app_id FROM reviews 
        GROUP BY app_id 
        HAVING AVG(rating) >= $${countParamIndex}
      )`;
      countParams.push(min_rating);
    }

    const countResult = await neonClient.query(countQuery, countParams);
    const total = parseInt(countResult[0].total);

    // Format response
    const apps = result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      short_description: row.short_description,
      category: row.category,
      platforms: row.platforms,
      price: parseFloat(row.price),
      original_price: row.original_price ? parseFloat(row.original_price) : null,
      discount_percentage: row.discount_percentage,
      featured: row.featured,
      developer: {
        id: row.developer_id,
        name: row.developer_name,
      },
      rating: {
        average: parseFloat(row.average_rating).toFixed(1),
        count: parseInt(row.review_count),
      },
      stats: {
        purchases: parseInt(row.purchase_count),
      },
      screenshots: row.screenshots || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
      has_prev: page > 1,
    };

    return apiResponse({
      apps,
      pagination,
      filters: {
        category,
        platform,
        featured,
        search,
        price_range: { min: min_price, max: max_price },
        min_rating,
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return apiError('Invalid query parameters', 400, 'VALIDATION_ERROR');
    }
    
    return apiError('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// POST /api/v1/apps - Create new app (requires API key and developer role)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitCheck(request, 'api_apps_create', 10, 3600);
    if (!rateLimitResult.allowed) {
      return apiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // API key validation (required for write operations)
    const apiKeyResult = await validateApiKey(request, true);
    if (!apiKeyResult.valid) {
      return apiError('Invalid or missing API key', 401, 'INVALID_API_KEY');
    }

    // Check if user has developer role
    if (apiKeyResult.user?.role !== 'developer' && apiKeyResult.user?.role !== 'admin') {
      return apiError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAppSchema.parse(body);

    // Create app in database
    const result = await neonClient.query(`
      INSERT INTO apps (
        name, description, short_description, category, platforms,
        price, original_price, features, requirements, tags,
        website_url, support_url, privacy_policy_url, terms_of_service_url,
        developer_id, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW(), NOW()
      ) RETURNING id, name, status, created_at
    `, [
      validatedData.name,
      validatedData.description,
      validatedData.short_description,
      validatedData.category,
      validatedData.platforms,
      validatedData.price,
      validatedData.original_price,
      JSON.stringify(validatedData.features || []),
      JSON.stringify(validatedData.requirements || {}),
      validatedData.tags || [],
      validatedData.website_url,
      validatedData.support_url,
      validatedData.privacy_policy_url,
      validatedData.terms_of_service_url,
      apiKeyResult.user.id,
    ]);

    const newApp = result[0];

    return apiResponse({
      app: {
        id: newApp.id,
        name: newApp.name,
        status: newApp.status,
        created_at: newApp.created_at,
        message: 'App submitted for review. You will be notified once it is approved.',
      },
    }, true, 'App created successfully');

  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return apiError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    
    return apiError('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
