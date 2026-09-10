"use client";

import React from "react";
import type { InsightCard } from "@/features/analytics/hooks/useDashboardData";

const severityDot: Record<string, string> = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
};

export function InsightsStrip({ insights }: { insights: InsightCard[] }) {
  if (!insights?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-card px-4 py-3 text-sm text-muted">
        No insights for this period yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Insights</p>
      <ul className="mt-3 space-y-2">
        {insights.slice(0, 5).map((ins) => (
          <li key={ins.code + ins.title} className="flex gap-2 text-sm text-slate-700">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[ins.severity] || "bg-slate-400"}`}
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">{ins.title}</span>
              {ins.detail ? <span className="text-muted"> — {ins.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
