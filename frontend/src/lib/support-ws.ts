/** Build WebSocket URL for support conversation live updates. */

export function supportWsUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const explicit = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
  if (explicit) {
    return `${explicit}${p.startsWith("/api") ? p : `/api/v1${p}`}`;
  }
  const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (backend) {
    const wsBase = backend
      .replace(/^http:/i, "ws:")
      .replace(/^https:/i, "wss:");
    if (wsBase.endsWith("/api/v1")) {
      return `${wsBase}${p.replace(/^\/api\/v1/, "") || p}`;
    }
    return `${wsBase}/api/v1${p.replace(/^\/api\/v1/, "")}`;
  }
  // Same-origin fallback (requires reverse-proxy WS upgrade to API)
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/api/v1${p.replace(/^\/api\/v1/, "")}`;
  }
  return "";
}

export type SupportWsMessage = {
  id: string;
  body: string;
  author_type: string;
  author_display_name?: string | null;
  created_at?: string | null;
};

/** Subscribe to conversation events; returns cleanup. */
export function subscribeSupportConversation(
  wsPath: string,
  onMessage: (msg: SupportWsMessage) => void,
  onStatus?: (status: "connecting" | "open" | "closed" | "error") => void
): () => void {
  const url = supportWsUrl(wsPath);
  if (!url || typeof window === "undefined") {
    onStatus?.("error");
    return () => {};
  }
  onStatus?.("connecting");
  let ws: WebSocket | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    try {
      ws = new WebSocket(url);
    } catch {
      onStatus?.("error");
      return;
    }
    ws.onopen = () => onStatus?.("open");
    ws.onclose = () => {
      onStatus?.("closed");
      if (!closed) {
        retry = setTimeout(connect, 2500);
      }
    };
    ws.onerror = () => onStatus?.("error");
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as {
          type?: string;
          message?: SupportWsMessage;
        };
        if (data?.type === "support.message" && data.message?.id) {
          onMessage(data.message);
        }
      } catch {
        /* ignore */
      }
    };
  };
  connect();
  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
  };
}
