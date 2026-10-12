"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Msg = {
  id: string;
  body: string;
  author_display_name?: string | null;
  author_type: string;
  created_at?: string | null;
};

export default function OrgMessageThreadPage() {
  const params = useParams();
  const id = String(params?.conversationId || "");
  const [subject, setSubject] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/v1/org/messages/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { detail?: string })?.detail || "Not found");
      return;
    }
    setSubject((data as { subject?: string }).subject || null);
    setMessages((data as { messages?: Msg[] }).messages || []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/org/messages/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        setError("Could not send");
        return;
      }
      setReply("");
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/org/messages" className="text-sm text-muted underline-offset-2 hover:underline">
        ← Messages
      </Link>
      <h1 className="mt-2 text-xl font-semibold">{subject || "Conversation"}</h1>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {messages.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="mb-1 text-xs text-muted">
              {m.author_display_name || m.author_type}
              {m.created_at ? ` · ${new Date(m.created_at).toLocaleString()}` : ""}
            </p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={onReply} className="mt-6 space-y-3">
        <textarea
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending…" : "Reply"}
        </button>
      </form>
    </main>
  );
}
