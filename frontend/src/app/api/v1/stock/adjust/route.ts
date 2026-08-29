import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/**
 * Direct BFF → backend /stock/adjust (no shared stockProxy).
 * Passes through upstream status + body so we can see the real error.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ status: false, error: "Unauthorized!" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: false, error: "Invalid request body" }, { status: 400 });
  }

  const url = backendUrl("/stock/adjust");
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { status: false, message: text.slice(0, 500) || upstream.statusText };
    }

    console.error("[stock/adjust upstream]", {
      url,
      status: upstream.status,
      data,
    });

    // Pass through upstream status and body unchanged (UI reads status/message/error).
    return NextResponse.json(
      data ?? { status: upstream.ok, message: upstream.statusText },
      { status: upstream.status }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stock adjust failed";
    console.error("[stock/adjust network]", { url, msg });
    return NextResponse.json({ status: false, error: msg }, { status: 502 });
  }
}
