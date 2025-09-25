import { NextRequest } from 'next/server';
import { getPayloadClient } from '@/lib/payload/payload';

// This route serves the Payload CMS admin panel
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayloadClient();
    
    // Pass the request to Payload's admin panel
    const res = await payload.admin({
      req: req as any,
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error serving Payload admin:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load Payload admin panel', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle all other HTTP methods by passing them to Payload
export async function POST(req: NextRequest) {
  return handlePayloadRequest(req, 'post');
}

export async function PUT(req: NextRequest) {
  return handlePayloadRequest(req, 'put');
}

export async function PATCH(req: NextRequest) {
  return handlePayloadRequest(req, 'patch');
}

export async function DELETE(req: NextRequest) {
  return handlePayloadRequest(req, 'delete');
}

// Helper function to handle all request methods
async function handlePayloadRequest(req: NextRequest, method: 'post' | 'put' | 'patch' | 'delete') {
  try {
    const payload = await getPayloadClient();
    let body = {};
    
    if (['post', 'put', 'patch'].includes(method)) {
      body = await req.json();
    }
    
    const res = await payload.request({
      path: '/admin',
      method,
      body,
      headers: Object.fromEntries(req.headers),
    });
    
    return new Response(JSON.stringify(res), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error handling ${method.toUpperCase()} request:`, error);
    return new Response(
      JSON.stringify({ 
        error: `Failed to process ${method.toUpperCase()} request`, 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Use the new route segment config format
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
