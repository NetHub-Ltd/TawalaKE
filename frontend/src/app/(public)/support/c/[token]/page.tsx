"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  subscribeSupportConversation,
  type SupportWsMessage,
} from "@/lib/support-ws";

type Msg = SupportWsMessage;

type Detail = {
  id: string;
  subject?: string | null;
  status: string;
  messages: Msg[];
};

export default function PublicSupportThreadPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState<string>("");

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/support/${encodeURIComponent(token)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Conversation not found or link expired.");
        setData(null);
        return;
      }
      setData(json as Detail);
    } catch {
      setError("Could not load conversation.");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    return subscribeSupportConversation(
      `/ws/support/public/${encodeURIComponent(token)}`,
      (msg) => {
        setData((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === msg.id)) return prev;
          return { ...prev, messages: [...prev.messages, msg] };
        });
      },
      (s) => setLive(s)
    );
  }, [token]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/v1/public/support/${encodeURIComponent(token)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: reply.trim() }),
        }
      );
      if (!res.ok) {
        setError("Could not send reply.");
        return;
      }
      const created = (await res.json().catch(() => null)) as Msg | null;
      if (created?.id) {
        setData((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === created.id)) return prev;
          return { ...prev, messages: [...prev.messages, created] };
        });
      }
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <p className="mb-2 text-sm text-muted">
        <Link href="/support" className="underline-offset-2 hover:underline">
          Support
        </Link>
        {live === "open" ? (
          <span className="ml-2 text-xs text-brand-accent">· Live</span>
        ) : null}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {data?.subject || "Your support conversation"}
      </h1>
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!data && !error ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : null}
      {data ? (
        <>
          <p className="mt-1 text-xs text-muted">Status: {data.status}</p>
          <ul className="mt-6 space-y-3">
            {data.messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-border bg-card p-4 text-sm"
              >
                <p className="mb-1 text-xs font-medium text-muted">
                  {m.author_display_name || m.author_type}
                  {m.created_at
                    ? ` · ${new Date(m.created_at).toLocaleString()}`
                    : ""}
                </p>
                <p className="whitespace-pre-wrap text-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={sendReply} className="mt-6 space-y-3">
            <label className="block text-sm font-medium" htmlFor="reply">
              Reply
            </label>
            <textarea
              id="reply"
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send reply"}
            </button>
          </form>
        </>
      ) : null}
    </main>
  );
}
