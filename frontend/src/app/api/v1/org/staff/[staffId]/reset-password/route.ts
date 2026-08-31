import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
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
  const upstream = `${base}/staff/${staffId}/reset-password`;
  const payload = await req.json();
  const res = await fetch(upstream, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "Backend reset password failed", upstream, upstream_status: res.status, upstream_body: body },
      { status: res.status },
    );
  }
  return NextResponse.json(body.data ?? body, { status: 200 });
}
