"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full">
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-12 w-full rounded-md border bg-card px-3 text-sm text-foreground",
          "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
          error ? "border-[var(--error)]" : "border-border",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-[var(--error)]">{error}</p> : null}
    </div>
  )
);
Select.displayName = "Select";
