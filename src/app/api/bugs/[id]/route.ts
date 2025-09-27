import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { neonClient } from '@/lib/database/neon-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    
    // Get the bug by ID
    const bugResult = await neonClient.query(
      'SELECT * FROM bugs WHERE id = $1',
      [params.id]
    );

    if (bugResult.length === 0) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const bug = bugResult[0];
    
    // Check if user has access to this bug
    if ((session.user as any).role !== 'admin') {
      if (
        (session.user as any).role === 'tester' && 
        bug.reportedBy !== (session.user as any).id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      if (
        (session.user as any).role === 'developer' && 
        bug.app?.developer !== (session.user as any).id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    return NextResponse.json(bug);
  } catch (error: any) {
    console.error('Error fetching bug:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Get the existing bug to check permissions
    const existingBugResult = await neonClient.query(
      'SELECT * FROM bugs WHERE id = $1',
      [params.id]
    );

    if (existingBugResult.length === 0) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const existingBug = existingBugResult[0];
    
    // Check if user has permission to update this bug
    if ((session.user as any).role !== 'admin') {
      if (
        (session.user as any).role === 'tester' && 
        existingBug.reportedBy !== (session.user as any).id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      if (
        (session.user as any).role === 'developer' && 
        existingBug.app?.developer !== (session.user as any).id
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Developers can only update status and assignedTo fields
      if ((session.user as any).role === 'developer') {
        const allowedFields = ['status', 'assignedTo', 'comments'];
        const updatedData: Record<string, any> = {};
        
        for (const field of allowedFields) {
          if (field in body) {
            updatedData[field] = body[field];
          }
        }
        
        // Use a new variable instead of reassigning body
        const filteredBody = updatedData;
        
        // Update bug with filtered data
        await neonClient.query(
          'UPDATE bugs SET title = $1, description = $2, status = $3, priority = $4, updated_at = NOW() WHERE id = $5',
          [filteredBody.title, filteredBody.description, filteredBody.status, filteredBody.priority, params.id]
        );

        const updatedBugResult = await neonClient.query(
          'SELECT * FROM bugs WHERE id = $1',
          [params.id]
        );
        const updatedBug = updatedBugResult[0];
        
        return NextResponse.json(updatedBug);
      }
    }
    
    // For admin or tester (original reporter), update with full body
    await neonClient.query(
      'UPDATE bugs SET title = $1, description = $2, status = $3, priority = $4, updated_at = NOW() WHERE id = $5',
      [body.title, body.description, body.status, body.priority, params.id]
    );

    const updatedBugResult = await neonClient.query(
      'SELECT * FROM bugs WHERE id = $1',
      [params.id]
    );
    const updatedBug = updatedBugResult[0];
    
    return NextResponse.json(updatedBug);
  } catch (error: any) {
    console.error('Error updating bug:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete bugs' }, { status: 403 });
    }
    
    
    // Delete the bug
    await neonClient.query(
      'DELETE FROM bugs WHERE id = $1',
      [params.id]
    );

    const deletedBug = { id: params.id, deleted: true };
    
    return NextResponse.json(deletedBug);
  } catch (error: any) {
    console.error('Error deleting bug:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
