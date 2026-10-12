"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  subscribeSupportConversation,
  type SupportWsMessage,
} from "@/lib/support-ws";

type Msg = SupportWsMessage;

export default function OrgSupportThreadPage() {
  const params = useParams();
  const id = String(params?.conversationId || "");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [subject, setSubject] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/v1/org/support/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { detail?: string })?.detail || "Not found");
      return;
    }
    setSubject((data as { subject?: string }).subject || null);
    setStatus((data as { status?: string }).status || "");
    setMessages((data as { messages?: Msg[] }).messages || []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id || !token) return;
    return subscribeSupportConversation(
      `/ws/support/org/${id}?token=${encodeURIComponent(token)}`,
      (msg) => {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      },
      (s) => setLive(s)
    );
  }, [id, token]);

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/org/support/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        setError("Could not send");
        return;
      }
      const created = (await res.json().catch(() => null)) as Msg | null;
      if (created?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
      }
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/org/support" className="text-sm text-muted underline-offset-2 hover:underline">
        ← Support inbox
      </Link>
      <h1 className="mt-2 text-xl font-semibold">
        {subject || "Support conversation"}
        {live === "open" ? (
          <span className="ml-2 text-xs font-normal text-brand-accent">Live</span>
        ) : null}
      </h1>
      {status ? <p className="text-xs text-muted">Status: {status}</p> : null}
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
