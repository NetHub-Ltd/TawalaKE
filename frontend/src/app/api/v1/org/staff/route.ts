import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * BFF → backend staff list/create.
 * URL style matches working BFFs (stores, auth): `${BACKEND_URL}/...`
 * BACKEND_URL is expected to already include `/api/v1` (same as login).
 */
function staffCollectionUrl(): string {
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("BACKEND_URL is not configured");
  }
  return `${base}/staff`;
}

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let upstream: string;
  try {
    upstream = staffCollectionUrl();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "BACKEND_URL missing" },
      { status: 500 },
    );
  }

  let res: Response;
  try {
    res = await fetch(upstream, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Upstream fetch failed",
        upstream,
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      {
        error: "Backend staff list failed",
        upstream,
        upstream_status: res.status,
        upstream_body: body,
      },
      { status: res.status },
    );
  }

  // Backend ApiResponse shape: { status, data, message }
  if (body && typeof body === "object" && "data" in body) {
    return NextResponse.json(body.data ?? [], { status: 200 });
  }
  return NextResponse.json(body, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let upstream: string;
  try {
    upstream = staffCollectionUrl();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "BACKEND_URL missing" },
      { status: 500 },
    );
  }

  const payload = await req.json();
  let res: Response;
  try {
    res = await fetch(upstream, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Upstream fetch failed",
        upstream,
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      {
        error: "Backend staff create failed",
        upstream,
        upstream_status: res.status,
        upstream_body: body,
      },
      { status: res.status },
    );
  }

  if (body && typeof body === "object" && "data" in body) {
    return NextResponse.json(body.data ?? body, { status: res.status });
  }
  return NextResponse.json(body, { status: res.status });
}
