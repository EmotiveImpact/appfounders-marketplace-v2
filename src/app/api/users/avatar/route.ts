import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { neonClient } from '@/lib/database/neon-client';

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

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as CustomSession | null;
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Process the form data
    const formData = await req.formData();
    const avatar = formData.get('avatar') as File;

    if (!avatar) {
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const fileType = avatar.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExtension = fileType.split('/')[1];
    
    // Generate unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    
    // Save file to disk
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await avatar.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Generate public URL
    const fileUrl = `/uploads/avatars/${fileName}`;
    
    // Update user in database with new avatar URL
    const updatedUserResult = await neonClient.query(
      'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [fileUrl, userId]
    );
    const updatedUser = updatedUserResult[0];

    return NextResponse.json({ 
      success: true,
      avatar: fileUrl
    });
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
