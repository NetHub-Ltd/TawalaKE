import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ staffId: string }> },
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { staffId } = await ctx.params;
  const payload = await req.json();
  const res = await fetch(
    `${process.env.BACKEND_URL}/business/staff/${staffId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(body, { status: res.status });
  return NextResponse.json(body.data ?? body, { status: 200 });
}
