/**
 * Server-only helper: proxy browser → Next BFF → FastAPI platform routes.
 * BACKEND_URL must never be used in client components.
 */
import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/api/backend";

export async function proxyPlatform(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    authorization?: string | null;
    searchParams?: URLSearchParams;
  } = {}
): Promise<NextResponse> {
  const method = init.method || "GET";
  let url = backendUrl(path.startsWith("/") ? path : `/${path}`);
  if (init.searchParams && init.searchParams.toString()) {
    url = `${url}?${init.searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (init.authorization) {
    headers.Authorization = init.authorization;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        init.body !== undefined && method !== "GET" && method !== "HEAD"
          ? JSON.stringify(init.body)
          : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        detail: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Could not reach the API. Please try again.",
        },
      },
      { status: 502 }
    );
  }

  let data: unknown = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  return NextResponse.json(data, { status: response.status });
}

export function bearerFrom(req: Request): string | null {
  const h = req.headers.get("authorization");
  return h && h.startsWith("Bearer ") ? h : null;
}
