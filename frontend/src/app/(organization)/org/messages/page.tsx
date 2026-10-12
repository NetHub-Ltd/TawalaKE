"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: string;
  subject?: string | null;
  status: string;
  last_message_at?: string | null;
  channel: string;
};

export default function OrgMessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [participantIds, setParticipantIds] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/org/messages", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { detail?: string })?.detail ||
            "Could not load messages. You may need messaging permission."
        );
        setItems([]);
        return;
      }
      setItems((data as { items?: Conversation[] }).items || []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    const ids = participantIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!message.trim() || ids.length === 0) {
      setError("Message and at least one participant staff id are required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/org/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || null,
          message: message.trim(),
          participant_staff_ids: ids,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string })?.detail || "Could not create thread.");
        return;
      }
      setSubject("");
      setMessage("");
      setParticipantIds("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Internal messages</h1>
        <Link href="/org/contact-us" className="text-sm text-brand-primary underline-offset-2 hover:underline">
          Contact Tawala support
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Staff-to-staff messages stay inside your organization. Text only. No email.
      </p>

      <form onSubmit={createThread} className="mb-10 space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">New conversation</h2>
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Participant staff UUIDs (comma-separated)"
          value={participantIds}
          onChange={(e) => setParticipantIds(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creating…" : "Start conversation"}
        </button>
      </form>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted">No conversations yet. Start one above.</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/org/messages/${c.id}`}
              className="block rounded-xl border border-border bg-card px-4 py-3 transition hover:border-brand-primary/40"
            >
              <p className="font-medium text-foreground">
                {c.subject || "Untitled conversation"}
              </p>
              <p className="text-xs text-muted">
                {c.status}
                {c.last_message_at
                  ? ` · ${new Date(c.last_message_at).toLocaleString()}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
