/**
 * Proxy: GET list / POST create → FastAPI /api/v1/customers
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  const url = new URL(`/api/v1/customers/${businessId}`, backendBase);
  for (const key of ["q", "has_open_credit", "skip", "limit"]) {
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
    console.error("[customers proxy GET]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  const payload = await req.json().catch(() => null);
  if (!payload?.business_id || !payload?.name) {
    return NextResponse.json(
      { error: "business_id and name are required" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(`${backendBase}/api/v1/customers`, {
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
    console.error("[customers proxy POST]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
