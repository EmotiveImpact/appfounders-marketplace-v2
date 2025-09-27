import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { neonClient } from '@/lib/database/neon-client';

// GET /api/protected/developer/apps - Get developer's apps
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      
      // Get apps for the current developer
      const apps = await neonClient.query(
        'SELECT * FROM apps WHERE developer_id = $1' + (status ? ' AND status = $2' : ''),
        status ? [user.id, status] : [user.id]
      );

      return NextResponse.json({
        success: true,
        apps,
      });
    } catch (error) {
      console.error('Error fetching developer apps:', error);
      return NextResponse.json(
        { error: 'Failed to fetch apps' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
    resourceType: 'app',
    action: 'read',
  }
);

// POST /api/protected/developer/apps - Create new app
export const POST = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const {
        name,
        description,
        category,
        price,
        images,
        features,
        requirements,
      } = body;

      // Validate required fields
      if (!name || !description || !category || price === undefined) {
        return NextResponse.json(
          { error: 'Name, description, category, and price are required' },
          { status: 400 }
        );
      }

      // Create app
      const newApp = await db.createApp({
        name,
        description,
        category,
        price: parseFloat(price),
        developer_id: user.id,
        images: images || [],
        features: features || [],
        requirements: requirements || {},
        status: 'pending',
      });

      return NextResponse.json({
        success: true,
        app: newApp,
      });
    } catch (error: any) {
      console.error('Error creating app:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create app' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.DEVELOPER,
    resourceType: 'app',
    action: 'write',
  }
);
