/**
 * Support conversation live updates via same-origin WebSocket.
 * Browser never sees BACKEND_URL — connects to this Next host; next.config
 * rewrites /api/v1/ws/* to the server-only BACKEND_URL (BFF).
 */

export function supportWsUrl(path: string): string {
  if (typeof window === "undefined") return "";
  const raw = path.startsWith("/") ? path : `/${path}`;
  // Normalize to /api/v1/ws/...
  const apiPath = raw.startsWith("/api/v1/")
    ? raw
    : raw.startsWith("/ws/")
      ? `/api/v1${raw}`
      : `/api/v1${raw.startsWith("/") ? raw : `/${raw}`}`;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${apiPath}`;
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
