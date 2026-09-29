import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/**
 * Proxy GET /api/v1/jobs/stream → FastAPI SSE job events.
 * Passes through the upstream text/event-stream body.
 */
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const res = await fetch(backendUrl("/jobs/stream"), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "text/event-stream",
      },
      cache: "no-store",
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      return new Response(text || JSON.stringify({ error: "Upstream stream failed" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("BACKEND_URL")
        ? "Backend URL not configured"
        : "Upstream unavailable";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
