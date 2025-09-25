import { NextRequest, NextResponse } from 'next/server';
import { getAppById, updateApp, deleteApp } from '@/lib/services/payloadService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/apps/[id] - Get a single app by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // For development, return mock data
    const mockApp = {
      id: id,
      name: 'Super App Pro',
      description: 'A comprehensive productivity tool for professionals',
      shortDescription: 'Boost your productivity',
      price: 9.99,
      category: 'productivity',
      status: 'published',
      developer: 'dev1',
      image: null,
      screenshots: [],
      resources: [],
      purchaseCount: 120,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-03-01T14:30:00Z'
    };
    
    return NextResponse.json(mockApp);
    
    /* Uncomment this when connecting to real database
    const app = await getAppById(id);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(app);
    */
  } catch (error: any) {
    console.error(`Error in GET /api/apps/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch app' },
      { status: 500 }
    );
  }
}

// PUT /api/apps/[id] - Update an app
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the app to check ownership
    const app = await getAppById(id);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the developer of the app or an admin
    const isDeveloper = app.developer === (session.user as any).email;
    const isAdmin = (session.user as any).role === 'admin';
    
    if (!isDeveloper && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this app' },
        { status: 403 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // Prevent changing the developer
    delete data.developer;
    
    // Update the app
    const updatedApp = await updateApp(id, data);
    return NextResponse.json(updatedApp);
  } catch (error: any) {
    console.error(`Error in PUT /api/apps/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update app' },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/[id] - Delete an app
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the app to check ownership
    const app = await getAppById(id);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the developer of the app or an admin
    const isDeveloper = app.developer === (session.user as any).email;
    const isAdmin = (session.user as any).role === 'admin';
    
    if (!isDeveloper && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this app' },
        { status: 403 }
      );
    }
    
    // Delete the app
    await deleteApp(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in DELETE /api/apps/${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete app' },
      { status: 500 }
    );
  }
}
