"use client";

import type { ChangelogEntry, ChangelogItemType } from "@/features/org/lib/product-changelog";
import { Sparkles, Bug, Wrench } from "lucide-react";

const typeMeta: Record<
  ChangelogItemType,
  { label: string; className: string; Icon: typeof Sparkles }
> = {
  feature: {
    label: "New",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
    Icon: Sparkles,
  },
  fix: {
    label: "Fix",
    className: "bg-amber-500/10 text-amber-800 border-amber-500/25",
    Icon: Bug,
  },
  improvement: {
    label: "Improved",
    className: "bg-sky-500/10 text-sky-800 border-sky-500/25",
    Icon: Wrench,
  },
};

export function OrgUpdatesClient({
  entries,
  updatedAt,
}: {
  entries: ChangelogEntry[];
  updatedAt?: string;
}) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">No updates published yet</p>
        <p className="mt-1 text-sm text-muted">
          Product improvements will show up here when they ship.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {updatedAt ? (
        <p className="text-xs text-muted">Last refreshed {updatedAt}</p>
      ) : null}
      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">{entry.title}</h2>
              <time className="text-xs text-muted" dateTime={entry.date}>
                {entry.date}
              </time>
            </div>
            {entry.version ? (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-primary">
                {entry.version}
              </p>
            ) : null}
            <ul className="mt-4 space-y-2">
              {entry.items.map((item, idx) => {
                const meta = typeMeta[item.type] || typeMeta.improvement;
                const Icon = meta.Icon;
                return (
                  <li key={`${entry.id}-${idx}`} className="flex gap-3 text-sm">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                      {meta.label}
                    </span>
                    <span className="text-foreground/90">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
