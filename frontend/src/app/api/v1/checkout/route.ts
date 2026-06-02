import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
    // this post cart items to the backend for processing
  const session = await auth();
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

// retrive the body
    const body = await request.json();  
    if(!body) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

  const res = await fetch(`${API_BASE}/terminal/checkout`, {
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