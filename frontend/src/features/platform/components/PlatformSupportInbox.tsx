"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlatformAccessToken } from "@/lib/platform/auth";
import { Button, Spinner } from "@/lib/components/ui";
import {
  SupportChatThread,
  type ChatMessage,
} from "@/features/support/components/SupportChatThread";
import { subscribeSupportConversation } from "@/lib/support-ws";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  channel: string;
  status: string;
  subject?: string | null;
  public_name?: string | null;
  public_email?: string | null;
  organization_id?: string | null;
  last_message_at?: string | null;
  assignee_type?: string | null;
  ai_enabled?: boolean | null;
};

type FilterMode = "all" | "ai";

export function PlatformSupportInbox() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadMeta, setThreadMeta] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    const t = getPlatformAccessToken();
    if (!t) {
      router.replace("/platform/login");
      return;
    }
    setToken(t);
  }, [router]);

  const headers = useMemo((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const q =
        filter === "ai"
          ? "?status=AI_ACTIVE&limit=50"
          : "?limit=50";
      const res = await fetch(`/api/v1/platform/support${q}`, {
        headers,
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string })?.detail || "Failed to load inbox");
        setItems([]);
        return;
      }
      const list = (data as { items?: Conversation[] }).items || [];
      if (filter === "ai") {
        // Also surface escalated/open threads that may have AI history
        const res2 = await fetch(`/api/v1/platform/support?limit=50`, {
          headers,
          cache: "no-store",
        });
        const data2 = await res2.json().catch(() => ({}));
        if (res2.ok) {
          const all = (data2 as { items?: Conversation[] }).items || [];
          const ids = new Set(list.map((c) => c.id));
          for (const c of all) {
            if (
              !ids.has(c.id) &&
              (c.status === "AI_ACTIVE" ||
                c.status === "ESCALATED" ||
                String(c.assignee_type || "").toUpperCase() === "AI")
            ) {
              list.push(c);
            }
          }
        }
      }
      setItems(list);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token, headers, filter]);

  const loadThread = useCallback(
    async (id: string) => {
      if (!token) return;
      const res = await fetch(`/api/v1/platform/support/${id}`, {
        headers,
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Could not open thread");
        return;
      }
      setSelected(id);
      setThreadMeta(data as Conversation);
      setMessages((data as { messages?: ChatMessage[] }).messages || []);
    },
    [token, headers]
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // Live WS for selected conversation
  useEffect(() => {
    if (!selected || !token) return;
    return subscribeSupportConversation(
      `/ws/support/platform/${selected}?token=${encodeURIComponent(token)}`,
      (msg) => {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      },
      (s) => setLive(s)
    );
  }, [selected, token]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/platform/support/${selected}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ body: reply.trim(), claim: true }),
      });
      if (!res.ok) {
        setError("Reply failed");
        return;
      }
      const created = (await res.json().catch(() => null)) as ChatMessage | null;
      if (created?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
      }
      setReply("");
      await loadList();
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Support</h1>
          <p className="text-xs text-muted">
            Cross-tenant inbox · live chat for public & org support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs"
            role="tablist"
            aria-label="Inbox filter"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium",
                filter === "all"
                  ? "bg-brand-primary text-on-primary"
                  : "text-muted hover:text-foreground"
              )}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === "ai"}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium",
                filter === "ai"
                  ? "bg-brand-primary text-on-primary"
                  : "text-muted hover:text-foreground"
              )}
              onClick={() => setFilter("ai")}
            >
              AI lab
            </button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadList()}>
            Refresh
          </Button>
        </div>
      </div>

      {filter === "ai" ? (
        <p className="rounded-lg border border-brand-accent/20 bg-success-soft px-3 py-2 text-xs text-foreground">
          AI lab: threads where the assistant is active or escalated — use this to
          review model replies (every AI message is stored for monitoring).
        </p>
      ) : null}

      <div className="flex min-h-[60vh] flex-1 flex-col gap-3 lg:flex-row">
        <aside className="w-full shrink-0 overflow-hidden rounded-xl border border-border bg-card lg:w-80">
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : null}
          {error ? (
            <p className="p-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void loadThread(c.id)}
                  className={cn(
                    "w-full border-b border-border px-4 py-3 text-left text-sm transition-colors hover:bg-surface-container",
                    selected === c.id && "bg-surface-container-high"
                  )}
                >
                  <p className="font-medium text-foreground">
                    {c.subject || c.public_name || c.channel}
                  </p>
                  <p className="text-xs text-muted">
                    {c.channel} · {c.status}
                  </p>
                </button>
              </li>
            ))}
            {!loading && items.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                {filter === "ai"
                  ? "No AI-active threads yet. Send a public support message to test."
                  : "No support conversations yet."}
              </p>
            ) : null}
          </ul>
        </aside>

        <section className="min-h-[50vh] flex-1">
          {!selected ? (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted">
              Select a conversation
            </div>
          ) : (
            <SupportChatThread
              messages={messages}
              perspective={filter === "ai" ? "ai_lab" : "platform"}
              draft={reply}
              onDraftChange={setReply}
              onSend={sendReply}
              sending={sending}
              liveStatus={live}
              placeholder="Reply as platform support…"
              showAiHint={filter === "ai"}
              header={
                <div>
                  <p className="font-semibold text-foreground">
                    {threadMeta?.subject ||
                      threadMeta?.public_name ||
                      "Conversation"}
                  </p>
                  <p className="text-xs text-muted">
                    {threadMeta?.channel} · {threadMeta?.status}
                    {threadMeta?.public_email
                      ? ` · ${threadMeta.public_email}`
                      : ""}
                  </p>
                </div>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
