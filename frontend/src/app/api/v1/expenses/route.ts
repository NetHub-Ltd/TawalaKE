/**
 * Proxy expenses → FastAPI /api/v1/expenses
 * GET ?businessId=…  |  POST create body
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const url = new URL(backendUrl(`/expenses/${businessId}`));
  for (const key of ["start", "end", "category", "skip", "limit"]) {
    const v = req.nextUrl.searchParams.get(key);
    if (v) url.searchParams.set(key, v);
  }
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[expenses proxy GET]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await req.json().catch(() => null);
  if (!payload?.business_id || payload?.amount == null) {
    return NextResponse.json(
      { error: "business_id and amount are required" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(backendUrl(`/expenses`), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[expenses proxy POST]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
