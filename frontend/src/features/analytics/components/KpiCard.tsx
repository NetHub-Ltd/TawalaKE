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
  default: "text-slate-600",
  good: "text-emerald-600",
  bad: "text-rose-600",
  warn: "text-amber-600",
  muted: "text-slate-400",
};

export function KpiCard({ label, value, hint, delta, tone = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {(delta || hint) && (
        <p className={clsx("mt-1 text-xs", toneClass[tone])}>
          {delta}
          {delta && hint ? " · " : ""}
          {hint}
        </p>
      )}
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
  );
}
