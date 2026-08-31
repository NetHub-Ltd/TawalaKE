import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ staffId: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }
  const { staffId } = await ctx.params;
  const upstream = `${base}/staff/${staffId}/activity`;
  const res = await fetch(upstream, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "Backend staff activity failed", upstream, upstream_status: res.status, upstream_body: body },
      { status: res.status },
    );
  }
  return NextResponse.json(body.data ?? body, { status: 200 });
}
