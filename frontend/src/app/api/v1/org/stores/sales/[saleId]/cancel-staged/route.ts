/**
 * Proxy: POST cancel staged sale (never finalized — no stock change)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

type Ctx = { params: Promise<{ saleId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { saleId } = await ctx.params;
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  try {
    const url = new URL(backendUrl(`/business/sales/${saleId}/cancel-staged`));
    url.searchParams.set("business_id", businessId);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[cancel-staged proxy]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
