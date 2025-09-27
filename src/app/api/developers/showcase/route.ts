import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developer_id');
    const featured = searchParams.get('featured') === 'true';
    const verified = searchParams.get('verified') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'popular'; // popular, newest, top_rated
    const offset = (page - 1) * limit;

    if (developerId) {
      // Get specific developer showcase profile
      const developerQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.avatar_url,
          u.developer_verified,
          u.created_at,
          ds.*,
          (
            SELECT COUNT(*) 
            FROM apps 
            WHERE developer_id = u.id AND status = 'approved'
          ) as total_apps,
          (
            SELECT COUNT(*) 
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            WHERE a.developer_id = u.id AND p.status = 'completed'
          ) as total_sales,
          (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews r
            JOIN apps a ON r.app_id = a.id
            WHERE a.developer_id = u.id
          ) as average_rating,
          (
            SELECT COUNT(*)
            FROM reviews r
            JOIN apps a ON r.app_id = a.id
            WHERE a.developer_id = u.id
          ) as total_reviews,
          (
            SELECT COALESCE(SUM(developer_payout), 0)
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            WHERE a.developer_id = u.id AND p.status = 'completed'
          ) as total_revenue
        FROM users u
        LEFT JOIN developer_showcases ds ON u.id = ds.developer_id
        WHERE u.id = $1 AND u.role = 'developer'
      `;

      const developerResult = await neonClient.query(developerQuery, [developerId]);

      if (developerResult.length === 0) {
        return NextResponse.json(
          { error: 'Developer not found' },
          { status: 404 }
        );
      }

      const developer = developerResult[0];

      // Get developer's apps
      const appsQuery = `
        SELECT 
          a.*,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.id) as review_count,
          (
            SELECT COUNT(*) 
            FROM purchases 
            WHERE app_id = a.id AND status = 'completed'
          ) as purchase_count
        FROM apps a
        LEFT JOIN reviews r ON a.id = r.app_id
        WHERE a.developer_id = $1 AND a.status = 'approved'
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT 6
      `;

      const appsResult = await neonClient.query(appsQuery, [developerId]);

      // Get recent achievements
      const achievementsQuery = `
        SELECT *
        FROM developer_achievements
        WHERE developer_id = $1
        ORDER BY earned_at DESC
        LIMIT 10
      `;

      const achievementsResult = await neonClient.query(achievementsQuery, [developerId]);

      // Get community contributions
      const contributionsQuery = `
        SELECT 
          'forum' as type,
          f.title as title,
          f.created_at,
          f.reply_count as engagement
        FROM forums f
        WHERE f.author_id = $1
        UNION ALL
        SELECT 
          'review_response' as type,
          'Responded to review' as title,
          rr.created_at,
          0 as engagement
        FROM review_responses rr
        WHERE rr.developer_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const contributionsResult = await neonClient.query(contributionsQuery, [developerId]);

      return NextResponse.json({
        developer: developer,
        apps: appsResult.rows,
        achievements: achievementsResult.rows,
        contributions: contributionsResult.rows,
      });
    } else {
      // Get all developer showcases
      let whereClause = 'WHERE u.role = $1';
      let orderClause = 'ORDER BY ds.featured DESC, u.created_at DESC';
      const params = ['developer'];

      if (featured) {
        whereClause += ' AND ds.featured = true';
      }

      if (verified) {
        whereClause += ' AND u.developer_verified = true';
      }

      switch (sort) {
        case 'newest':
          orderClause = 'ORDER BY u.created_at DESC';
          break;
        case 'top_rated':
          orderClause = 'ORDER BY average_rating DESC NULLS LAST';
          break;
        case 'popular':
        default:
          orderClause = 'ORDER BY total_sales DESC NULLS LAST, ds.featured DESC';
      }

      const developersQuery = `
        SELECT 
          u.id,
          u.name,
          u.avatar_url,
          u.developer_verified,
          u.created_at,
          ds.bio,
          ds.website,
          ds.github_url,
          ds.twitter_url,
          ds.linkedin_url,
          ds.specialties,
          ds.featured,
          ds.banner_image,
          (
            SELECT COUNT(*) 
            FROM apps 
            WHERE developer_id = u.id AND status = 'approved'
          ) as total_apps,
          (
            SELECT COUNT(*) 
            FROM purchases p
            JOIN apps a ON p.app_id = a.id
            WHERE a.developer_id = u.id AND p.status = 'completed'
          ) as total_sales,
          (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews r
            JOIN apps a ON r.app_id = a.id
            WHERE a.developer_id = u.id
          ) as average_rating,
          (
            SELECT COUNT(*)
            FROM reviews r
            JOIN apps a ON r.app_id = a.id
            WHERE a.developer_id = u.id
          ) as total_reviews
        FROM users u
        LEFT JOIN developer_showcases ds ON u.id = ds.developer_id
        ${whereClause}
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const developersResult = await neonClient.query(developersQuery, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM users u
        LEFT JOIN developer_showcases ds ON u.id = ds.developer_id
        ${whereClause}
      `;

      const countResult = await neonClient.query(countQuery, params.slice(0, -2));

      return NextResponse.json({
        developers: developersResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult[0].count),
          pages: Math.ceil(parseInt(countResult[0].count) / limit),
        },
        filters: {
          featured,
          verified,
          sort,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching developer showcases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developer showcases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [(session.user as any).id]
    );

    if (userCheck.length === 0 || userCheck[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bio,
      website,
      github_url,
      twitter_url,
      linkedin_url,
      specialties = [],
      banner_image,
      company_name,
      company_size,
      years_experience,
      preferred_technologies = [],
      availability_status = 'available',
      hourly_rate,
      portfolio_items = [],
    } = body;

    // Check if showcase already exists
    const existingShowcase = await neonClient.query(
      'SELECT id FROM developer_showcases WHERE developer_id = $1',
      [(session.user as any).id]
    );

    if (existingShowcase.length > 0) {
      return NextResponse.json(
        { error: 'Developer showcase already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new showcase
    const showcaseResult = await neonClient.query(
      `INSERT INTO developer_showcases (
        developer_id, bio, website, github_url, twitter_url, linkedin_url,
        specialties, banner_image, company_name, company_size, years_experience,
        preferred_technologies, availability_status, hourly_rate, portfolio_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        (session.user as any).id,
        bio,
        website,
        github_url,
        twitter_url,
        linkedin_url,
        JSON.stringify(specialties),
        banner_image,
        company_name,
        company_size,
        years_experience,
        JSON.stringify(preferred_technologies),
        availability_status,
        hourly_rate,
        JSON.stringify(portfolio_items),
      ]
    );

    // Log activity
    await neonClient.query(
      `INSERT INTO user_activity_logs (
        user_id, action, details
      ) VALUES ($1, $2, $3)`,
      [
        (session.user as any).id,
        'showcase_created',
        JSON.stringify({
          showcase_id: showcaseResult[0].id,
        }),
      ]
    );

    return NextResponse.json({
      message: 'Developer showcase created successfully',
      showcase: showcaseResult[0],
    });
  } catch (error) {
    console.error('Error creating developer showcase:', error);
    return NextResponse.json(
      { error: 'Failed to create developer showcase' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a developer
    const userCheck = await neonClient.query(
      'SELECT role FROM users WHERE id = $1',
      [(session.user as any).id]
    );

    if (userCheck.length === 0 || userCheck[0].role !== 'developer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bio,
      website,
      github_url,
      twitter_url,
      linkedin_url,
      specialties,
      banner_image,
      company_name,
      company_size,
      years_experience,
      preferred_technologies,
      availability_status,
      hourly_rate,
      portfolio_items,
    } = body;

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (website !== undefined) {
      updates.push(`website = $${paramCount++}`);
      values.push(website);
    }

    if (github_url !== undefined) {
      updates.push(`github_url = $${paramCount++}`);
      values.push(github_url);
    }

    if (twitter_url !== undefined) {
      updates.push(`twitter_url = $${paramCount++}`);
      values.push(twitter_url);
    }

    if (linkedin_url !== undefined) {
      updates.push(`linkedin_url = $${paramCount++}`);
      values.push(linkedin_url);
    }

    if (specialties !== undefined) {
      updates.push(`specialties = $${paramCount++}`);
      values.push(JSON.stringify(specialties));
    }

    if (banner_image !== undefined) {
      updates.push(`banner_image = $${paramCount++}`);
      values.push(banner_image);
    }

    if (company_name !== undefined) {
      updates.push(`company_name = $${paramCount++}`);
      values.push(company_name);
    }

    if (company_size !== undefined) {
      updates.push(`company_size = $${paramCount++}`);
      values.push(company_size);
    }

    if (years_experience !== undefined) {
      updates.push(`years_experience = $${paramCount++}`);
      values.push(years_experience);
    }

    if (preferred_technologies !== undefined) {
      updates.push(`preferred_technologies = $${paramCount++}`);
      values.push(JSON.stringify(preferred_technologies));
    }

    if (availability_status !== undefined) {
      updates.push(`availability_status = $${paramCount++}`);
      values.push(availability_status);
    }

    if (hourly_rate !== undefined) {
      updates.push(`hourly_rate = $${paramCount++}`);
      values.push(hourly_rate);
    }

    if (portfolio_items !== undefined) {
      updates.push(`portfolio_items = $${paramCount++}`);
      values.push(JSON.stringify(portfolio_items));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push((session.user as any).id);

    const updateQuery = `
      UPDATE developer_showcases 
      SET ${updates.join(', ')}
      WHERE developer_id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await neonClient.query(updateQuery, values);

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Developer showcase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Developer showcase updated successfully',
      showcase: updateResult[0],
    });
  } catch (error) {
    console.error('Error updating developer showcase:', error);
    return NextResponse.json(
      { error: 'Failed to update developer showcase' },
      { status: 500 }
    );
  }
}
