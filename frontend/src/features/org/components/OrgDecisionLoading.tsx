"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLoader } from "@/lib/components/ui";

const messages = [
  "Setting up your workspace…",
  "Loading your organization…",
  "Preparing branches and team…",
  "Almost ready…",
];

const TIMEOUT_MS = 10_000;

/** Neutral outline shell — no fills — visible through blur */
function LayoutGhost() {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none"
      aria-hidden
    >
      <div className="h-14 border-b border-border/40" />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <div className="hidden w-52 shrink-0 border-r border-border/35 md:block" />
        <div className="flex-1 space-y-4 p-6 md:p-8">
          <div className="h-7 w-44 rounded-lg border border-border/40" />
          <div className="h-4 w-72 max-w-full rounded border border-border/30" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-28 rounded-xl border border-border/35" />
            <div className="h-28 rounded-xl border border-border/35" />
            <div className="h-28 rounded-xl border border-border/35" />
          </div>
          <div className="mt-4 h-40 rounded-xl border border-border/30" />
        </div>
      </div>
    </div>
  );
}

/**
 * /org entry loader — brand pulse + plain rotating status.
 * After TIMEOUT_MS shows recovery actions (reload / login).
 */
export function OrgDecisionLoading() {
  const [index, setIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);

    const timeout = setTimeout(() => setTimedOut(true), TIMEOUT_MS);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timeout);
    };
  }, []);

  if (timedOut) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <LayoutGhost />
        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/80 p-8 text-center shadow-lift backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="mx-auto h-10 w-10 object-contain"
          />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              This is taking longer than expected
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              We couldn&apos;t load your organization in time. The connection may
              be slow, or your session may have expired.
            </p>
          </div>
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="block w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/login"
              className="block w-full text-sm text-muted underline underline-offset-2 hover:text-foreground"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <LayoutGhost />
      <BrandLoader
        overlay
        size="lg"
        label={messages[index]}
        hint="Preparing your workspace"
      />
    </div>
  );
}

