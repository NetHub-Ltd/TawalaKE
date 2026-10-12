/** Server-only helpers for support/messaging BFF routes. */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function proxyPublic(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<NextResponse> {
  const method = init.method || "GET";
  try {
    const res = await fetch(backendUrl(path), {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:
        init.body !== undefined && method !== "GET" && method !== "HEAD"
          ? JSON.stringify(init.body)
          : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not reach the API. Please try again." },
      { status: 502 }
    );
  }
}

export async function proxyAuthed(
  path: string,
  init: { method?: string; body?: unknown; searchParams?: URLSearchParams } = {}
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const method = init.method || "GET";
  let url = backendUrl(path);
  if (init.searchParams?.toString()) {
    url = `${url}?${init.searchParams.toString()}`;
  }
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body:
        init.body !== undefined && method !== "GET" && method !== "HEAD"
          ? JSON.stringify(init.body)
          : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Could not reach the API. Please try again." },
      { status: 502 }
    );
  }
}
