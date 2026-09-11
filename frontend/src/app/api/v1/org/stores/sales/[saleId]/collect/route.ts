/**
 * Proxy: POST collect payment on a credit sale
 * → FastAPI POST /api/v1/business/sales/{sale_id}/collect
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
  const payload = await req.json().catch(() => ({}));
  try {
    const res = await fetch(backendUrl(`/business/sales/${saleId}/collect`), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        sale_id: saleId,
        payment_method: payload.payment_method,
        payment_reference: payload.payment_reference ?? null,
        customer_name: payload.customer_name ?? null,
        customer_phone: payload.customer_phone ?? null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    console.error("[sales collect proxy]", err);
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }
}
