import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function readBackendJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { status: false, message: text.slice(0, 500) || res.statusText };
  }
}

function errorMessage(data: unknown, fallback: string, status: number): string {
  if (status === 403) {
    return "You don’t have permission to change stock. Ask a manager.";
  }
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.error === "string") return d.error;
    if (typeof d.message === "string") return d.message;
    if (typeof d.detail === "string") return d.detail;
  }
  return fallback;
}

/**
 * Prefer body.status when present.
 * - status === true  → success even if HTTP is non-2xx (post-commit edge cases)
 * - status === false → failure
 * - missing status   → fall back to HTTP ok
 */
function isFailure(res: Response, data: unknown): boolean {
  if (data && typeof data === "object" && "status" in data) {
    return (data as { status?: boolean }).status === false;
  }
  return !res.ok;
}

/** Authenticated POST to backend /stock/... */
export async function proxyStockPost(
  backendPath: string,
  body: unknown,
  fallbackError: string
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  const url = backendUrl(backendPath);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await readBackendJson(res);
    if (isFailure(res, data)) {
      console.error("[stockProxy POST]", {
        url,
        upstreamStatus: res.status,
        data,
      });
      return NextResponse.json(
        {
          error: errorMessage(data, fallbackError, res.status),
          detail:
            data && typeof data === "object"
              ? (data as { detail?: unknown }).detail
              : undefined,
        },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }
    // Always surface success as 200 to the browser when body says success
    // (or HTTP is ok with no status field).
    return NextResponse.json(data ?? { status: true, message: "Success" }, {
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : fallbackError;
    console.error("[stockProxy POST network]", { url, msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function proxyStockGet(backendPath: string, fallbackError: string) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  const url = backendUrl(backendPath);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const data = await readBackendJson(res);
    if (isFailure(res, data)) {
      console.error("[stockProxy GET]", {
        url,
        upstreamStatus: res.status,
        data,
      });
      return NextResponse.json(
        { error: errorMessage(data, fallbackError, res.status) },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }
    return NextResponse.json(data ?? { status: true, message: "Success" }, {
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : fallbackError;
    console.error("[stockProxy GET network]", { url, msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
