// import { NextResponse, NextRequest } from "next/server";
// import { auth } from "@/auth";

// const API_BASE = process.env.BACKEND_URL;

// export async function GET(request: NextRequest) {
//   const session = await auth();
//   if (!session || !session.accessToken) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // 1. Extract and validate primary lookup parameters
//   const { searchParams } = new URL(request.url);
//   const business_id = searchParams.get("business_id");
//   const product_id = searchParams.get("product_id");

//   if (!business_id) {
//     return NextResponse.json({ error: "Business ID not provided" }, { status: 400 });
//   }

//   console.debug("Processing request for business:", business_id);

//   // 2. Build target URL with pagination support
//   let targetUrl: string;

//   if (product_id) {
//     // Single product retrieval requires no pagination matrix
//     targetUrl = `${API_BASE}/products/${product_id}`;
//   } else {
//     // Multi-product retrieval requires pagination forwarders
//     const skip = searchParams.get("skip") || "0";
//     const limit = searchParams.get("limit") || "50";
    
//     // Appends parameters exactly matching the FastAPI parameter expectations
//     targetUrl = `${API_BASE}/products/multi/${business_id}?skip=${skip}&limit=${limit}`;
//   }

//   try {
//     const res = await fetch(targetUrl, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${session.accessToken}`,
//       },
//     });

//     const data = await res.json();
    
//     if (!data.status) {
//       return NextResponse.json({ error: data.message }, { status: res.status });
//     }

//     console.debug(`Successfully proxied products matrix for business: ${business_id}`);
    
//     // Return data payload matching the ApiResponse structure expected by the client component
//     return NextResponse.json(data.data, { status: res.status });
//   } catch (error) {
//     console.error("Proxy layer network failure:", error);
//     return NextResponse.json(
//       { error: "Internal Gateway Communication Failure" },
//       { status: 502 }
//     );
//   }
// }


import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Extract and validate parameters matching our updated API framework
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");
  const product_id = searchParams.get("product_id");

  if (!business_id) {
    return NextResponse.json({ error: "Business ID not provided" }, { status: 400 });
  }

  console.debug("Processing request for business:", business_id);

  // 2. Build target URL with pagination and dynamic sorting matrices
  let targetUrl: string;

  if (product_id) {
    // Single product retrieval bypasses pagination structures
    targetUrl = `${API_BASE}/products/${product_id}`;
  } else {
    // Extract frontend parameters with correct fallbacks matching backend schemas
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "50";
    const sort_by = searchParams.get("sort_by") || "";
    const sort_order = searchParams.get("sort_order") || "desc";
    
    // Construct search params to feed the backend router
    const queryParams = new URLSearchParams({
      page,
      limit,
      sort_order
    });
    
    if (sort_by) {
      queryParams.append("sort_by", sort_by);
    }
    
    targetUrl = `${API_BASE}/products/multi/${business_id}?${queryParams.toString()}`;
  }

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await res.json();
    
    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: res.status });
    }

    console.debug(`Successfully proxied records envelope for business: ${business_id}`);
    
    // Return the complete payload structure including data items and pagination metadata
    return NextResponse.json(
      {
        data: data.data,
        pagination: data.pagination
      }, 
      { status: res.status }
    );
  } catch (error) {
    console.error("Proxy layer network failure:", error);
    return NextResponse.json(
      { error: "Internal Gateway Communication Failure" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  // console.log("Creating a product with body:", body); // Debug log
  console.debug("Product Creation Data", body)
  const res = await fetch(`${API_BASE}/products/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message }, { status: res.status });
  }
  console.debug("Product Created:", data.data) // Debug log
  return NextResponse.json(data.data, { status: res.status });
}

// patch a product
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const res = await fetch(`${API_BASE}/products/${body.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message }, { status: res.status });
  }

  return NextResponse.json(data.data, { status: res.status });
}

// delete a product
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  console.debug("Delete request body:", body.product_id); // Debug log
  if (!body || !body.product_id) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const res = await fetch(`${API_BASE}/products/${body.product_id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: null, // DELETE typically doesn't have a body, but if your backend expects it, you can include it
  });
  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json({ error: errorData.message || "Failed to delete product" }, { status: res.status });
  }
  return NextResponse.json(
    { message: "Product deleted successfully" },
    { status: 200 },
  );
}
