import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute, USER_ROLES } from '@/lib/auth/route-protection';
import { 
  getUserProfile, 
  updateUserProfile, 
  UpdateProfileData 
} from '@/lib/user/profile-management';

// GET /api/user/profile - Get current user's profile
export const GET = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        profile,
      });
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to get profile' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER, // All authenticated users
  }
);

// PUT /api/user/profile - Update current user's profile
export const PUT = createProtectedRoute(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json();
      const { name, bio, company, website, location, avatar_url } = body;

      // Validate input
      const updateData: UpdateProfileData = {};
      
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return NextResponse.json(
            { error: 'Name must be a non-empty string' },
            { status: 400 }
          );
        }
        updateData.name = name.trim();
      }

      if (bio !== undefined) {
        if (typeof bio !== 'string') {
          return NextResponse.json(
            { error: 'Bio must be a string' },
            { status: 400 }
          );
        }
        updateData.bio = bio.trim();
      }

      if (company !== undefined) {
        if (typeof company !== 'string') {
          return NextResponse.json(
            { error: 'Company must be a string' },
            { status: 400 }
          );
        }
        updateData.company = company.trim();
      }

      if (website !== undefined) {
        if (typeof website !== 'string') {
          return NextResponse.json(
            { error: 'Website must be a string' },
            { status: 400 }
          );
        }
        // Basic URL validation
        if (website.trim() && !isValidUrl(website.trim())) {
          return NextResponse.json(
            { error: 'Website must be a valid URL' },
            { status: 400 }
          );
        }
        updateData.website = website.trim();
      }

      if (location !== undefined) {
        if (typeof location !== 'string') {
          return NextResponse.json(
            { error: 'Location must be a string' },
            { status: 400 }
          );
        }
        updateData.location = location.trim();
      }

      if (avatar_url !== undefined) {
        if (typeof avatar_url !== 'string') {
          return NextResponse.json(
            { error: 'Avatar URL must be a string' },
            { status: 400 }
          );
        }
        // Basic URL validation for avatar
        if (avatar_url.trim() && !isValidUrl(avatar_url.trim())) {
          return NextResponse.json(
            { error: 'Avatar URL must be a valid URL' },
            { status: 400 }
          );
        }
        updateData.avatar_url = avatar_url.trim();
      }

      // Update profile
      const updatedProfile = await updateUserProfile(user.id, updateData);

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: 500 }
      );
    }
  },
  {
    requiredRole: USER_ROLES.TESTER,
  }
);

/**
 * Basic URL validation
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
