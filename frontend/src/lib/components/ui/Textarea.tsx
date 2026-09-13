"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted",
          "focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
          error ? "border-[var(--error)]" : "border-border",
          className
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-[var(--error)]">{error}</p> : null}
    </div>
  )
);
Textarea.displayName = "Textarea";
