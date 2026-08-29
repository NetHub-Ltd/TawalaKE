import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

async function readBackendJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { status: false, message: text.slice(0, 500) || res.statusText };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const res = await fetch(`${API_BASE}/business/stock-audit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await readBackendJson(res)) as {
      status?: boolean;
      message?: string;
      detail?: unknown;
      error?: string;
    } | null;
    if (!res.ok || (data && data.status === false)) {
      const msg =
        (data && (data.message || data.error)) ||
        (typeof data?.detail === "string" ? data.detail : null) ||
        `Stock count failed (${res.status})`;
      return NextResponse.json({ error: msg, detail: data?.detail }, { status: res.status || 500 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Audit proxy error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
