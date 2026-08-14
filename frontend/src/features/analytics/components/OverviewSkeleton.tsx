import React from "react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function OverviewSkeleton() {
  return (
    <div
      className="w-full h-full flex flex-col min-h-0 gap-5 p-4 text-foreground"
      aria-label="Loading analytics overview"
      aria-busy="true"
    >
      {/* Range options + shortcuts skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* 3 primary metric cards skeleton */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-3 sm:p-5 bg-card border border-border/40 rounded-2xl flex items-center justify-between gap-2 min-w-0"
          >
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shrink-0" />
          </div>
        ))}
      </section>

      {/* Secondary details strip skeleton */}
      <section className="shrink-0 rounded-2xl border border-border/40 bg-card/80 px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Chart container skeleton */}
      <section className="flex-1 min-h-[220px] bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="w-full h-[120px] rounded-xl" />
        <div className="pt-3 border-t border-border/40 flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </section>
    </div>
  );
}