import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getPayloadClient } from '@/lib/payload/payload';
import { authOptions } from '@/lib/auth/auth-options';

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
    
    const payload = await getPayloadClient({});
    
    // If a specific bug ID is requested
    if (path && path.startsWith('/api/bugs/')) {
      const bugId = path.split('/').pop();
      
      if (!bugId) {
        return NextResponse.json({ error: 'Invalid bug ID' }, { status: 400 });
      }
      
      // Check if user has access to this specific bug
      const bug = await payload.findByID({
        collection: 'bugs',
        id: bugId,
      });
      
      return NextResponse.json(bug);
    }
    
    // Otherwise, return a list of bugs
    const bugs = await payload.find({
      collection: 'bugs',
      where: query,
      sort: '-createdAt',
    });
    
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
    
    const payload = await getPayloadClient({});
    const body = await request.json();
    
    // Ensure the reportedBy field is set to the current user
    body.reportedBy = (session.user as any).id;
    
    // Create the bug report
    const bug = await payload.create({
      collection: 'bugs',
      data: body,
    });
    
    return NextResponse.json(bug);
  } catch (error: any) {
    console.error('Error creating bug report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
