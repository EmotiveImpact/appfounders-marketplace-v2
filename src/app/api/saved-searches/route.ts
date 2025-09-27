import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

interface SavedSearchRequest {
  name: string;
  search_criteria: {
    query?: string;
    category?: string;
    platform?: string;
    price_min?: number;
    price_max?: number;
    rating_min?: number;
    tags?: string[];
  };
  alert_enabled?: boolean;
  alert_frequency?: 'immediate' | 'daily' | 'weekly';
}

// GET /api/saved-searches - Get user's saved searches
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeAlerts = searchParams.get('include_alerts') === 'true';

      let query = `
        SELECT 
          ss.*,
          COUNT(sa.id) as unread_alerts
        FROM saved_searches ss
        LEFT JOIN search_alerts sa ON ss.id = sa.saved_search_id AND sa.read = false
        WHERE ss.user_id = $1
        GROUP BY ss.id
        ORDER BY ss.created_at DESC
      `;

      const savedSearches = // await neonClient.sql(query, [user.id]);

      // If including alerts, get recent alerts for each search
      if (includeAlerts && savedSearches.length > 0) {
        const searchIds = savedSearches.map(s => s.id);
        const alertsQuery = `
          SELECT 
            sa.*,
            a.name as app_name,
            a.short_description as app_description,
            a.price as app_price,
            a.icon_url as app_icon
          FROM search_alerts sa
          JOIN apps a ON sa.app_id = a.id
          WHERE sa.saved_search_id = ANY($1)
          ORDER BY sa.sent_at DESC
          LIMIT 50
        `;

        const alerts = // await neonClient.sql(alertsQuery, [searchIds]);

        // Group alerts by saved search
        const alertsBySearch = alerts.reduce((acc: any, alert: any) => {
          if (!acc[alert.saved_search_id]) {
            acc[alert.saved_search_id] = [];
          }
          acc[alert.saved_search_id].push(alert);
          return acc;
        }, {});

        // Add alerts to saved searches
        savedSearches.forEach((search: any) => {
          search.recent_alerts = alertsBySearch[search.id] || [];
        });
      }

      return NextResponse.json({
        success: true,
        saved_searches: savedSearches,
      });
    } catch (error: any) {
      console.error('Error getting saved searches:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get saved searches' },
        { status: 500 }
      );
    }
  }
);

// POST /api/saved-searches - Create a new saved search
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const {
        name,
        search_criteria,
        alert_enabled = true,
        alert_frequency = 'immediate',
      }: SavedSearchRequest = await req.json();

      if (!name || !search_criteria) {
        return NextResponse.json(
          { error: 'Name and search criteria are required' },
          { status: 400 }
        );
      }

      // Validate search criteria
      if (Object.keys(search_criteria).length === 0) {
        return NextResponse.json(
          { error: 'Search criteria cannot be empty' },
          { status: 400 }
        );
      }

      // Check if user already has a saved search with this name
      const existingQuery = `
        SELECT id FROM saved_searches 
        WHERE user_id = $1 AND name = $2
      `;
      const existing = // await neonClient.sql(existingQuery, [user.id, name]);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'A saved search with this name already exists' },
          { status: 400 }
        );
      }

      // Create the saved search
      const insertQuery = `
        INSERT INTO saved_searches (
          user_id,
          name,
          search_criteria,
          alert_enabled,
          alert_frequency
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = // await neonClient.sql(insertQuery, [
        user.id,
        name,
        JSON.stringify(search_criteria),
        alert_enabled,
        alert_frequency,
      ]);

      const savedSearch = result[0];

      // Check for immediate matches if alerts are enabled
      if (alert_enabled && alert_frequency === 'immediate') {
        await checkForMatches(savedSearch.id, search_criteria, user.id);
      }

      return NextResponse.json({
        success: true,
        saved_search: savedSearch,
        message: 'Saved search created successfully',
      });
    } catch (error: any) {
      console.error('Error creating saved search:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create saved search' },
        { status: 500 }
      );
    }
  }
);

// Helper function to check for matches
async function checkForMatches(savedSearchId: string, criteria: any, userId: string) {
  try {
    // Build search query based on criteria
    let searchQuery = `
      SELECT a.id
      FROM apps a
      WHERE a.status = 'approved'
        AND a.created_at > NOW() - INTERVAL '24 hours'
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add search conditions based on criteria
    if (criteria.query) {
      searchQuery += ` AND (
        to_tsvector('english', a.name || ' ' || a.description || ' ' || a.short_description || ' ' || COALESCE(array_to_string(a.tags, ' '), ''))
        @@ plainto_tsquery('english', $${paramIndex})
        OR a.name ILIKE $${paramIndex + 1}
        OR a.description ILIKE $${paramIndex + 1}
      )`;
      queryParams.push(criteria.query, `%${criteria.query}%`);
      paramIndex += 2;
    }

    if (criteria.category) {
      searchQuery += ` AND a.category = $${paramIndex}`;
      queryParams.push(criteria.category);
      paramIndex++;
    }

    if (criteria.platform) {
      searchQuery += ` AND $${paramIndex} = ANY(a.platforms)`;
      queryParams.push(criteria.platform);
      paramIndex++;
    }

    if (criteria.price_min !== undefined) {
      searchQuery += ` AND a.price >= $${paramIndex}`;
      queryParams.push(criteria.price_min * 100); // Convert to cents
      paramIndex++;
    }

    if (criteria.price_max !== undefined) {
      searchQuery += ` AND a.price <= $${paramIndex}`;
      queryParams.push(criteria.price_max * 100); // Convert to cents
      paramIndex++;
    }

    if (criteria.rating_min !== undefined) {
      searchQuery += ` AND COALESCE(a.rating_average, 0) >= $${paramIndex}`;
      queryParams.push(criteria.rating_min);
      paramIndex++;
    }

    if (criteria.tags && criteria.tags.length > 0) {
      searchQuery += ` AND a.tags && $${paramIndex}`;
      queryParams.push(criteria.tags);
      paramIndex++;
    }

    // Exclude apps that already have alerts for this saved search
    searchQuery += ` AND a.id NOT IN (
      SELECT app_id FROM search_alerts 
      WHERE saved_search_id = $${paramIndex}
    )`;
    queryParams.push(savedSearchId);

    const matches = // await neonClient.sql(searchQuery, queryParams);

    // Create alerts for new matches
    if (matches.length > 0) {
      const alertInserts = matches.map((match: any) => 
        `('${savedSearchId}', '${match.id}', '${userId}', 'new_match')`
      ).join(', ');

      const insertAlertsQuery = `
        INSERT INTO search_alerts (saved_search_id, app_id, user_id, alert_type)
        VALUES ${alertInserts}
      `;

      // await neonClient.sql(insertAlertsQuery);

      // Update last checked timestamp
      // await neonClient.sql(
        'UPDATE saved_searches SET last_checked_at = NOW() WHERE id = $1',
        [savedSearchId]
      );
    }

    return matches.length;
  } catch (error) {
    console.error('Error checking for matches:', error);
    return 0;
  }
}
