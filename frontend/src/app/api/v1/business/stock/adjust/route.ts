import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  const body = await req.json();
  const res = await fetch(`${API_BASE}/business/stock-adjust`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message || data.detail || "Adjust failed" }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}
