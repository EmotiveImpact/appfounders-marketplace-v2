import { NextRequest, NextResponse } from 'next/server';
import { getApps, createApp } from '@/lib/services/payloadService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { getPayloadClient } from '@/lib/payload/payload';

// GET /api/apps - Get all apps or filter by developer
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const developer = searchParams.get('developer');
    const developerEmail = searchParams.get('developerEmail');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    
    // Build filters for Payload query
    const filters: any = {
      limit,
      page,
      sort: '-createdAt', // Sort by newest first
    };
    
    if (developer) {
      filters.where = {
        ...(filters.where || {}),
        developer: {
          equals: developer,
        },
      };
    }
    
    if (developerEmail) {
      filters.where = {
        ...(filters.where || {}),
        developerEmail: {
          equals: developerEmail,
        },
      };
    }
    
    if (category) {
      filters.where = {
        ...(filters.where || {}),
        category: {
          equals: category,
        },
      };
    }
    
    if (status) {
      filters.where = {
        ...(filters.where || {}),
        status: {
          equals: status,
        },
      };
    }
    
    if (search) {
      filters.where = {
        ...(filters.where || {}),
        or: [
          {
            name: {
              contains: search,
            },
          },
          {
            description: {
              contains: search,
            },
          },
        ],
      };
    }
    
    const apps = await getApps(filters);
    return NextResponse.json(apps);
  } catch (error: any) {
    console.error('Error in GET /api/apps:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

// POST /api/apps - Create a new app
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated and is a developer
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check user role (with type safety)
    const userRole = (session.user as any).role;
    if (userRole !== 'developer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only developers can create apps' },
        { status: 403 }
      );
    }
    
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with file uploads
      const formData = await req.formData();
      
      // Process form data
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const shortDescription = formData.get('shortDescription') as string;
      const price = formData.get('price') as string;
      const category = formData.get('category') as string;
      const status = formData.get('status') as string || 'draft';
      
      // Validate required fields
      if (!name || !description || !price || !category) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Get Payload client for file uploads
      const payload = await getPayloadClient();
      
      // Upload app icon
      const image = formData.get('image') as File;
      let imageId = null;
      
      if (image) {
        const uploadedImage = await payload.upload({
          collection: 'media',
          file: image,
          data: {
            alt: `${name} icon`,
          },
        });
        imageId = uploadedImage.id;
      }
      
      // Upload screenshots
      const screenshotIds = [];
      for (let i = 0; formData.get(`screenshots.${i}`); i++) {
        const screenshot = formData.get(`screenshots.${i}`) as File;
        const uploadedScreenshot = await payload.upload({
          collection: 'media',
          file: screenshot,
          data: {
            alt: `${name} screenshot ${i + 1}`,
          },
        });
        screenshotIds.push(uploadedScreenshot.id);
      }
      
      // Upload resources
      const resourceIds = [];
      for (let i = 0; formData.get(`resources.${i}`); i++) {
        const resource = formData.get(`resources.${i}`) as File;
        const uploadedResource = await payload.upload({
          collection: 'media',
          file: resource,
          data: {
            alt: `${name} resource ${i + 1}`,
          },
        });
        resourceIds.push(uploadedResource.id);
      }
      
      // Create the app
      const appData = {
        name,
        description,
        shortDescription,
        price,
        category,
        status,
        developer: (session.user as any).id || null,
        developerEmail: session.user.email || null,
        image: imageId,
        screenshots: screenshotIds,
        resources: resourceIds,
        purchaseCount: 0,
      };
      
      const app = await createApp(appData);
      return NextResponse.json(app);
    } else {
      // Handle JSON data
      const data = await req.json();
      
      // Ensure the developer field is set to the current user
      data.developer = (session.user as any).id || null;
      data.developerEmail = session.user.email || null;
      
      // Set initial values
      data.status = data.status || 'draft';
      data.purchaseCount = 0;
      
      const app = await createApp(data);
      return NextResponse.json(app);
    }
  } catch (error: any) {
    console.error('Error in POST /api/apps:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create app' },
      { status: 500 }
    );
  }
}
