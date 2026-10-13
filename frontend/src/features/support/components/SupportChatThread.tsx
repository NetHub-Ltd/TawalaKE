"use client";

/**
 * Shared chat thread UI for public, org, and platform support.
 * Bubble layout (inbound left / outbound right), sticky composer, auto-scroll.
 */
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  author_type: string;
  author_display_name?: string | null;
  created_at?: string | null;
};

export type ChatPerspective =
  | "public"
  | "org_staff"
  | "platform"
  | "ai_lab";

type Props = {
  messages: ChatMessage[];
  perspective: ChatPerspective;
  /** Controlled composer */
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  liveStatus?: string;
  emptyLabel?: string;
  className?: string;
  /** Optional header slot above the scroll area */
  header?: React.ReactNode;
  /** Show AI meta strip under AI bubbles (lab) */
  showAiHint?: boolean;
};

function isOutbound(authorType: string, perspective: ChatPerspective): boolean {
  const t = (authorType || "").toUpperCase();
  if (perspective === "public") {
    return t === "PUBLIC_CONTACT";
  }
  if (perspective === "org_staff") {
    return t === "ORG_STAFF";
  }
  if (perspective === "platform" || perspective === "ai_lab") {
    return t === "PLATFORM_USER";
  }
  return false;
}

function isAi(authorType: string): boolean {
  return (authorType || "").toUpperCase() === "AI_AGENT";
}

function roleLabel(m: ChatMessage): string {
  const t = (m.author_type || "").toUpperCase();
  if (m.author_display_name) return m.author_display_name;
  if (t === "AI_AGENT") return "Tawala Assistant";
  if (t === "PLATFORM_USER") return "Platform support";
  if (t === "ORG_STAFF") return "Staff";
  if (t === "PUBLIC_CONTACT") return "Customer";
  if (t === "SYSTEM") return "System";
  return m.author_type || "User";
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SupportChatThread({
  messages,
  perspective,
  draft,
  onDraftChange,
  onSend,
  sending = false,
  disabled = false,
  placeholder = "Type a message…",
  liveStatus,
  emptyLabel = "No messages yet. Say hello to start.",
  className,
  header,
  showAiHint = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.id]);

  const liveOpen = liveStatus === "open";

  return (
    <div
      className={cn(
        "flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-surface-container-low",
        className
      )}
    >
      {header ? (
        <div className="shrink-0 border-b border-border bg-card px-4 py-3">
          {header}
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-b border-border/60 bg-card/80 px-4 py-1.5 text-xs text-muted">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            liveOpen ? "bg-success" : "bg-outline-variant"
          )}
          aria-hidden
        />
        <span>
          {liveOpen
            ? "Live"
            : liveStatus === "connecting"
              ? "Connecting…"
              : liveStatus === "error"
                ? "Live unavailable"
                : "Offline"}
        </span>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">{emptyLabel}</p>
        ) : (
          messages.map((m) => {
            const outbound = isOutbound(m.author_type, perspective);
            const ai = isAi(m.author_type);
            return (
              <div
                key={m.id}
                className={cn(
                  "flex w-full",
                  outbound ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[min(85%,28rem)] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    outbound &&
                      "rounded-br-md bg-brand-primary text-on-primary",
                    !outbound &&
                      !ai &&
                      "rounded-bl-md border border-border bg-card text-foreground",
                    ai &&
                      "rounded-bl-md border border-brand-accent/30 bg-success-soft text-foreground"
                  )}
                >
                  <p
                    className={cn(
                      "mb-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      outbound ? "text-on-primary/80" : "text-muted"
                    )}
                  >
                    {roleLabel(m)}
                    {formatTime(m.created_at)
                      ? ` · ${formatTime(m.created_at)}`
                      : ""}
                  </p>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {m.body}
                  </p>
                  {showAiHint && ai ? (
                    <p className="mt-1 text-[10px] text-muted">
                      AI reply · stored for monitoring
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSend}
        className="shrink-0 border-t border-border bg-card p-3"
      >
        <label htmlFor="support-chat-draft" className="sr-only">
          Message
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="support-chat-draft"
            rows={2}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || sending}
            required
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim() && !sending && !disabled) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={disabled || sending || !draft.trim()}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-on-primary transition-opacity disabled:opacity-50"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted">
          Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
