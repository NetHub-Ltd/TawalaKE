import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/** Direct BFF → backend /stock/count (no shared stockProxy). */
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

  const url = backendUrl("/stock/count");
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

    console.error("[stock/count upstream]", { url, status: upstream.status, data });

    return NextResponse.json(
      data ?? { status: upstream.ok, message: upstream.statusText },
      { status: upstream.status }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stock count failed";
    console.error("[stock/count network]", { url, msg });
    return NextResponse.json({ status: false, error: msg }, { status: 502 });
  }
}
