import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/apps - Get all apps or filter by developer
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const developer = searchParams.get('developer');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    
    // Build SQL query
    let query = `
      SELECT 
        a.*,
        u.name as developer_name,
        u.avatar_url as developer_avatar
      FROM apps a
      JOIN users u ON a.developer_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (developer) {
      query += ` AND a.developer_id = $${paramIndex}`;
      params.push(developer);
      paramIndex++;
    }

    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await neonClient.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.rows.length,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/apps:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

// POST /api/apps - Create a new app
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRole = (session.user as any).role;
    if (userRole !== 'developer' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only developers can create apps' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, shortDescription, price, category, platforms } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await neonClient.query(
      `INSERT INTO apps (name, description, short_description, price, developer_id, category, platforms, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [name, description, shortDescription, parseInt(price), (session.user as any).id, category, 
       Array.isArray(platforms) ? platforms : platforms?.split(',').map((p: string) => p.trim()) || [], 'pending']
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'App submitted successfully',
    });
  } catch (error: any) {
    console.error('Error in POST /api/apps:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}
