"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  PhoneCall,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/**
 * Authenticated contact page (under /org — protected by auth proxy).
 */
export default function OrgContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/org"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Back to organization
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-primary">
            Contact
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">Talk to Tawala</h1>
          <p className="mt-2 text-muted">
            Sales, Enterprise pricing, or product questions — we respond on business days.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <a
              href="mailto:support@nethub.co.ke"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-brand-primary/40"
            >
              <Mail className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-xs text-muted">support@nethub.co.ke</p>
              </div>
            </a>
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-brand-primary/40"
            >
              <MessageCircle className="h-5 w-5 text-brand-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">WhatsApp</p>
                <p className="text-xs text-muted">Chat with support</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <PhoneCall className="h-5 w-5 text-brand-secondary" />
              <div>
                <p className="text-sm font-medium text-foreground">Phone</p>
                <p className="text-xs text-muted">Request a callback via the form</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lift md:col-span-3">
            {isSuccess ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-brand-accent" />
                <p className="text-lg font-semibold text-foreground">Message received</p>
                <p className="text-sm text-muted">
                  We&apos;ll get back to you shortly. You can return to your workspace anytime.
                </p>
                <Link
                  href="/org"
                  className="mt-2 text-sm font-medium text-brand-primary underline-offset-2 hover:underline"
                >
                  Back to organization
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="name">
                    Your name
                  </label>
                  <input
                    id="name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-foreground"
                    htmlFor="organization"
                  >
                    Organization
                  </label>
                  <input
                    id="organization"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-foreground"
                    htmlFor="message"
                  >
                    How can we help?
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-brand-primary/30 focus:ring-2"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enterprise pricing, migration, custom limits…"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send message"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
