import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * BFF → backend POST /business/checkout
 * Backend returns ApiResponse[SaleReadWithRelations]:
 *   { status: true, data: Sale, ... }
 * HTTP status is authoritative for transport errors.
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
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
      const raw =
        (data &&
          typeof data === "object" &&
          ((data as { detail?: unknown }).detail ||
            (data as { error?: unknown }).error ||
            (data as { message?: unknown }).message)) ||
        res.statusText ||
        "Checkout failed";
      const detail = typeof raw === "string" ? raw : JSON.stringify(raw);
      console.error("[checkout BFF] upstream", res.status, detail);
      return NextResponse.json({ error: detail, detail }, { status: res.status });
    }

    // Prefer unwrapped sale when ApiResponse envelope is present
    const payload =
      data &&
      typeof data === "object" &&
      "data" in data &&
      (data as { data: unknown }).data != null
        ? (data as { data: unknown }).data
        : data;

    return NextResponse.json(payload, { status: 200 });
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
