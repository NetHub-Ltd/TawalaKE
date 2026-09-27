import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Sign in required" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const sale_id = searchParams.get("sale_id");

  if (!sale_id) {
    return NextResponse.json({ error: "Sale ID not provided" }, { status: 400 });
  }

  const base = process.env.BACKEND_URL?.replace(/\/$/, "") || "";
  const res = await fetch(`${base}/business/receipts/${sale_id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text || res.statusText };
  }

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  return NextResponse.json(body, { status: 200 });
}
