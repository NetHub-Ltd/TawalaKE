"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Shows KSh prefix for money fields */
  currency?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, currency, error, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-12 w-full rounded-md border bg-card px-3 text-sm text-foreground placeholder:text-muted",
          "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
          "disabled:opacity-50",
          error ? "border-[var(--error)] focus:ring-[var(--error)]/30" : "border-border",
          currency && "pl-12 amount",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="w-full">
        {currency ? (
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
              KSh
            </span>
            {input}
          </div>
        ) : (
          input
        )}
        {error ? <p className="mt-1 text-xs text-[var(--error)]">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = "Input";
