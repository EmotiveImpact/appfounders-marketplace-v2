import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/search/filters - Get dynamic filter options based on current search context
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const platform = searchParams.get('platform') || '';

    // Build base query for filtering context
    let baseQuery = `
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE a.status = 'approved'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search context if provided
    if (query.trim() !== '') {
      baseQuery += ` AND (
        to_tsvector('english', a.name || ' ' || a.description || ' ' || a.short_description || ' ' || COALESCE(array_to_string(a.tags, ' '), ''))
        @@ plainto_tsquery('english', $${paramIndex})
        OR a.name ILIKE $${paramIndex + 1}
        OR a.description ILIKE $${paramIndex + 1}
        OR a.short_description ILIKE $${paramIndex + 1}
      )`;
      queryParams.push(query, `%${query}%`);
      paramIndex += 2;
    }

    // Add category context if provided
    if (category) {
      baseQuery += ` AND a.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Add platform context if provided
    if (platform) {
      baseQuery += ` AND $${paramIndex} = ANY(a.platforms)`;
      queryParams.push(platform);
      paramIndex++;
    }

    // Get categories with counts
    const categoriesQuery = `
      SELECT 
        a.category,
        COUNT(*) as count,
        AVG(a.price) as avg_price,
        AVG(COALESCE(a.rating_average, 0)) as avg_rating
      ${baseQuery}
        AND a.category IS NOT NULL
      GROUP BY a.category
      ORDER BY count DESC, a.category ASC
    `;

    // Get platforms with counts
    const platformsQuery = `
      SELECT 
        platform,
        COUNT(*) as count
      FROM (
        SELECT UNNEST(a.platforms) as platform
        ${baseQuery}
      ) platform_data
      GROUP BY platform
      ORDER BY count DESC, platform ASC
    `;

    // Get price ranges
    const priceRangesQuery = `
      SELECT 
        MIN(a.price) as min_price,
        MAX(a.price) as max_price,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY a.price) as q1_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.price) as median_price,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY a.price) as q3_price,
        COUNT(*) as total_apps
      ${baseQuery}
    `;

    // Get rating distribution
    const ratingsQuery = `
      SELECT 
        CASE 
          WHEN COALESCE(a.rating_average, 0) >= 4.5 THEN '4.5+'
          WHEN COALESCE(a.rating_average, 0) >= 4.0 THEN '4.0+'
          WHEN COALESCE(a.rating_average, 0) >= 3.5 THEN '3.5+'
          WHEN COALESCE(a.rating_average, 0) >= 3.0 THEN '3.0+'
          WHEN COALESCE(a.rating_average, 0) >= 2.0 THEN '2.0+'
          ELSE 'Under 2.0'
        END as rating_range,
        COUNT(*) as count
      ${baseQuery}
      GROUP BY rating_range
      ORDER BY 
        CASE rating_range
          WHEN '4.5+' THEN 1
          WHEN '4.0+' THEN 2
          WHEN '3.5+' THEN 3
          WHEN '3.0+' THEN 4
          WHEN '2.0+' THEN 5
          ELSE 6
        END
    `;

    // Get popular tags
    const tagsQuery = `
      SELECT 
        tag,
        COUNT(*) as count
      FROM (
        SELECT UNNEST(a.tags) as tag
        ${baseQuery}
          AND a.tags IS NOT NULL
      ) tag_data
      WHERE tag IS NOT NULL AND tag != ''
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 20
    `;

    // Get developer verification status distribution
    const developersQuery = `
      SELECT 
        CASE 
          WHEN u.developer_verified = true THEN 'verified'
          ELSE 'unverified'
        END as verification_status,
        COUNT(*) as count
      ${baseQuery}
      GROUP BY verification_status
      ORDER BY count DESC
    `;

    // Execute all queries in parallel
    const [
      categoriesResult,
      platformsResult,
      priceRangesResult,
      ratingsResult,
      tagsResult,
      developersResult
    ] = await Promise.all([
      neonClient.sql(categoriesQuery, queryParams),
      neonClient.sql(platformsQuery, queryParams),
      neonClient.sql(priceRangesQuery, queryParams),
      neonClient.sql(ratingsQuery, queryParams),
      neonClient.sql(tagsQuery, queryParams),
      neonClient.sql(developersQuery, queryParams)
    ]);

    // Process price ranges into meaningful buckets
    const priceData = priceRangesResult[0];
    const priceBuckets = [];

    if (priceData && priceData.total_apps > 0) {
      const minPrice = parseFloat(priceData.min_price) / 100;
      const maxPrice = parseFloat(priceData.max_price) / 100;
      const q1Price = parseFloat(priceData.q1_price) / 100;
      const medianPrice = parseFloat(priceData.median_price) / 100;
      const q3Price = parseFloat(priceData.q3_price) / 100;

      // Create intelligent price buckets
      if (minPrice === 0) {
        priceBuckets.push({ label: 'Free', min: 0, max: 0 });
      }

      if (q1Price > 0) {
        priceBuckets.push({ 
          label: `$0.01 - $${q1Price.toFixed(2)}`, 
          min: 0.01, 
          max: q1Price 
        });
      }

      if (medianPrice > q1Price) {
        priceBuckets.push({ 
          label: `$${(q1Price + 0.01).toFixed(2)} - $${medianPrice.toFixed(2)}`, 
          min: q1Price + 0.01, 
          max: medianPrice 
        });
      }

      if (q3Price > medianPrice) {
        priceBuckets.push({ 
          label: `$${(medianPrice + 0.01).toFixed(2)} - $${q3Price.toFixed(2)}`, 
          min: medianPrice + 0.01, 
          max: q3Price 
        });
      }

      if (maxPrice > q3Price) {
        priceBuckets.push({ 
          label: `$${(q3Price + 0.01).toFixed(2)}+`, 
          min: q3Price + 0.01, 
          max: null 
        });
      }
    }

    // Build intelligent filter response
    const filters = {
      categories: categoriesResult.map(row => ({
        value: row.category,
        label: row.category,
        count: parseInt(row.count),
        avgPrice: parseFloat(row.avg_price) / 100,
        avgRating: parseFloat(row.avg_rating),
      })),

      platforms: platformsResult.map(row => ({
        value: row.platform,
        label: row.platform,
        count: parseInt(row.count),
      })),

      priceRanges: priceBuckets,

      ratings: ratingsResult.map(row => ({
        value: row.rating_range,
        label: `${row.rating_range} stars`,
        count: parseInt(row.count),
      })),

      tags: tagsResult.map(row => ({
        value: row.tag,
        label: row.tag,
        count: parseInt(row.count),
      })),

      developers: developersResult.map(row => ({
        value: row.verification_status,
        label: row.verification_status === 'verified' ? 'Verified Developers' : 'All Developers',
        count: parseInt(row.count),
      })),

      // Smart suggestions based on context
      suggestions: generateSmartSuggestions(query, category, platform, {
        categories: categoriesResult,
        platforms: platformsResult,
        tags: tagsResult,
      }),
    };

    return NextResponse.json({
      success: true,
      filters,
      context: {
        query,
        category,
        platform,
        totalApps: priceData?.total_apps || 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting filter options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get filter options' },
      { status: 500 }
    );
  }
}

// Helper function to generate smart filter suggestions
function generateSmartSuggestions(
  query: string, 
  category: string, 
  platform: string, 
  data: any
): Array<{ type: string; value: string; label: string; reason: string }> {
  const suggestions = [];

  // Suggest popular categories if none selected
  if (!category && data.categories.length > 0) {
    const topCategory = data.categories[0];
    suggestions.push({
      type: 'category',
      value: topCategory.category,
      label: `Browse ${topCategory.category}`,
      reason: `Most popular category (${topCategory.count} apps)`,
    });
  }

  // Suggest popular platforms if none selected
  if (!platform && data.platforms.length > 0) {
    const topPlatform = data.platforms[0];
    suggestions.push({
      type: 'platform',
      value: topPlatform.platform,
      label: `${topPlatform.platform} apps`,
      reason: `Most apps available (${topPlatform.count} apps)`,
    });
  }

  // Suggest related tags based on query
  if (query && data.tags.length > 0) {
    const relatedTags = data.tags.filter((tag: any) => 
      tag.tag.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(tag.tag.toLowerCase())
    ).slice(0, 3);

    relatedTags.forEach((tag: any) => {
      suggestions.push({
        type: 'tag',
        value: tag.tag,
        label: `Apps tagged with "${tag.tag}"`,
        reason: `${tag.count} apps match this tag`,
      });
    });
  }

  // Suggest complementary filters
  if (category && !platform) {
    const categoryPlatforms = data.platforms.slice(0, 2);
    categoryPlatforms.forEach((plat: any) => {
      suggestions.push({
        type: 'platform',
        value: plat.platform,
        label: `${category} apps for ${plat.platform}`,
        reason: `Narrow down to ${plat.platform} platform`,
      });
    });
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}
