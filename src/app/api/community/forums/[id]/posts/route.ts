import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forumId = params.id;
    const body = await request.json();
    const { content, parent_id = null } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify forum exists and is active
    const forumCheck = await neonClient.query(
      'SELECT id, status FROM forums WHERE id = $1',
      [forumId]
    );

    if (forumCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    if (forumCheck.rows[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot post to inactive forum' },
        { status: 400 }
      );
    }

    // If parent_id is provided, verify it exists and belongs to this forum
    if (parent_id) {
      const parentCheck = await neonClient.query(
        'SELECT id FROM forum_posts WHERE id = $1 AND forum_id = $2 AND status = $3',
        [parent_id, forumId, 'active']
      );

      if (parentCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Parent post not found' },
          { status: 404 }
        );
      }
    }

    // Create the post
    const postResult = await neonClient.query(
      `INSERT INTO forum_posts (
        forum_id, author_id, content, parent_id, status
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [forumId, session.user.id, content, parent_id, 'active']
    );

    const post = postResult.rows[0];

    // Update forum reply count and last activity
    await neonClient.query(
      `UPDATE forums SET 
        reply_count = reply_count + 1,
        last_reply_id = $1,
        last_activity_at = NOW(),
        updated_at = NOW()
       WHERE id = $2`,
      [post.id, forumId]
    );

    // Log activity
    await neonClient.query(
      `INSERT INTO user_activity_logs (
        user_id, action, details
      ) VALUES ($1, $2, $3)`,
      [
        session.user.id,
        'forum_post_created',
        JSON.stringify({
          forum_id: forumId,
          post_id: post.id,
          is_reply: !!parent_id,
        }),
      ]
    );

    // Get the created post with author info
    const createdPostQuery = `
      SELECT 
        fp.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.role as author_role
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      WHERE fp.id = $1
    `;

    const createdPostResult = await neonClient.query(createdPostQuery, [post.id]);

    return NextResponse.json({
      message: 'Post created successfully',
      post: createdPostResult.rows[0],
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, content, status } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the post or is admin/moderator
    const postCheck = await neonClient.query(
      `SELECT fp.*, u.role as user_role 
       FROM forum_posts fp, users u 
       WHERE fp.id = $1 AND u.id = $2`,
      [post_id, session.user.id]
    );

    if (postCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postCheck.rows[0];
    const userRole = post.user_role;

    // Check permissions
    const canEdit = post.author_id === session.user.id || 
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

    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
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
    values.push(post_id);

    const updateQuery = `
      UPDATE forum_posts 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await neonClient.query(updateQuery, values);

    return NextResponse.json({
      message: 'Post updated successfully',
      post: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const postCheck = await neonClient.query(
      `SELECT fp.author_id, fp.forum_id, u.role 
       FROM forum_posts fp, users u 
       WHERE fp.id = $1 AND u.id = $2`,
      [postId, session.user.id]
    );

    if (postCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postCheck.rows[0];
    const canDelete = post.author_id === session.user.id || 
                     ['admin', 'moderator'].includes(post.role);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Soft delete by updating status
    await neonClient.query(
      'UPDATE forum_posts SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', postId]
    );

    // Update forum reply count
    await neonClient.query(
      'UPDATE forums SET reply_count = reply_count - 1 WHERE id = $1',
      [post.forum_id]
    );

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
