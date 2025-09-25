import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock database for feedback (same as in the main feedback route)
let feedbackDatabase = [
  {
    id: '1',
    appId: 'app1',
    appName: 'Super App Pro',
    userId: 'user1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    rating: 4,
    content: 'Great app overall, but I would love to see more integrations with other productivity tools.',
    category: 'feature_request',
    status: 'open',
    createdAt: '2025-03-01T10:30:00Z',
    updatedAt: '2025-03-01T10:30:00Z',
    developerResponse: null
  },
  {
    id: '2',
    appId: 'app1',
    appName: 'Super App Pro',
    userId: 'user2',
    userName: 'Sarah Miller',
    userEmail: 'sarah@example.com',
    rating: 3,
    content: 'The app crashes sometimes when I try to export large files. Please fix this issue.',
    category: 'bug',
    status: 'in_progress',
    createdAt: '2025-02-28T15:45:00Z',
    updatedAt: '2025-03-02T09:15:00Z',
    developerResponse: 'We are currently investigating this issue and will have a fix in the next update.'
  },
  {
    id: '3',
    appId: 'app2',
    appName: 'Budget Master',
    userId: 'user3',
    userName: 'Mike Johnson',
    userEmail: 'mike@example.com',
    rating: 5,
    content: 'Absolutely love this app! It has helped me manage my finances so much better. One suggestion: add a dark mode option.',
    category: 'feature_request',
    status: 'open',
    createdAt: '2025-03-02T14:20:00Z',
    updatedAt: '2025-03-02T14:20:00Z',
    developerResponse: null
  },
  {
    id: '4',
    appId: 'app1',
    appName: 'Super App Pro',
    userId: 'user4',
    userName: 'Emily Chen',
    userEmail: 'emily@example.com',
    rating: 2,
    content: 'The latest update broke the calendar sync feature. Very frustrating as I rely on this for my daily planning.',
    category: 'bug',
    status: 'open',
    createdAt: '2025-03-03T08:10:00Z',
    updatedAt: '2025-03-03T08:10:00Z',
    developerResponse: null
  },
  {
    id: '5',
    appId: 'app3',
    appName: 'Fitness Tracker',
    userId: 'user5',
    userName: 'David Wilson',
    userEmail: 'david@example.com',
    rating: 4,
    content: 'Great app for tracking workouts. Would be even better if it could connect with my smartwatch.',
    category: 'feature_request',
    status: 'planned',
    createdAt: '2025-02-25T16:30:00Z',
    updatedAt: '2025-03-01T11:45:00Z',
    developerResponse: 'Thanks for the suggestion! We are planning to add smartwatch integration in our Q2 update.'
  },
  {
    id: '6',
    appId: 'app2',
    appName: 'Budget Master',
    userId: 'user6',
    userName: 'Lisa Brown',
    userEmail: 'lisa@example.com',
    rating: 1,
    content: 'The app keeps logging me out every few minutes. This is extremely annoying and makes the app unusable.',
    category: 'bug',
    status: 'resolved',
    createdAt: '2025-02-20T09:25:00Z',
    updatedAt: '2025-03-04T14:30:00Z',
    developerResponse: 'This issue has been resolved in version 2.3.1. Please update your app to the latest version.'
  },
  {
    id: '7',
    appId: 'app1',
    appName: 'Super App Pro',
    userId: 'user7',
    userName: 'Robert Taylor',
    userEmail: 'robert@example.com',
    rating: 5,
    content: 'The collaboration features are fantastic! I can now work seamlessly with my team. Thank you for this amazing tool.',
    category: 'praise',
    status: 'closed',
    createdAt: '2025-03-01T13:15:00Z',
    updatedAt: '2025-03-02T10:20:00Z',
    developerResponse: 'Thank you for your kind words! We\'re glad the collaboration features are working well for your team.'
  },
  {
    id: '8',
    appId: 'app3',
    appName: 'Fitness Tracker',
    userId: 'user8',
    userName: 'Jennifer Adams',
    userEmail: 'jennifer@example.com',
    rating: 3,
    content: 'The nutrition tracking is not very accurate. It would be helpful if you could improve the food database.',
    category: 'improvement',
    status: 'in_progress',
    createdAt: '2025-02-28T11:05:00Z',
    updatedAt: '2025-03-03T15:40:00Z',
    developerResponse: 'We\'re currently expanding our food database and improving the nutrition tracking algorithms. These improvements will be available in the next update.'
  }
];

// GET /api/feedback/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Find the feedback item
    const feedbackItem = feedbackDatabase.find(item => item.id === id);
    
    if (!feedbackItem) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    
    // In a real application, you would check if the user is a developer
    // and if they own the app associated with the feedback
    
    // Return the feedback item
    return NextResponse.json({ feedback: feedbackItem });
    
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

// DELETE /api/feedback/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Find the feedback item
    const feedbackIndex = feedbackDatabase.findIndex(item => item.id === id);
    
    if (feedbackIndex === -1) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    
    // In a real application, you would check if the user is a developer
    // and if they own the app associated with the feedback
    
    // Remove the feedback item from the database
    const deletedFeedback = feedbackDatabase[feedbackIndex];
    feedbackDatabase.splice(feedbackIndex, 1);
    
    // Return success message
    return NextResponse.json({ 
      message: 'Feedback deleted successfully',
      deletedFeedback
    });
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
