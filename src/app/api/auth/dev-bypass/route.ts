import { NextRequest, NextResponse } from 'next/server';
import { neonClient } from '@/lib/database/neon-client';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

// Only allow in development mode
// if (process.env.NODE_ENV === 'production') {
//   throw new Error('Dev bypass is not available in production');
// }

const TEST_USERS = [
  {
    id: 'dev-admin-001',
    email: 'admin@dev.local',
    name: 'Dev Admin',
    role: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    developer_verified: false,
  },
  {
    id: 'dev-developer-001',
    email: 'developer@dev.local',
    name: 'Dev Developer',
    role: 'developer',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
    developer_verified: true,
  },
  {
    id: 'dev-tester-001',
    email: 'tester@dev.local',
    name: 'Dev Tester',
    role: 'tester',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tester',
    developer_verified: false,
  },
  {
    id: 'dev-user-001',
    email: 'user@dev.local',
    name: 'Dev User',
    role: 'user',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    developer_verified: false,
  },
];

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev bypass is not available in production' }, { status: 403 });
  }
  // Double-check environment
  if ((process.env.NODE_ENV as any) === 'production') {
    return NextResponse.json(
      { error: 'Dev bypass not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const testUser = TEST_USERS.find(user => user.id === userId);
    if (!testUser) {
      return NextResponse.json(
        { error: 'Invalid test user ID' },
        { status: 400 }
      );
    }

    // Ensure test user exists in database
    await ensureTestUserExists(testUser);

    // Create a simple session token (mimicking NextAuth structure)
    const sessionToken = await createSessionToken(testUser);

    // Set the session cookie
    const cookieStore = cookies();
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV as string) === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        avatar_url: testUser.avatar_url,
      },
    });
  } catch (error) {
    console.error('Dev bypass error:', error);
    return NextResponse.json(
      { error: 'Failed to create dev session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Double-check environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev bypass not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    available: true,
    testUsers: TEST_USERS.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
    })),
  });
}

export async function DELETE() {
  // Double-check environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Dev bypass not available in production' },
      { status: 403 }
    );
  }

  try {
    // Clear the session cookie
    const cookieStore = cookies();
    cookieStore.delete('next-auth.session-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dev logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

async function ensureTestUserExists(testUser: typeof TEST_USERS[0]) {
  try {
    // Check if user exists
    const existingUser = await neonClient.query(
      'SELECT id FROM users WHERE id = $1',
      [testUser.id]
    );

    if (existingUser.length === 0) {
      // Create test user
      await neonClient.query(
        `INSERT INTO users (
          id, email, name, role, avatar_url, developer_verified, email_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          avatar_url = EXCLUDED.avatar_url,
          developer_verified = EXCLUDED.developer_verified`,
        [
          testUser.id,
          testUser.email,
          testUser.name,
          testUser.role,
          testUser.avatar_url,
          testUser.developer_verified,
          true, // email_verified
        ]
      );

      console.log(`Created test user: ${testUser.email}`);
    }
  } catch (error) {
    console.error('Error ensuring test user exists:', error);
  }
}

async function createSessionToken(user: typeof TEST_USERS[0]) {
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'dev-secret-key'
  );

  const sessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };

  return await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}
