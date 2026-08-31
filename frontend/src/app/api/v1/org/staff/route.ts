import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/** List / create org staff via dedicated backend GET|POST /api/v1/staff. */
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: string;
  try {
    url = backendUrl("/staff");
  } catch (e) {
    const message = e instanceof Error ? e.message : "BACKEND_URL not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof body === "object" && body
        ? body
        : { error: res.statusText || "Staff list failed", upstream: url },
      { status: res.status },
    );
  }
  return NextResponse.json(body.data ?? body, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: string;
  try {
    url = backendUrl("/staff");
  } catch (e) {
    const message = e instanceof Error ? e.message : "BACKEND_URL not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const payload = await req.json();
  const res = await fetch(url, {
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
      typeof body === "object" && body
        ? body
        : { error: res.statusText || "Staff create failed", upstream: url },
      { status: res.status },
    );
  }
  return NextResponse.json(body.data ?? body, { status: res.status });
}
