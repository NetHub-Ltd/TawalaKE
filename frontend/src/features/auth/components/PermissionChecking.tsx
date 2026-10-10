"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared skeleton while session/RBAC hydrates — never show deny UI during this. */
export function PermissionChecking({
  className,
  label = "Checking access…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[8rem] flex-1 flex-col items-center justify-center gap-2 p-8 text-sm text-muted",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand-primary" aria-hidden />
      <p>{label}</p>
    </div>
  );
}
