"use client";

import React from "react";
import { clsx } from "clsx";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

const OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "3d", label: "3d" },
  { value: "7d", label: "7d" },
  { value: "month", label: "Month" },
];

export function PeriodPills({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (v: AnalyticsRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Report period"
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-brand-accent text-white shadow-sm"
                : "text-muted hover:bg-background hover:text-foreground"
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
