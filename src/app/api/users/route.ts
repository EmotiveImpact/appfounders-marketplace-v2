import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

// Custom session type with extended user properties
interface CustomSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
  }
}

// GET /api/users - Get current user profile
export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Get user profile
    const user = await payload.findByID({
      collection: 'users',
      id: session.user.id,
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users - Update current user profile
export async function PATCH(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // Prevent changing role through this endpoint
    if (data.role) {
      delete data.role;
    }
    
    // Prevent changing email through this endpoint (should be handled by auth provider)
    if (data.email) {
      delete data.email;
    }
    
    
    // Update user profile
    const updatedUser = await payload.update({
      collection: 'users',
      id: session.user.id,
      data,
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error in PATCH /api/users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

// POST /api/users/avatar - Upload user avatar
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected multipart/form-data' },
        { status: 400 }
      );
    }
    
    // Handle form data with file upload
    const formData = await req.formData();
    
    // Handle avatar upload
    const avatar = formData.get('avatar') as File;
    if (!avatar) {
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 }
      );
    }
    
    const avatarBuffer = Buffer.from(await avatar.arrayBuffer());
    const uploadedAvatar = await payload.upload({
      collection: 'media',
      data: {
        alt: `${session.user.name || 'User'} avatar`,
      },
      file: {
        buffer: avatarBuffer,
        filename: avatar.name,
        mimetype: avatar.type,
        size: avatar.size,
      },
    });
    
    // Update user with new avatar
    const updatedUser = await payload.update({
      collection: 'users',
      id: session.user.id,
      data: {
        avatar: uploadedAvatar.id,
      },
    });
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error in POST /api/users/avatar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
