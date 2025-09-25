import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload/payload';
import { headers } from 'next/headers';

// This route is used to initialize Payload CMS and handle all Payload requests
export async function GET(req: NextRequest) {
  const payload = await getPayloadClient();
  
  // Extract path from the original request URL
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';

  // Pass the request to Payload's local API
  const payloadResponse = await payload.request({
    url: path,
    method: 'get',
    headers: Object.fromEntries(headers()),
  });

  return NextResponse.json(payloadResponse);
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();

  // Extract path from the original request URL
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';

  // Get the request body
  const body = await req.json();

  // Pass the request to Payload's local API
  const payloadResponse = await payload.request({
    url: path,
    method: 'post',
    headers: Object.fromEntries(headers()),
    body,
  });

  return NextResponse.json(payloadResponse);
}

export async function PUT(req: NextRequest) {
  const payload = await getPayloadClient();

  // Extract path from the original request URL
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';

  // Get the request body
  const body = await req.json();

  // Pass the request to Payload's local API
  const payloadResponse = await payload.request({
    url: path,
    method: 'put',
    headers: Object.fromEntries(headers()),
    body,
  });

  return NextResponse.json(payloadResponse);
}

export async function DELETE(req: NextRequest) {
  const payload = await getPayloadClient();

  // Extract path from the original request URL
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';

  // Pass the request to Payload's local API
  const payloadResponse = await payload.request({
    url: path,
    method: 'delete',
    headers: Object.fromEntries(headers()),
  });

  return NextResponse.json(payloadResponse);
}

// Use the new route segment config format
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
