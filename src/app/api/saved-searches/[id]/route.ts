import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

interface UpdateSavedSearchRequest {
  name?: string;
  search_criteria?: any;
  alert_enabled?: boolean;
  alert_frequency?: 'immediate' | 'daily' | 'weekly';
}

// GET /api/saved-searches/[id] - Get a specific saved search
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;

      const query = `
        SELECT 
          ss.*,
          COUNT(sa.id) as total_alerts,
          COUNT(CASE WHEN sa.read = false THEN 1 END) as unread_alerts
        FROM saved_searches ss
        LEFT JOIN search_alerts sa ON ss.id = sa.saved_search_id
        WHERE ss.id = $1 AND ss.user_id = $2
        GROUP BY ss.id
      `;

      const result = // await neonClient.sql(query, [id, user.id]);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Saved search not found' },
          { status: 404 }
        );
      }

      const savedSearch = result[0];

      // Get recent alerts
      const alertsQuery = `
        SELECT 
          sa.*,
          a.name as app_name,
          a.short_description as app_description,
          a.price as app_price,
          a.icon_url as app_icon,
          a.rating_average,
          a.rating_count,
          u.name as developer_name
        FROM search_alerts sa
        JOIN apps a ON sa.app_id = a.id
        JOIN users u ON a.developer_id = u.id
        WHERE sa.saved_search_id = $1
        ORDER BY sa.sent_at DESC
        LIMIT 20
      `;

      const alerts = // await neonClient.sql(alertsQuery, [id]);
      savedSearch.recent_alerts = alerts;

      return NextResponse.json({
        success: true,
        saved_search: savedSearch,
      });
    } catch (error: any) {
      console.error('Error getting saved search:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get saved search' },
        { status: 500 }
      );
    }
  }
);

// PUT /api/saved-searches/[id] - Update a saved search
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      const updates: UpdateSavedSearchRequest = await req.json();

      // Verify ownership
      const ownershipQuery = `
        SELECT id FROM saved_searches 
        WHERE id = $1 AND user_id = $2
      `;
      const ownership = // await neonClient.sql(ownershipQuery, [id, user.id]);

      if (ownership.length === 0) {
        return NextResponse.json(
          { error: 'Saved search not found' },
          { status: 404 }
        );
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(updates.name);
        paramIndex++;
      }

      if (updates.search_criteria !== undefined) {
        updateFields.push(`search_criteria = $${paramIndex}`);
        updateValues.push(JSON.stringify(updates.search_criteria));
        paramIndex++;
      }

      if (updates.alert_enabled !== undefined) {
        updateFields.push(`alert_enabled = $${paramIndex}`);
        updateValues.push(updates.alert_enabled);
        paramIndex++;
      }

      if (updates.alert_frequency !== undefined) {
        updateFields.push(`alert_frequency = $${paramIndex}`);
        updateValues.push(updates.alert_frequency);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        );
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const updateQuery = `
        UPDATE saved_searches 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = // await neonClient.sql(updateQuery, updateValues);

      return NextResponse.json({
        success: true,
        saved_search: result[0],
        message: 'Saved search updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating saved search:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update saved search' },
        { status: 500 }
      );
    }
  }
);

// DELETE /api/saved-searches/[id] - Delete a saved search
export const DELETE = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;

      // Verify ownership and delete
      const deleteQuery = `
        DELETE FROM saved_searches 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = // await neonClient.sql(deleteQuery, [id, user.id]);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Saved search not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Saved search deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting saved search:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete saved search' },
        { status: 500 }
      );
    }
  }
);

// POST /api/saved-searches/[id]/check - Manually check for new matches
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;

      // Get the saved search
      const searchQuery = `
        SELECT * FROM saved_searches 
        WHERE id = $1 AND user_id = $2
      `;

      const searchResult = // await neonClient.sql(searchQuery, [id, user.id]);

      if (searchResult.length === 0) {
        return NextResponse.json(
          { error: 'Saved search not found' },
          { status: 404 }
        );
      }

      const savedSearch = searchResult[0];
      const criteria = savedSearch.search_criteria;

      // Check for new matches
      const newMatches = await checkForMatches(id, criteria, user.id);

      // Update last checked timestamp
      // await neonClient.sql(
        'UPDATE saved_searches SET last_checked_at = NOW() WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        success: true,
        new_matches: newMatches,
        message: newMatches > 0 
          ? `Found ${newMatches} new matching app${newMatches === 1 ? '' : 's'}!`
          : 'No new matches found',
      });
    } catch (error: any) {
      console.error('Error checking for matches:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to check for matches' },
        { status: 500 }
      );
    }
  }
);

// Helper function to check for matches (same as in main route)
async function checkForMatches(savedSearchId: string, criteria: any, userId: string) {
  try {
    let searchQuery = `
      SELECT a.id
      FROM apps a
      WHERE a.status = 'approved'
        AND a.created_at > (
          SELECT COALESCE(last_checked_at, created_at) 
          FROM saved_searches 
          WHERE id = $1
        )
    `;

    const queryParams: any[] = [savedSearchId];
    let paramIndex = 2;

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
      queryParams.push(criteria.price_min * 100);
      paramIndex++;
    }

    if (criteria.price_max !== undefined) {
      searchQuery += ` AND a.price <= $${paramIndex}`;
      queryParams.push(criteria.price_max * 100);
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

    searchQuery += ` AND a.id NOT IN (
      SELECT app_id FROM search_alerts 
      WHERE saved_search_id = $1
    )`;

    const matches = // await neonClient.sql(searchQuery, queryParams);

    if (matches.length > 0) {
      const alertInserts = matches.map((match: any) => 
        `('${savedSearchId}', '${match.id}', '${userId}', 'new_match')`
      ).join(', ');

      const insertAlertsQuery = `
        INSERT INTO search_alerts (saved_search_id, app_id, user_id, alert_type)
        VALUES ${alertInserts}
      `;

      // await neonClient.sql(insertAlertsQuery);
    }

    return matches.length;
  } catch (error) {
    console.error('Error checking for matches:', error);
    return 0;
  }
}
