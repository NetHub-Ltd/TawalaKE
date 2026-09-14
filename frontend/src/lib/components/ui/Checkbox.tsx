"use client";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id || `cb-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className={cn("flex items-center gap-2 text-sm text-foreground", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-border accent-[var(--brand-primary)]"
        {...props}
      />
      {label}
    </label>
  );
}
