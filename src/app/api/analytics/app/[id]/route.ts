import { NextRequest, NextResponse } from 'next/server';
import { getAppAnalytics } from '@/lib/services/analytics-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET handler to retrieve app-specific analytics data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const appId = params.id;
    
    // Use the test developer ID in development mode, otherwise use the session user email as identifier
    const userId = process.env.NODE_ENV === 'development' 
      ? 'dev_12345'  // This matches the ID used in our seed script
      : (session.user as any).email || 'unknown_user';
    
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30days';
    
    const analyticsData = await getAppAnalytics(appId, userId, timeframe);
    
    return NextResponse.json({ data: analyticsData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching app analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
