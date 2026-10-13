"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  SupportChatThread,
  type ChatMessage,
} from "@/features/support/components/SupportChatThread";
import { subscribeSupportConversation } from "@/lib/support-ws";

type Detail = {
  id: string;
  subject?: string | null;
  status: string;
  messages: ChatMessage[];
};

export default function PublicSupportThreadPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState("");

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
      const created = (await res.json().catch(() => null)) as ChatMessage | null;
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
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:py-12">
      <p className="mb-3 text-sm text-muted">
        <Link href="/support" className="underline-offset-2 hover:underline">
          Support
        </Link>
      </p>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!data && !error ? (
        <p className="text-sm text-muted">Loading conversation…</p>
      ) : null}
      {data ? (
        <SupportChatThread
          messages={data.messages}
          perspective="public"
          draft={reply}
          onDraftChange={setReply}
          onSend={sendReply}
          sending={sending}
          liveStatus={live}
          placeholder="Write your reply…"
          header={
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {data.subject || "Your support conversation"}
              </h1>
              <p className="text-xs text-muted">Status: {data.status}</p>
            </div>
          }
        />
      ) : null}
    </main>
  );
}
