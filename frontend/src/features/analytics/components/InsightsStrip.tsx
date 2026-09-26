"use client";

import React from "react";
import type { InsightCard } from "@/features/analytics/hooks/useDashboardData";

/** Semantic severity dots — no raw palette utilities. */
const severityDot: Record<string, string> = {
  info: "bg-brand-primary",
  warning: "bg-brand-accent",
  critical: "bg-[color:var(--error)]",
};

export function InsightsStrip({
  insights,
  loading,
}: {
  insights?: InsightCard[];
  loading?: boolean;
}) {
  if (loading && !insights?.length) {
    return (
      <div className="h-16 animate-pulse rounded-md border border-border/40 bg-border/30" />
    );
  }

  if (!insights?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-border/50 bg-card p-4 shadow-card">
      <p className="text-xs font-semibold tracking-wide text-muted">Insights</p>
      <ul className="mt-3 space-y-2">
        {insights.slice(0, 5).map((ins) => (
          <li
            key={ins.code + ins.title}
            className="flex gap-2 text-sm text-muted"
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                severityDot[ins.severity] || "bg-muted"
              }`}
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">{ins.title}</span>
              {ins.detail ? (
                <span className="text-muted"> — {ins.detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
