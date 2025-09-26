import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const forumId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get forum details
    const forumQuery = `
      SELECT 
        f.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.role as author_role,
        a.name as app_name
      FROM forums f
      JOIN users u ON f.author_id = u.id
      LEFT JOIN apps a ON f.app_id = a.id
      WHERE f.id = $1 AND f.status != 'deleted'
    `;

    const forumResult = await neonClient.query(forumQuery, [forumId]);

    if (forumResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Forum not found' },
        { status: 404 }
      );
    }

    const forum = forumResult.rows[0];

    // Increment view count
    await neonClient.query(
      'UPDATE forums SET view_count = view_count + 1 WHERE id = $1',
      [forumId]
    );

    // Get forum posts (replies)
    const postsQuery = `
      SELECT 
        fp.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        u.role as author_role,
        (
          SELECT COUNT(*) 
          FROM forum_post_likes fpl 
          WHERE fpl.post_id = fp.id
        ) as like_count,
        (
          SELECT COUNT(*) 
          FROM forum_post_reports fpr 
          WHERE fpr.post_id = fp.id AND fpr.status = 'pending'
        ) as report_count
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      WHERE fp.forum_id = $1 AND fp.status = 'active'
      ORDER BY fp.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const postsResult = await neonClient.query(postsQuery, [forumId, limit, offset]);

    // Get total posts count
    const postsCountQuery = `
      SELECT COUNT(*) 
      FROM forum_posts 
      WHERE forum_id = $1 AND status = 'active'
    `;

    const postsCountResult = await neonClient.query(postsCountQuery, [forumId]);

    // Check if current user has liked any posts (if authenticated)
    let userLikes = [];
    const session = await getServerSession(authOptions);
    if (session?.user?.id && postsResult.rows.length > 0) {
      const postIds = postsResult.rows.map(post => post.id);
      const likesQuery = `
        SELECT post_id 
        FROM forum_post_likes 
        WHERE user_id = $1 AND post_id = ANY($2)
      `;

      const likesResult = await neonClient.query(likesQuery, [
        session.user.id,
        postIds,
      ]);

      userLikes = likesResult.rows.map(row => row.post_id);
    }

    // Add user_has_liked flag to posts
    const postsWithLikes = postsResult.rows.map(post => ({
      ...post,
      user_has_liked: userLikes.includes(post.id),
    }));

    return NextResponse.json({
      forum: {
        ...forum,
        view_count: forum.view_count + 1, // Include the incremented view count
      },
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        total: parseInt(postsCountResult.rows[0].count),
        pages: Math.ceil(parseInt(postsCountResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum details' },
      { status: 500 }
    );
  }
}
