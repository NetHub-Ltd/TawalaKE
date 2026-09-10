/**
 * Proxy: GET/PATCH/DELETE single customer
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type Ctx = { params: Promise<{ customerId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { customerId } = await ctx.params;
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  const url = `${backendBase}/api/v1/customers/${businessId}/${customerId}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[customers proxy GET one]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { customerId } = await ctx.params;
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  const payload = await req.json().catch(() => ({}));
  try {
    const res = await fetch(
      `${backendBase}/api/v1/customers/${businessId}/${customerId}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[customers proxy PATCH]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { customerId } = await ctx.params;
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(
      `${backendBase}/api/v1/customers/${businessId}/${customerId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[customers proxy DELETE]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
