import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackAnalytics } from '@/lib/services/analytics-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET handler to retrieve feedback analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use the test developer ID in development mode, otherwise use the session user email as identifier
    const userId = process.env.NODE_ENV === 'development' 
      ? 'dev_12345'  // This matches the ID used in our seed script
      : session.user.email || 'unknown_user';
    
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId') || undefined;
    const timeframe = searchParams.get('timeframe') || '30days';
    
    const feedbackData = await getFeedbackAnalytics(userId, appId, timeframe);
    
    return NextResponse.json({ data: feedbackData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching feedback analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics data' },
      { status: 500 }
    );
  }
}
