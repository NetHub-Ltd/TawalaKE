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
    ? `${base}/auth/password-reset/confirm`
    : `${base}/api/v1/auth/password-reset/confirm`;

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

  if (!response.ok) {
    const detail =
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      "Unable to reset password. The link may be invalid or expired.";
    return NextResponse.json(
      { error: detail, message: detail, detail: data.detail ?? detail },
      { status: response.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
