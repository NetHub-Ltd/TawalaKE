"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: string;
  subject?: string | null;
  status: string;
  last_message_at?: string | null;
};

export default function OrgSupportInboxPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/org/support", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { detail?: string })?.detail || "Could not load support threads");
        setItems([]);
        return;
      }
      setItems((data as { items?: Conversation[] }).items || []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Support with Tawala</h1>
        <Link
          href="/org/contact-us"
          className="text-sm text-brand-primary underline-offset-2 hover:underline"
        >
          New request
        </Link>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading…</p> : null}
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/org/support/${c.id}`}
              className="block rounded-xl border border-border bg-card px-4 py-3 hover:border-brand-primary/40"
            >
              <p className="font-medium">{c.subject || "Support conversation"}</p>
              <p className="text-xs text-muted">{c.status}</p>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted">No support conversations yet.</p>
      ) : null}
    </main>
  );
}
