"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  SupportChatThread,
  type ChatMessage,
} from "@/features/support/components/SupportChatThread";
import { subscribeSupportConversation } from "@/lib/support-ws";

export default function OrgMessageThreadPage() {
  const params = useParams();
  const id = String(params?.conversationId || "");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [subject, setSubject] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/v1/org/messages/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { detail?: string })?.detail || "Not found");
      return;
    }
    setSubject((data as { subject?: string }).subject || null);
    setMessages((data as { messages?: ChatMessage[] }).messages || []);
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
      const created = (await res.json().catch(() => null)) as ChatMessage | null;
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
      <Link
        href="/org/messages"
        className="text-sm text-muted underline-offset-2 hover:underline"
      >
        ← Messages
      </Link>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4">
        <SupportChatThread
          messages={messages}
          perspective="org_staff"
          draft={reply}
          onDraftChange={setReply}
          onSend={onReply}
          sending={sending}
          liveStatus={live}
          placeholder="Write a message…"
          header={
            <div>
              <h1 className="text-lg font-semibold">
                {subject || "Conversation"}
              </h1>
            </div>
          }
        />
      </div>
    </main>
  );
}
