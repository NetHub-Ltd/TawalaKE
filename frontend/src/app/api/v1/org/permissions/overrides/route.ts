import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = backendUrl("/organizations/permissions/overrides");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(body?.detail || body || { error: "Failed" }, {
      status: res.status,
    });
  }
  return NextResponse.json(body.data ?? body, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await req.json();
  const url = backendUrl("/organizations/permissions/overrides");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(body?.detail || body || { error: "Failed" }, {
      status: res.status,
    });
  }
  return NextResponse.json(body.data ?? body, { status: 200 });
}
