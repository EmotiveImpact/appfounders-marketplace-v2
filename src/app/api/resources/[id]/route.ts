import { NextRequest, NextResponse } from 'next/server';

// Mock data for resources (same as in the main route file)
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

// Helper function to find a resource by ID
const findResourceById = (id: string) => {
  return mockResources.find(resource => resource.id === id);
};

// GET handler to retrieve a specific resource by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const resource = findResourceById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ resource }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching resource with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PATCH handler to update a resource
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const resource = findResourceById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Update the resource fields
    // In a real application, you would update the resource in the database
    const updatedResource = {
      ...resource,
      name: body.name || resource.name,
      description: body.description !== undefined ? body.description : resource.description,
      type: body.type || resource.type,
      mimeType: body.mimeType || resource.mimeType,
      size: body.size || resource.size,
      url: body.url || resource.url,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ resource: updatedResource }, { status: 200 });
  } catch (error) {
    console.error(`Error updating resource with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const resource = findResourceById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    // In a real application, you would delete the resource from the database
    // For now, we'll just return a success message
    
    return NextResponse.json(
      { message: 'Resource deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting resource with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
