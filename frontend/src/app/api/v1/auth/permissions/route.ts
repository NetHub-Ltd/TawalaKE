import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/**
 * BFF → GET /auth/permissions
 * Session stays lean; permissions are fetched on demand and Redis-cached upstream.
 */
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ status: false, error: "Unauthorized!" }, { status: 401 });
  }

  const url = backendUrl("/auth/permissions");
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { status: false, message: text.slice(0, 500) || res.statusText };
    }
    if (!res.ok) {
      return NextResponse.json(
        data ?? { status: false, error: res.statusText },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load permissions";
    return NextResponse.json({ status: false, error: msg }, { status: 502 });
  }
}
