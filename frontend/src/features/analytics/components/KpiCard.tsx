"use client";

import React from "react";
import { clsx } from "clsx";

export type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  tone?: "default" | "good" | "bad" | "warn" | "muted";
};

const toneClass: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-muted",
  good: "text-brand-accent",
  bad: "text-rose-600",
  warn: "text-amber-600",
  muted: "text-muted",
};

export function KpiCard({ label, value, hint, delta, tone = "default" }: KpiCardProps) {
  return (
    <div className="flex min-h-[88px] flex-col justify-between rounded-xl border border-border/50 bg-card px-3 py-3 shadow-card sm:px-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg">{value}</p>
      {(delta || hint) ? (
        <p className={clsx("mt-0.5 text-[11px]", toneClass[tone])}>
          {delta}
          {delta && hint ? " · " : ""}
          {hint}
        </p>
      ) : (
        <span className="mt-0.5 h-4" aria-hidden />
      )}
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
  );
}
