import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * BFF → POST {BACKEND_URL}/business/checkout
 *
 * Backend returns a Sale object (or error body), NOT necessarily
 * { status: boolean }. Treat HTTP status as source of truth.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const token = session?.accessToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
    if (!base) {
      return NextResponse.json(
        { error: "BACKEND_URL is not configured" },
        { status: 500 },
      );
    }

    const url = base.endsWith("/api/v1")
      ? `${base}/business/checkout`
      : `${base}/api/v1/business/checkout`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (typeof data === "object" &&
          data &&
          (data.detail || data.error || data.message)) ||
        res.statusText ||
        "Checkout failed";
      const detail =
        typeof message === "string" ? message : JSON.stringify(message);
      console.error("[checkout BFF] upstream error", res.status, detail);
      return NextResponse.json(
        { error: detail, detail },
        { status: res.status },
      );
    }

    // Success: pass through Sale (or wrapper) so the client can redirect
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("[checkout BFF] fatal", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Pipeline Exception",
      },
      { status: 500 },
    );
  }
}
