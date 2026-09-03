import { NextResponse } from "next/server";

function backendBase(): string | null {
  const raw = process.env.BACKEND_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend URL not configured", message: "Backend URL not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const path = base.endsWith("/api/v1")
    ? `${base}/auth/forgot-password`
    : `${base}/api/v1/auth/forgot-password`;

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Upstream unavailable",
        message: "Could not reach the server. Please try again.",
      },
      { status: 502 }
    );
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  // Preserve upstream status (including 202 Accepted).
  return NextResponse.json(data, { status: response.status });
}
