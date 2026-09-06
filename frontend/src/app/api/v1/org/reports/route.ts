/**
 * Proxies reporting endpoints to FastAPI /api/v1/reports/{businessId}/{resource}
 *
 * Query:
 * - businessId (required)
 * - resource: dashboard | hourly | products | staff | insights (default dashboard)
 * - period: today | yesterday | 3d | 7d | custom (default today)
 * - date: YYYY-MM-DD (required when period=custom)
 * - limit, order_by (optional)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_PERIODS = new Set(["today", "yesterday", "3d", "7d", "custom", "month"]);
const ALLOWED_RESOURCES = new Set([
  "dashboard",
  "hourly",
  "products",
  "staff",
  "insights",
]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = req.nextUrl.searchParams.get("businessId");
  const resource = req.nextUrl.searchParams.get("resource") ?? "dashboard";
  const periodParam = req.nextUrl.searchParams.get("period") ?? "today";
  const period = ALLOWED_PERIODS.has(periodParam) ? periodParam : "today";
  const date = req.nextUrl.searchParams.get("date");
  const limit = req.nextUrl.searchParams.get("limit");
  const orderBy = req.nextUrl.searchParams.get("order_by");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  if (!ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }
  if (period === "custom" && !date) {
    return NextResponse.json(
      { error: "date is required when period=custom" },
      { status: 400 }
    );
  }

  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json(
      { error: "BACKEND_URL is not configured" },
      { status: 500 }
    );
  }

  const url = new URL(`/api/v1/reports/${businessId}/${resource}`, backendBase);
  url.searchParams.set("period", period);
  if (date) url.searchParams.set("date", date);
  if (limit) url.searchParams.set("limit", limit);
  if (orderBy) url.searchParams.set("order_by", orderBy);

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
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            body.detail || body.message || body.error || "Failed to load report",
        },
        { status: res.status }
      );
    }
    return NextResponse.json(body);
  } catch (err) {
    console.error("[reports proxy]", err);
    return NextResponse.json(
      { error: "Reporting service unavailable" },
      { status: 502 }
    );
  }
}
