import React from "react";

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-border/40 ${className}`} aria-hidden />;
}

/** Layout-stable skeleton — matches overview chrome, no center shrink. */
export function OverviewSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col gap-3 px-1 pb-3 pt-1 sm:px-2"
      aria-busy
      aria-label="Loading overview"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex gap-1">
          <Bone className="h-8 w-16" />
          <Bone className="h-8 w-20" />
          <Bone className="h-8 w-14" />
        </div>
        <div className="flex gap-1.5">
          <Bone className="h-8 w-36 rounded-full" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="min-h-[88px]" />
        ))}
      </div>
      <div className="grid min-h-[480px] flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <Bone className="min-h-[240px]" />
        <Bone className="min-h-[240px]" />
      </div>
    </div>
  );
}
