// // Parent File Import: app/api/products/search/route.ts
// import { NextRequest, NextResponse } from 'next/server';

// const BACKEND_API_URL = process.env.BACKEND_URL;

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);

//     const searchQuery = searchParams.get('search_query')?.trim();
//     const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
//     const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
    
//     // Calculate SQL skip offset
//     const skip = (page - 1) * limit;

//     // Optional multi-tenant filters
//     const businessId = searchParams.get('business_id');
//     const tenantId = searchParams.get('tenant_id');
//     const category = searchParams.get('category');
//     const active = searchParams.get('active');

//     if (!searchQuery) {
//       return NextResponse.json(
//         { status: false, message: 'Search query parameter cannot be empty' },
//         { status: 400 }
//       );
//     }

//     // Build FastAPI target URL
//     const targetParams = new URLSearchParams({
//       search_query: searchQuery,
//       skip: skip.toString(),
//       limit: limit.toString(),
//     });

//     if (businessId) targetParams.append('business_id', businessId);
//     if (tenantId) targetParams.append('tenant_id', tenantId);
//     if (category) targetParams.append('category', category);
//     if (active !== null && active !== undefined) targetParams.append('active', active);

//     // Forward request to FastAPI backend
//     const backendResponse = await fetch(
//       `${BACKEND_API_URL}/products/search?${targetParams.toString()}`,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           // Forward authorization header if present
//           ...(request.headers.get('authorization') && {
//             Authorization: request.headers.get('authorization')!,
//           }),
//         },
//         cache: 'no-store',
//       }
//     );

//     const data = await backendResponse.json();
//     console.log('Backend search response:', data.data);

//     if (!backendResponse.ok) {
//       return NextResponse.json(
//         { status: false, message: data.detail || 'Backend search request failed' },
//         { status: backendResponse.status }
//       );
//     }

//     return NextResponse.json(data.data);
//   } catch (error) {
//     return NextResponse.json(
//       { status: false, message: 'Internal Gateway Error' },
//       { status: 500 }
//     );
//   }
// }

// Parent File Import: app/api/v1/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServerAccessToken } from "@/lib/auth/get-server-access-token";

const BACKEND_API_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const searchQuery = searchParams.get("search_query")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const businessId = searchParams.get("business_id");
    const tenantId = searchParams.get("tenant_id");
    const category = searchParams.get("category");
    const active = searchParams.get("active");

    if (!searchQuery) {
      return NextResponse.json(
        { status: false, message: "Search query parameter cannot be empty" },
        { status: 400 }
      );
    }

    const targetParams = new URLSearchParams({
      search_query: searchQuery,
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (businessId) targetParams.append("business_id", businessId);
    if (tenantId) targetParams.append("tenant_id", tenantId);
    if (category) targetParams.append("category", category);
    if (active !== null && active !== undefined) targetParams.append("active", active);

    const session = await auth();
    const accessToken =
      (await getServerAccessToken()) ?? session?.accessToken ?? null;
    if (!accessToken || session?.error) {
      return NextResponse.json(
        { status: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/products/search?${targetParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const rawData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { status: false, message: rawData.detail || "Backend search request failed" },
        { status: backendResponse.status }
      );
    }

    // Unify Fast API payload { records: [...], total: X } to standard PaginatedProxyResponse
    const searchPayload = rawData.data || rawData;
    const records = Array.isArray(searchPayload.records) ? searchPayload.records : [];
    const total = typeof searchPayload.total === "number" ? searchPayload.total : records.length;
    const pages = Math.ceil(total / limit) || 1;

    const normalizedResponse = {
      data: records,
      pagination: {
        total,
        page,
        size: limit,
        pages,
      },
    };

    return NextResponse.json(normalizedResponse);
  } catch {
    return NextResponse.json(
      { status: false, message: "Internal Gateway Error" },
      { status: 500 }
    );
  }
}