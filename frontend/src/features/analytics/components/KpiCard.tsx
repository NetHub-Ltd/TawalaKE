"use client";

import React from "react";
import { clsx } from "clsx";

export type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  tone?: "default" | "good" | "bad" | "warn" | "muted";
  /** Stronger visual weight for the primary pulse metric (e.g. net revenue). */
  emphasis?: boolean;
};

const toneClass: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-muted",
  good: "text-brand-accent",
  bad: "text-rose-600",
  warn: "text-amber-600",
  muted: "text-muted",
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  tone = "default",
  emphasis = false,
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        "flex min-h-[88px] flex-col justify-between rounded-xl border bg-card px-3 py-3 shadow-card sm:px-4",
        emphasis
          ? "border-brand-primary/30 sm:col-span-1"
          : "border-border/50"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 truncate font-mono font-semibold tabular-nums text-foreground",
          emphasis ? "text-lg sm:text-xl" : "text-base sm:text-lg"
        )}
      >
        {value}
      </p>
      {delta || hint ? (
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

export function KpiRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
