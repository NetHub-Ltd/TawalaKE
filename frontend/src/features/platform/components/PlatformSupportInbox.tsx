"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getPlatformAccessToken } from "@/lib/platform/auth";
import { Button, Spinner } from "@/lib/components/ui";

type Conversation = {
  id: string;
  channel: string;
  status: string;
  subject?: string | null;
  public_name?: string | null;
  public_email?: string | null;
  organization_id?: string | null;
  last_message_at?: string | null;
};

type Msg = {
  id: string;
  body: string;
  author_type: string;
  author_display_name?: string | null;
  created_at?: string | null;
};

export function PlatformSupportInbox() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const authHeader = useCallback(() => {
    const token = getPlatformAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/platform/support", {
        headers: { ...authHeader() },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string })?.detail || "Failed to load inbox");
        setItems([]);
        return;
      }
      setItems((data as { items?: Conversation[] }).items || []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  const loadThread = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/v1/platform/support/${id}`, {
        headers: { ...authHeader() },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Could not open thread");
        return;
      }
      setSelected(id);
      setMessages((data as { messages?: Msg[] }).messages || []);
    },
    [authHeader]
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/platform/support/${selected}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ body: reply.trim(), claim: true }),
      });
      if (!res.ok) {
        setError("Reply failed");
        return;
      }
      setReply("");
      await loadThread(selected);
      await loadList();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-card lg:w-80">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-sm font-semibold">Support inbox</h1>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadList()}>
            Refresh
          </Button>
        </div>
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
                className={`w-full border-b border-border px-4 py-3 text-left text-sm hover:bg-muted/40 ${
                  selected === c.id ? "bg-muted/50" : ""
                }`}
              >
                <p className="font-medium">
                  {c.subject || c.public_name || c.channel}
                </p>
                <p className="text-xs text-muted">
                  {c.channel} · {c.status}
                </p>
              </button>
            </li>
          ))}
          {!loading && items.length === 0 ? (
            <p className="p-4 text-sm text-muted">No support conversations yet.</p>
          ) : null}
        </ul>
      </aside>

      <section className="min-h-[50vh] flex-1 rounded-xl border border-border bg-card p-4">
        {!selected ? (
          <p className="text-sm text-muted">Select a conversation</p>
        ) : (
          <>
            <ul className="mb-4 max-h-[50vh] space-y-3 overflow-y-auto">
              {messages.map((m) => (
                <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="mb-1 text-xs text-muted">
                    {m.author_display_name || m.author_type}
                    {m.created_at
                      ? ` · ${new Date(m.created_at).toLocaleString()}`
                      : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={sendReply} className="space-y-2 border-t border-border pt-3">
              <textarea
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply as platform support…"
                required
              />
              <Button type="submit" disabled={sending}>
                {sending ? "Sending…" : "Send reply"}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
