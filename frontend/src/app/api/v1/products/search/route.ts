// Parent File Import: app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const searchQuery = searchParams.get('search_query')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
    
    // Calculate SQL skip offset
    const skip = (page - 1) * limit;

    // Optional multi-tenant filters
    const businessId = searchParams.get('business_id');
    const tenantId = searchParams.get('tenant_id');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    if (!searchQuery) {
      return NextResponse.json(
        { status: false, message: 'Search query parameter cannot be empty' },
        { status: 400 }
      );
    }

    // Build FastAPI target URL
    const targetParams = new URLSearchParams({
      search_query: searchQuery,
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (businessId) targetParams.append('business_id', businessId);
    if (tenantId) targetParams.append('tenant_id', tenantId);
    if (category) targetParams.append('category', category);
    if (active !== null && active !== undefined) targetParams.append('active', active);

    // Forward request to FastAPI backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/products/search?${targetParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization header if present
          ...(request.headers.get('authorization') && {
            Authorization: request.headers.get('authorization')!,
          }),
        },
        cache: 'no-store',
      }
    );

    const data = await backendResponse.json();
    console.log('Backend search response:', data.data);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { status: false, message: data.detail || 'Backend search request failed' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { status: false, message: 'Internal Gateway Error' },
      { status: 500 }
    );
  }
}