"use client";

import React, { useRef } from "react";
import { clsx } from "clsx";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

const OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "3d", label: "3d" },
  { value: "7d", label: "7d" },
  { value: "custom", label: "Custom" },
];

export function PeriodPills({
  value,
  customDate,
  onChange,
}: {
  value: AnalyticsRange;
  /** YYYY-MM-DD when value is custom */
  customDate?: string;
  onChange: (period: AnalyticsRange, date?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="group"
      aria-label="Report period"
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card p-1"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        if (opt.value === "custom") {
          return (
            <span key={opt.value} className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (value === "custom" && customDate) {
                    inputRef.current?.showPicker?.();
                    inputRef.current?.click();
                  } else {
                    inputRef.current?.showPicker?.();
                    inputRef.current?.click();
                  }
                }}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-brand-accent text-white shadow-sm"
                    : "text-muted hover:bg-background hover:text-foreground"
                )}
                aria-pressed={active}
              >
                {active && customDate
                  ? customDate.slice(5) // MM-DD
                  : "Custom"}
              </button>
              <input
                ref={inputRef}
                type="date"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                value={customDate || ""}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const d = e.target.value;
                  if (d) onChange("custom", d);
                }}
                aria-label="Custom date"
              />
            </span>
          );
        }
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
