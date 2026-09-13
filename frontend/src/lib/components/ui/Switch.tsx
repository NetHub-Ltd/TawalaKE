"use client";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/** Accessible toggle — on uses brand-accent (success/settle). */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  id,
  disabled,
  className,
}: SwitchProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      {(label || description) && (
        <div className="min-w-0">
          {label ? (
            <p id={id ? `${id}-label` : undefined} className="text-sm font-semibold text-foreground">
              {label}
            </p>
          ) : null}
          {description ? <p className="text-xs text-muted">{description}</p> : null}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={id && label ? `${id}-label` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-40",
          checked ? "bg-brand-accent" : "bg-[var(--surface-container-high,#e8e8e8)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-6"
          )}
        />
      </button>
    </div>
  );
}
