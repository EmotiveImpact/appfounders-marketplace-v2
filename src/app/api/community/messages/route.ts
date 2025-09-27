import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (conversationId) {
      // Get messages for a specific conversation
      
      // First verify user is part of this conversation
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

      // Get messages
      const messagesQuery = `
        SELECT 
          m.*,
          u.name as sender_name,
          u.avatar_url as sender_avatar,
          u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const messagesResult = await neonClient.query(messagesQuery, [
        conversationId,
        limit,
        offset,
      ]);

      // Mark messages as read
      await neonClient.query(
        `UPDATE messages 
         SET read_at = NOW() 
         WHERE conversation_id = $1 
         AND recipient_id = $2 
         AND read_at IS NULL`,
        [conversationId, (session.user as any).id]
      );

      // Get total count
      const countResult = await neonClient.query(
        'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
        [conversationId]
      );

      return NextResponse.json({
        messages: messagesResult.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          total: parseInt(countResult[0].count),
          pages: Math.ceil(parseInt(countResult[0].count) / limit),
        },
      });
    } else {
      // Get all conversations for the user
      const conversationsQuery = `
        SELECT 
          c.*,
          CASE 
            WHEN c.user1_id = $1 THEN u2.name
            ELSE u1.name
          END as other_user_name,
          CASE 
            WHEN c.user1_id = $1 THEN u2.avatar_url
            ELSE u1.avatar_url
          END as other_user_avatar,
          CASE 
            WHEN c.user1_id = $1 THEN u2.role
            ELSE u1.role
          END as other_user_role,
          CASE 
            WHEN c.user1_id = $1 THEN u2.id
            ELSE u1.id
          END as other_user_id,
          lm.content as last_message_content,
          lm.created_at as last_message_at,
          lm.sender_id as last_message_sender_id,
          (
            SELECT COUNT(*) 
            FROM messages 
            WHERE conversation_id = c.id 
            AND recipient_id = $1 
            AND read_at IS NULL
          ) as unread_count
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        LEFT JOIN messages lm ON c.last_message_id = lm.id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY c.updated_at DESC
        LIMIT $2 OFFSET $3
      `;

      const conversationsResult = await neonClient.query(conversationsQuery, [
        (session.user as any).id,
        limit,
        offset,
      ]);

      // Get total count
      const countResult = await neonClient.query(
        'SELECT COUNT(*) FROM conversations WHERE user1_id = $1 OR user2_id = $1',
        [(session.user as any).id]
      );

      return NextResponse.json({
        conversations: conversationsResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult[0].count),
          pages: Math.ceil(parseInt(countResult[0].count) / limit),
        },
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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

    const body = await request.json();
    let {
      recipient_id,
      conversation_id,
      content,
      message_type = 'text',
      attachments = [],
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    let finalConversationId = conversation_id;

    if (!finalConversationId) {
      if (!recipient_id) {
        return NextResponse.json(
          { error: 'Recipient ID is required for new conversations' },
          { status: 400 }
        );
      }

      // Verify recipient exists and is not the sender
      if (recipient_id === (session.user as any).id) {
        return NextResponse.json(
          { error: 'Cannot send message to yourself' },
          { status: 400 }
        );
      }

      const recipientCheck = await neonClient.query(
        'SELECT id FROM users WHERE id = $1',
        [recipient_id]
      );

      if (recipientCheck.length === 0) {
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 404 }
        );
      }

      // Check if conversation already exists
      const existingConversation = await neonClient.query(
        `SELECT id FROM conversations 
         WHERE (user1_id = $1 AND user2_id = $2) 
         OR (user1_id = $2 AND user2_id = $1)`,
        [(session.user as any).id, recipient_id]
      );

      if (existingConversation.length > 0) {
        finalConversationId = existingConversation[0].id;
      } else {
        // Create new conversation
        const conversationResult = await neonClient.query(
          `INSERT INTO conversations (user1_id, user2_id) 
           VALUES ($1, $2) 
           RETURNING id`,
          [(session.user as any).id, recipient_id]
        );

        finalConversationId = conversationResult[0].id;
      }
    } else {
      // Verify user is part of the conversation
      const conversationCheck = await neonClient.query(
        `SELECT user1_id, user2_id FROM conversations 
         WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
        [finalConversationId, (session.user as any).id]
      );

      if (conversationCheck.length === 0) {
        return NextResponse.json(
          { error: 'Conversation not found or access denied' },
          { status: 404 }
        );
      }

      // Determine recipient_id from conversation
      const conversation = conversationCheck[0];
      recipient_id = conversation.user1_id === (session.user as any).id 
        ? conversation.user2_id 
        : conversation.user1_id;
    }

    // Create the message
    const messageResult = await neonClient.query(
      `INSERT INTO messages (
        conversation_id, sender_id, recipient_id, content, 
        message_type, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [
        finalConversationId,
        (session.user as any).id,
        recipient_id,
        content,
        message_type,
        JSON.stringify(attachments),
      ]
    );

    const message = messageResult[0];

    // Update conversation with last message
    await neonClient.query(
      `UPDATE conversations 
       SET last_message_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [message.id, finalConversationId]
    );

    // Log activity
    await neonClient.query(
      `INSERT INTO user_activity_logs (
        user_id, action, details
      ) VALUES ($1, $2, $3)`,
      [
        (session.user as any).id,
        'message_sent',
        JSON.stringify({
          conversation_id: finalConversationId,
          message_id: message.id,
          recipient_id,
        }),
      ]
    );

    // TODO: Send real-time notification to recipient
    // This would integrate with WebSocket or push notification service

    // Get the created message with sender info
    const createdMessageQuery = `
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar,
        u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `;

    const createdMessageResult = await neonClient.query(createdMessageQuery, [message.id]);

    return NextResponse.json({
      message: 'Message sent successfully',
      message_data: createdMessageResult[0],
      conversation_id: finalConversationId,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
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

    const body = await request.json();
    const { message_id, action } = body;

    if (!message_id || !action) {
      return NextResponse.json(
        { error: 'Message ID and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'mark_read':
        await neonClient.query(
          `UPDATE messages 
           SET read_at = NOW() 
           WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL`,
          [message_id, (session.user as any).id]
        );
        break;

      case 'delete':
        // Verify user owns the message
        const messageCheck = await neonClient.query(
          'SELECT sender_id FROM messages WHERE id = $1',
          [message_id]
        );

        if (messageCheck.length === 0) {
          return NextResponse.json(
            { error: 'Message not found' },
            { status: 404 }
          );
        }

        if (messageCheck[0].sender_id !== (session.user as any).id) {
          return NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }

        await neonClient.query(
          'UPDATE messages SET deleted_at = NOW() WHERE id = $1',
          [message_id]
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Message ${action} completed successfully`,
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
