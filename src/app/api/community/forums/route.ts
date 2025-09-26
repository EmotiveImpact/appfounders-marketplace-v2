import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'latest'; // latest, popular, oldest
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.status = $1';
    let orderClause = 'ORDER BY f.created_at DESC';
    const params = ['active'];

    if (category) {
      whereClause += ' AND f.category = $2';
      params.push(category);
    }

    switch (sort) {
      case 'popular':
        orderClause = 'ORDER BY f.reply_count DESC, f.view_count DESC, f.created_at DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY f.created_at ASC';
        break;
      default:
        orderClause = 'ORDER BY f.last_activity_at DESC NULLS LAST, f.created_at DESC';
    }

    const forumsQuery = `
      SELECT 
        f.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.role as author_role,
        lr.content as last_reply_content,
        lr.created_at as last_reply_at,
        lru.name as last_reply_author,
        (
          SELECT COUNT(*) 
          FROM forum_posts fp 
          WHERE fp.forum_id = f.id AND fp.status = 'active'
        ) as actual_reply_count
      FROM forums f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN forum_posts lr ON f.last_reply_id = lr.id
      LEFT JOIN users lru ON lr.author_id = lru.id
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const forumsResult = await neonClient.query(forumsQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM forums f ${whereClause}`;
    const countResult = await neonClient.query(countQuery, params.slice(0, -2));

    // Get forum categories with counts
    const categoriesQuery = `
      SELECT 
        category,
        COUNT(*) as forum_count,
        SUM(reply_count) as total_replies
      FROM forums 
      WHERE status = 'active'
      GROUP BY category
      ORDER BY forum_count DESC
    `;

    const categoriesResult = await neonClient.query(categoriesQuery);

    return NextResponse.json({
      forums: forumsResult.rows,
      categories: categoriesResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
      filters: {
        category,
        sort,
      },
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      category,
      tags = [],
      app_id = null,
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'general',
      'feature-requests',
      'bug-reports',
      'app-showcase',
      'developer-help',
      'tester-feedback',
      'announcements',
      'marketplace-discussion'
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // If app_id is provided, verify the user has access to it
    if (app_id) {
      const appCheck = await neonClient.query(
        `SELECT id FROM apps 
         WHERE id = $1 AND (
           developer_id = $2 OR 
           id IN (SELECT app_id FROM purchases WHERE user_id = $2 AND status = 'completed')
         )`,
        [app_id, session.user.id]
      );

      if (appCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this app' },
          { status: 403 }
        );
      }
    }

    // Create forum thread
    const forumResult = await neonClient.query(
      `INSERT INTO forums (
        title, content, category, author_id, app_id, tags, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        title,
        content,
        category,
        session.user.id,
        app_id,
        JSON.stringify(tags),
        'active',
      ]
    );

    const forum = forumResult.rows[0];

    // Log activity
    await neonClient.query(
      `INSERT INTO user_activity_logs (
        user_id, action, details
      ) VALUES ($1, $2, $3)`,
      [
        session.user.id,
        'forum_created',
        JSON.stringify({
          forum_id: forum.id,
          title: forum.title,
          category: forum.category,
        }),
      ]
    );

    // Get the created forum with author info
    const createdForumQuery = `
      SELECT 
        f.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.role as author_role
      FROM forums f
      JOIN users u ON f.author_id = u.id
      WHERE f.id = $1
    `;

    const createdForumResult = await neonClient.query(createdForumQuery, [forum.id]);

    return NextResponse.json({
      message: 'Forum thread created successfully',
      forum: createdForumResult.rows[0],
    });
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json(
      { error: 'Failed to create forum thread' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      content,
      category,
      tags,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Forum ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the forum or is admin/moderator
    const forumCheck = await neonClient.query(
      `SELECT f.*, u.role as user_role 
       FROM forums f, users u 
       WHERE f.id = $1 AND u.id = $2`,
      [id, session.user.id]
    );

    if (forumCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    const forum = forumCheck.rows[0];
    const userRole = forum.user_role;

    // Check permissions
    const canEdit = forum.author_id === session.user.id || 
                   ['admin', 'moderator'].includes(userRole);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(tags));
    }

    if (status !== undefined && ['admin', 'moderator'].includes(userRole)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE forums 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await neonClient.query(updateQuery, values);

    return NextResponse.json({
      message: 'Forum updated successfully',
      forum: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating forum:', error);
    return NextResponse.json(
      { error: 'Failed to update forum' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Forum ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const forumCheck = await neonClient.query(
      `SELECT f.author_id, u.role 
       FROM forums f, users u 
       WHERE f.id = $1 AND u.id = $2`,
      [id, session.user.id]
    );

    if (forumCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    const forum = forumCheck.rows[0];
    const canDelete = forum.author_id === session.user.id || 
                     ['admin', 'moderator'].includes(forum.role);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Soft delete by updating status
    await neonClient.query(
      'UPDATE forums SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );

    return NextResponse.json({
      message: 'Forum deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting forum:', error);
    return NextResponse.json(
      { error: 'Failed to delete forum' },
      { status: 500 }
    );
  }
}
