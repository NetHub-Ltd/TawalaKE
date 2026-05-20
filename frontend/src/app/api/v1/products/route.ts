// route for products CRUD operations, we proxy this to the backend API route
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // get busines id from query params
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");
    if (!business_id) {
      return NextResponse.json({ error: "Business ID not provided" }, { status: 400 });
    }
  const res = await fetch(`${API_BASE}/products/multi/${business_id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message }, { status: res.status });
  }
  return NextResponse.json(data.data, { status: res.status });
}

// const Mock_product_json = {
//   business_id: "3cc882d4-2f71-4f65-a2c5-79e29e1dc3ee",
//   name: "Printing Canvas",
//   price: 120,
//   stock: 100,
//   attributes: {
//     unit_of_measure: "Meter",
//     category: "Printing",
//     unit_price: 100,
//   },
// };

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

  console.log("Creating a product with body:", body); // Debug log
  const res = await fetch(`${API_BASE}/products/register`, {
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
  return NextResponse.json(data.data, { status: res.status });
}

// patch a product
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  console.log("Update request body:", body); // Debug log
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
  console.log("Delete request body:", body.product_id); // Debug log
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
