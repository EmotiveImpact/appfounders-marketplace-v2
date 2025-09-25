import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getPayloadClient } from '@/lib/payload/payload';
import { authOptions } from '@/lib/auth/auth-options';

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
    
    const payload = await getPayloadClient({});
    
    // Get the bug by ID
    const bug = await payload.findByID({
      collection: 'bugs',
      id: params.id,
    });
    
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
    
    const payload = await getPayloadClient({});
    const body = await request.json();
    
    // Get the existing bug to check permissions
    const existingBug = await payload.findByID({
      collection: 'bugs',
      id: params.id,
    });
    
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
        const updatedBug = await payload.update({
          collection: 'bugs',
          id: params.id,
          data: filteredBody,
        });
        
        return NextResponse.json(updatedBug);
      }
    }
    
    // For admin or tester (original reporter), update with full body
    const updatedBug = await payload.update({
      collection: 'bugs',
      id: params.id,
      data: body,
    });
    
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
    
    const payload = await getPayloadClient({});
    
    // Delete the bug
    const deletedBug = await payload.delete({
      collection: 'bugs',
      id: params.id,
    });
    
    return NextResponse.json(deletedBug);
  } catch (error: any) {
    console.error('Error deleting bug:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
