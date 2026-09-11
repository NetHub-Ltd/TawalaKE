/**
 * Proxy: GET POS config (tax_rate + enabled payment methods)
 * → FastAPI GET /api/v1/business/{business_id}/pos-config
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

type Ctx = { params: Promise<{ businessId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = await ctx.params;
  try {
    const res = await fetch(backendUrl(`/business/${businessId}/pos-config`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        (typeof body?.detail === "string" && body.detail) ||
        (typeof body?.error === "string" && body.error) ||
        "Failed to load POS config";
      return NextResponse.json({ error: detail, detail }, { status: res.status });
    }
    const data = body.data ?? body;
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[pos-config proxy]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
