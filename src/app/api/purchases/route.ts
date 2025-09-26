import { NextRequest, NextResponse } from 'next/server';
import { processPurchase, getUserPurchases, getDeveloperSales } from '@/lib/services/payloadService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

// GET /api/purchases - Get purchases for a user or sales for a developer
export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const tester = searchParams.get('tester');
    const developer = searchParams.get('developer');
    
    // If tester parameter is provided, get purchases for that tester
    if (tester) {
      // Only allow users to view their own purchases or admins to view any
      if (tester !== session.user?.id && session.user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to view these purchases' },
          { status: 403 }
        );
      }
      
      const purchases = await getUserPurchases(tester);
      return NextResponse.json(purchases);
    }
    
    // If developer parameter is provided, get sales for that developer
    if (developer) {
      // Only allow developers to view their own sales or admins to view any
      if (developer !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to view these sales' },
          { status: 403 }
        );
      }
      
      const sales = await getDeveloperSales(developer);
      return NextResponse.json(sales);
    }
    
    // If no parameters are provided, return based on user role
    if (session.user.role === 'tester') {
      const purchases = await getUserPurchases(session.user.id);
      return NextResponse.json(purchases);
    } else if (session.user.role === 'developer') {
      const sales = await getDeveloperSales(session.user.id);
      return NextResponse.json(sales);
    } else if (session.user.role === 'admin') {
      // For admins, return all purchases
      const payload = await getPayloadClient();
      const allPurchases = await payload.find({
        collection: 'purchases',
        depth: 2,
      });
      return NextResponse.json(allPurchases);
    }
    
    return NextResponse.json({ docs: [] });
  } catch (error: any) {
    console.error('Error in GET /api/purchases:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Process a new purchase
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated and is a tester
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'tester' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only testers can make purchases' },
        { status: 403 }
      );
    }
    
    // Get request body
    const data = await req.json();
    const { appId } = data;
    
    if (!appId) {
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      );
    }
    
    // Process the purchase
    const purchase = await processPurchase(appId, session.user.id);
    return NextResponse.json(purchase);
  } catch (error: any) {
    console.error('Error in POST /api/purchases:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

// Import at the top of the file
import { getPayloadClient } from '@/lib/payload/payload';
