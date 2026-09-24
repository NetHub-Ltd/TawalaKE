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
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="mx-auto h-10 w-10 object-contain opacity-90"
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
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <BrandLoader
        size="lg"
        label={messages[index]}
        hint="Tawala is preparing your workspace"
      />
    </div>
  );
}
