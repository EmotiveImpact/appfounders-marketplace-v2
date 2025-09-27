import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    
    // Get query parameters
    const query: Record<string, any> = {};
    
    // Add filters based on user role
    if ((session.user as any).role === 'tester') {
      // Testers can only see bugs they reported
      query.reportedBy = (session.user as any).id;
    } else if ((session.user as any).role === 'developer') {
      // Developers can only see bugs for their apps
      query['app.developer'] = (session.user as any).id;
    }
    
    // Add any additional query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        query[key] = value;
      }
    });
    
    
    // If a specific bug ID is requested
    if (path && path.startsWith('/api/bugs/')) {
      const bugId = path.split('/').pop();
      
      if (!bugId) {
        return NextResponse.json({ error: 'Invalid bug ID' }, { status: 400 });
      }
      
      // Check if user has access to this specific bug
      const bugResult = await neonClient.query(
        'SELECT * FROM bugs WHERE id = $1',
        [bugId]
      );

      if (bugResult.length === 0) {
        return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
      }

      return NextResponse.json(bugResult[0]);
    }
    
    // Otherwise, return a list of bugs
    const bugs = await neonClient.query(
      'SELECT * FROM bugs ORDER BY created_at DESC'
    );
    
    return NextResponse.json(bugs);
  } catch (error: any) {
    console.error('Error fetching bugs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a tester
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if ((session.user as any).role !== 'tester' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Only testers and admins can report bugs' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Ensure the reportedBy field is set to the current user
    body.reportedBy = (session.user as any).id;
    
    // Create the bug report
    const bugResult = await neonClient.query(
      'INSERT INTO bugs (title, description, status, priority, reported_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [body.title, body.description, body.status || 'open', body.priority || 'medium', body.reportedBy]
    );

    const bug = bugResult[0];
    
    return NextResponse.json(bug);
  } catch (error: any) {
    console.error('Error creating bug report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
