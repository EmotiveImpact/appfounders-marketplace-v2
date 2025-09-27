import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, initial_message } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (user_id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Cannot start conversation with yourself' },
        { status: 400 }
      );
    }

    // Verify the other user exists
    const userCheck = await neonClient.query(
      'SELECT id, name, role FROM users WHERE id = $1',
      [user_id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const otherUser = userCheck[0];

    // Check if conversation already exists
    const existingConversation = await neonClient.query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) 
       OR (user1_id = $2 AND user2_id = $1)`,
      [(session.user as any).id, user_id]
    );

    if (existingConversation.length > 0) {
      return NextResponse.json({
        conversation_id: existingConversation[0].id,
        message: 'Conversation already exists',
        existing: true,
      });
    }

    // Create new conversation
    const conversationResult = await neonClient.query(
      `INSERT INTO conversations (user1_id, user2_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [(session.user as any).id, user_id]
    );

    const conversation = conversationResult[0];

    // Send initial message if provided
    if (initial_message && initial_message.trim().length > 0) {
      const messageResult = await neonClient.query(
        `INSERT INTO messages (
          conversation_id, sender_id, recipient_id, content, message_type
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [
          conversation.id,
          (session.user as any).id,
          user_id,
          initial_message,
          'text',
        ]
      );

      const message = messageResult[0];

      // Update conversation with first message
      await neonClient.query(
        `UPDATE conversations 
         SET last_message_id = $1, updated_at = NOW() 
         WHERE id = $2`,
        [message.id, conversation.id]
      );
    }

    // Log activity
    await neonClient.query(
      `INSERT INTO user_activity_logs (
        user_id, action, details
      ) VALUES ($1, $2, $3)`,
      [
        (session.user as any).id,
        'conversation_started',
        JSON.stringify({
          conversation_id: conversation.id,
          other_user_id: user_id,
          other_user_name: otherUser.name,
        }),
      ]
    );

    return NextResponse.json({
      conversation_id: conversation.id,
      message: 'Conversation started successfully',
      other_user: otherUser,
      existing: false,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role'); // developer, tester, admin
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get users that can be messaged (excluding current user)
    let whereClause = 'WHERE u.id != $1';
    const params = [(session.user as any).id];

    if (search) {
      whereClause += ' AND (u.name ILIKE $2 OR u.email ILIKE $2)';
      params.push(`%${search}%`);
    }

    if (role) {
      whereClause += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }

    const usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar_url,
        u.developer_verified,
        EXISTS(
          SELECT 1 FROM conversations c 
          WHERE (c.user1_id = u.id AND c.user2_id = $1) 
          OR (c.user1_id = $1 AND c.user2_id = u.id)
        ) as has_conversation,
        (
          SELECT c.id FROM conversations c 
          WHERE (c.user1_id = u.id AND c.user2_id = $1) 
          OR (c.user1_id = $1 AND c.user2_id = u.id)
          LIMIT 1
        ) as conversation_id
      FROM users u
      ${whereClause}
      ORDER BY u.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const usersResult = await neonClient.query(usersQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await neonClient.query(countQuery, params.slice(0, -2));

    return NextResponse.json({
      users: usersResult,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count),
        pages: Math.ceil(parseInt(countResult[0].count) / limit),
      },
      filters: {
        search,
        role,
      },
    });
  } catch (error) {
    console.error('Error fetching users for messaging:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify user is part of the conversation
    const conversationCheck = await neonClient.query(
      `SELECT id FROM conversations 
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, (session.user as any).id]
    );

    if (conversationCheck.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete the conversation for this user
    await neonClient.query(
      `INSERT INTO conversation_deletions (conversation_id, user_id, deleted_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (conversation_id, user_id) 
       DO UPDATE SET deleted_at = NOW()`,
      [conversationId, (session.user as any).id]
    );

    return NextResponse.json({
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
