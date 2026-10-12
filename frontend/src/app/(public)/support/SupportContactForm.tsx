"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function SupportContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/public/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || null,
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { detail?: string; message?: string })?.detail ||
            (data as { message?: string })?.message ||
            "Could not send message. Please try again."
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-lift">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-accent" />
        <p className="mt-3 text-lg font-semibold text-foreground">Message received</p>
        <p className="mt-2 text-sm text-muted">
          We emailed you a secure link to view and reply to this conversation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lift">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="support-name">
          Your name
        </label>
        <input
          id="support-name"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="support-email">
          Email
        </label>
        <input
          id="support-email"
          type="email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="support-subject">
          Subject <span className="text-muted">(optional)</span>
        </label>
        <input
          id="support-subject"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="support-message">
          Message
        </label>
        <textarea
          id="support-message"
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
