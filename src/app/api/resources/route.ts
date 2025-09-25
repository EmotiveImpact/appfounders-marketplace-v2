import { NextRequest, NextResponse } from 'next/server';

// Mock data for resources
const mockResources = [
  {
    id: '1',
    appId: 'app1',
    name: 'User Manual.pdf',
    description: 'Comprehensive user guide for Super App Pro',
    type: 'document',
    mimeType: 'application/pdf',
    size: 2450000,
    url: '/resources/user-manual.pdf',
    createdAt: '2025-02-10T14:30:00Z',
    updatedAt: '2025-02-10T14:30:00Z'
  },
  {
    id: '2',
    appId: 'app1',
    name: 'App Screenshot 1.png',
    description: 'Main dashboard screenshot',
    type: 'image',
    mimeType: 'image/png',
    size: 1250000,
    url: '/resources/screenshot1.png',
    createdAt: '2025-02-12T10:15:00Z',
    updatedAt: '2025-02-12T10:15:00Z'
  },
  {
    id: '3',
    appId: 'app1',
    name: 'Tutorial Video.mp4',
    description: 'Getting started tutorial for new users',
    type: 'video',
    mimeType: 'video/mp4',
    size: 15800000,
    url: '/resources/tutorial.mp4',
    createdAt: '2025-02-15T16:45:00Z',
    updatedAt: '2025-02-15T16:45:00Z'
  },
  {
    id: '4',
    appId: 'app1',
    name: 'Sample Data.zip',
    description: 'Sample data files for testing',
    type: 'archive',
    mimeType: 'application/zip',
    size: 4500000,
    url: '/resources/sample-data.zip',
    createdAt: '2025-02-20T09:30:00Z',
    updatedAt: '2025-02-20T09:30:00Z'
  },
  {
    id: '5',
    appId: 'app1',
    name: 'API Documentation.pdf',
    description: 'Technical documentation for developers',
    type: 'document',
    mimeType: 'application/pdf',
    size: 3200000,
    url: '/resources/api-docs.pdf',
    createdAt: '2025-02-25T11:20:00Z',
    updatedAt: '2025-02-25T11:20:00Z'
  },
  {
    id: '6',
    appId: 'app2',
    name: 'User Guide.pdf',
    description: 'User guide for App 2',
    type: 'document',
    mimeType: 'application/pdf',
    size: 1850000,
    url: '/resources/app2-guide.pdf',
    createdAt: '2025-02-05T09:30:00Z',
    updatedAt: '2025-02-05T09:30:00Z'
  },
  {
    id: '7',
    appId: 'app2',
    name: 'Marketing Image.jpg',
    description: 'Marketing image for App 2',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 980000,
    url: '/resources/app2-marketing.jpg',
    createdAt: '2025-02-08T14:20:00Z',
    updatedAt: '2025-02-08T14:20:00Z'
  }
];

// GET handler to retrieve resources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const type = searchParams.get('type');
    const query = searchParams.get('query')?.toLowerCase();
    
    // Filter resources based on query parameters
    let filteredResources = [...mockResources];
    
    if (appId) {
      filteredResources = filteredResources.filter(resource => resource.appId === appId);
    }
    
    if (type && type !== 'all') {
      filteredResources = filteredResources.filter(resource => resource.type === type);
    }
    
    if (query) {
      filteredResources = filteredResources.filter(resource => 
        resource.name.toLowerCase().includes(query) || 
        resource.description.toLowerCase().includes(query)
      );
    }
    
    return NextResponse.json({ resources: filteredResources }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST handler to create a new resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.appId || !body.name || !body.type || !body.mimeType || !body.size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new resource
    const newResource = {
      id: `resource-${Date.now()}`,
      appId: body.appId,
      name: body.name,
      description: body.description || '',
      type: body.type,
      mimeType: body.mimeType,
      size: body.size,
      url: body.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In a real application, you would save this to a database
    // For now, we'll just return the new resource
    
    return NextResponse.json({ resource: newResource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
