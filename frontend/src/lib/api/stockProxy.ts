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

function isFailure(res: Response, data: unknown): boolean {
  if (!res.ok) return true;
  if (data && typeof data === "object" && (data as { status?: boolean }).status === false) {
    return true;
  }
  return false;
}

/** Authenticated POST to backend /stock/... (path always under /api/v1 via backendUrl). */
export async function proxyStockPost(
  backendPath: string,
  body: unknown,
  fallbackError: string
) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  try {
    const res = await fetch(backendUrl(backendPath), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await readBackendJson(res);
    if (isFailure(res, data)) {
      return NextResponse.json(
        {
          error: errorMessage(data, fallbackError, res.status),
          detail:
            data && typeof data === "object"
              ? (data as { detail?: unknown }).detail
              : undefined,
        },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json(data ?? { status: true, message: "Success" }, {
      status: res.status || 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : fallbackError;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function proxyStockGet(backendPath: string, fallbackError: string) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  try {
    const res = await fetch(backendUrl(backendPath), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const data = await readBackendJson(res);
    if (isFailure(res, data)) {
      return NextResponse.json(
        { error: errorMessage(data, fallbackError, res.status) },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json(data ?? { status: true, message: "Success" }, {
      status: res.status || 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : fallbackError;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
