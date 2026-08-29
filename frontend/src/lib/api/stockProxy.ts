import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

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
  try {
    const res = await fetch(`${API_BASE}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await readBackendJson(res);
    if (!res.ok || (data && typeof data === "object" && (data as { status?: boolean }).status === false)) {
      return NextResponse.json(
        {
          error: errorMessage(data, fallbackError, res.status),
          detail: data && typeof data === "object" ? (data as { detail?: unknown }).detail : undefined,
        },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json(data, { status: res.status });
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
    const res = await fetch(`${API_BASE}${backendPath}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const data = await readBackendJson(res);
    if (!res.ok || (data && typeof data === "object" && (data as { status?: boolean }).status === false)) {
      return NextResponse.json(
        { error: errorMessage(data, fallbackError, res.status) },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : fallbackError;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
