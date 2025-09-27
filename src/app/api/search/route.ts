import { NextRequest, NextResponse } from 'next/server';
import { neonClient } from '@/lib/database/neon-client';

interface SearchFilters {
  query?: string;
  category?: string;
  platform?: string;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  sort_by?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

// GET /api/search - Advanced search with full-text search and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const filters: SearchFilters = {
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || undefined,
      platform: searchParams.get('platform') || undefined,
      price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
      price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined,
      rating_min: searchParams.get('rating_min') ? parseFloat(searchParams.get('rating_min')!) : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'relevance',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Build the search query
    let searchQuery = `
      SELECT DISTINCT
        a.*,
        u.name as developer_name,
        u.verified as developer_verified,
        COALESCE(a.rating_average, 0) as rating_average,
        COALESCE(a.rating_count, 0) as rating_count,
        CASE 
          WHEN $1 = '' THEN 0
          ELSE ts_rank_cd(
            to_tsvector('english', a.name || ' ' || a.description || ' ' || a.short_description || ' ' || COALESCE(a.tags, '')),
            plainto_tsquery('english', $1)
          )
        END as search_rank
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE a.status = 'approved'
    `;

    const queryParams: any[] = [filters.query];
    let paramIndex = 2;

    // Add full-text search condition
    if (filters.query && filters.query.trim() !== '') {
      searchQuery += ` AND (
        to_tsvector('english', a.name || ' ' || a.description || ' ' || a.short_description || ' ' || COALESCE(a.tags, ''))
        @@ plainto_tsquery('english', $1)
        OR a.name ILIKE $${paramIndex}
        OR a.description ILIKE $${paramIndex}
        OR a.short_description ILIKE $${paramIndex}
        OR a.tags ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.query}%`);
      paramIndex++;
    }

    // Add category filter
    if (filters.category) {
      searchQuery += ` AND a.category = $${paramIndex}`;
      queryParams.push(filters.category);
      paramIndex++;
    }

    // Add platform filter
    if (filters.platform) {
      searchQuery += ` AND $${paramIndex} = ANY(a.platforms)`;
      queryParams.push(filters.platform);
      paramIndex++;
    }

    // Add price range filter
    if (filters.price_min !== undefined) {
      searchQuery += ` AND a.price >= $${paramIndex}`;
      queryParams.push(filters.price_min);
      paramIndex++;
    }

    if (filters.price_max !== undefined) {
      searchQuery += ` AND a.price <= $${paramIndex}`;
      queryParams.push(filters.price_max);
      paramIndex++;
    }

    // Add rating filter
    if (filters.rating_min !== undefined) {
      searchQuery += ` AND COALESCE(a.rating_average, 0) >= $${paramIndex}`;
      queryParams.push(filters.rating_min);
      paramIndex++;
    }

    // Add sorting
    switch (filters.sort_by) {
      case 'price_low':
        searchQuery += ' ORDER BY a.price ASC, a.created_at DESC';
        break;
      case 'price_high':
        searchQuery += ' ORDER BY a.price DESC, a.created_at DESC';
        break;
      case 'rating':
        searchQuery += ' ORDER BY COALESCE(a.rating_average, 0) DESC, a.rating_count DESC, a.created_at DESC';
        break;
      case 'newest':
        searchQuery += ' ORDER BY a.created_at DESC';
        break;
      case 'popular':
        searchQuery += ' ORDER BY a.rating_count DESC, COALESCE(a.rating_average, 0) DESC, a.created_at DESC';
        break;
      case 'relevance':
      default:
        if (filters.query && filters.query.trim() !== '') {
          searchQuery += ' ORDER BY search_rank DESC, COALESCE(a.rating_average, 0) DESC, a.created_at DESC';
        } else {
          searchQuery += ' ORDER BY COALESCE(a.rating_average, 0) DESC, a.rating_count DESC, a.created_at DESC';
        }
        break;
    }

    // Add pagination
    searchQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(filters.limit, filters.offset);

    // Execute search query
    const searchResults = // await neonClient.sql(searchQuery, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE a.status = 'approved'
    `;

    const countParams: any[] = [];
    let countParamIndex = 1;

    // Add the same filters to count query
    if (filters.query && filters.query.trim() !== '') {
      countQuery += ` AND (
        to_tsvector('english', a.name || ' ' || a.description || ' ' || a.short_description || ' ' || COALESCE(a.tags, ''))
        @@ plainto_tsquery('english', $${countParamIndex})
        OR a.name ILIKE $${countParamIndex + 1}
        OR a.description ILIKE $${countParamIndex + 1}
        OR a.short_description ILIKE $${countParamIndex + 1}
        OR a.tags ILIKE $${countParamIndex + 1}
      )`;
      countParams.push(filters.query, `%${filters.query}%`);
      countParamIndex += 2;
    }

    if (filters.category) {
      countQuery += ` AND a.category = $${countParamIndex}`;
      countParams.push(filters.category);
      countParamIndex++;
    }

    if (filters.platform) {
      countQuery += ` AND $${countParamIndex} = ANY(a.platforms)`;
      countParams.push(filters.platform);
      countParamIndex++;
    }

    if (filters.price_min !== undefined) {
      countQuery += ` AND a.price >= $${countParamIndex}`;
      countParams.push(filters.price_min);
      countParamIndex++;
    }

    if (filters.price_max !== undefined) {
      countQuery += ` AND a.price <= $${countParamIndex}`;
      countParams.push(filters.price_max);
      countParamIndex++;
    }

    if (filters.rating_min !== undefined) {
      countQuery += ` AND COALESCE(a.rating_average, 0) >= $${countParamIndex}`;
      countParams.push(filters.rating_min);
      countParamIndex++;
    }

    const countResult = // await neonClient.sql(countQuery, countParams);
    const total = parseInt(countResult[0]?.total || '0');

    // Get search suggestions if query provided
    let suggestions: string[] = [];
    if (filters.query && filters.query.trim() !== '') {
      const suggestionQuery = `
        SELECT DISTINCT
          CASE 
            WHEN a.name ILIKE $1 THEN a.name
            WHEN a.category ILIKE $1 THEN a.category
            ELSE NULL
          END as suggestion
        FROM apps a
        WHERE a.status = 'approved'
          AND (a.name ILIKE $1 OR a.category ILIKE $1 OR a.tags ILIKE $1)
          AND CASE 
            WHEN a.name ILIKE $1 THEN a.name
            WHEN a.category ILIKE $1 THEN a.category
            ELSE NULL
          END IS NOT NULL
        LIMIT 5
      `;

      const suggestionResults = // await neonClient.sql(suggestionQuery, [`%${filters.query}%`]);
      suggestions = suggestionResults.map(row => row.suggestion).filter(Boolean);
    }

    // Get facets for filtering
    const facetsQuery = `
      SELECT 
        category,
        COUNT(*) as count
      FROM apps
      WHERE status = 'approved'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;

    const platformsQuery = `
      SELECT 
        UNNEST(platforms) as platform,
        COUNT(*) as count
      FROM apps
      WHERE status = 'approved'
      GROUP BY platform
      ORDER BY count DESC
      LIMIT 10
    `;

    const [facetResults, platformResults] = await Promise.all([
      neonClient.sql(facetsQuery),
      neonClient.sql(platformsQuery)
    ]);

    const facets = {
      categories: facetResults.map(row => ({
        value: row.category,
        count: parseInt(row.count)
      })),
      platforms: platformResults.map(row => ({
        value: row.platform,
        count: parseInt(row.count)
      }))
    };

    return NextResponse.json({
      success: true,
      results: searchResults,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + (filters.limit || 20) < total,
      },
      filters: filters,
      suggestions,
      facets,
    });
  } catch (error: any) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

// GET /api/search/autocomplete - Autocomplete suggestions
export async function POST(req: NextRequest) {
  try {
    const { query, limit = 10 } = await req.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
    }

    const autocompleteQuery = `
      SELECT DISTINCT
        name,
        'app' as type,
        category,
        ts_rank_cd(
          to_tsvector('english', name),
          plainto_tsquery('english', $1)
        ) as rank
      FROM apps
      WHERE status = 'approved'
        AND (
          name ILIKE $2
          OR to_tsvector('english', name) @@ plainto_tsquery('english', $1)
        )
      
      UNION ALL
      
      SELECT DISTINCT
        category as name,
        'category' as type,
        category,
        1 as rank
      FROM apps
      WHERE status = 'approved'
        AND category ILIKE $2
      
      UNION ALL
      
      SELECT DISTINCT
        UNNEST(string_to_array(tags, ',')) as name,
        'tag' as type,
        category,
        1 as rank
      FROM apps
      WHERE status = 'approved'
        AND tags ILIKE $2
      
      ORDER BY rank DESC, name ASC
      LIMIT $3
    `;

    const suggestions = // await neonClient.sql(autocompleteQuery, [
      query.trim(),
      `%${query.trim()}%`,
      limit
    ]);

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(row => ({
        text: row.name,
        type: row.type,
        category: row.category,
      })),
    });
  } catch (error: any) {
    console.error('Error getting autocomplete suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Autocomplete failed' },
      { status: 500 }
    );
  }
}
