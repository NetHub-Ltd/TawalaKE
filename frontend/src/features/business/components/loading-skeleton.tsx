import React from "react";

export function BusinessSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-[280px] w-full bg-register animate-pulse rounded-[2rem] border border-border"
        />
      ))}
    </div>
  );
}
