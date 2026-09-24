import { cn } from "@/lib/utils";

export type BrandLoaderSize = "sm" | "md" | "lg";

export interface BrandLoaderProps {
  /** Context-aware status line shown under the mark */
  label?: string;
  size?: BrandLoaderSize;
  className?: string;
  /** Optional secondary hint (keep short) */
  hint?: string;
  /** Full-viewport centered layout */
  fullScreen?: boolean;
}

const sizeMap: Record<
  BrandLoaderSize,
  { box: string; img: string; label: string; hint: string }
> = {
  sm: { box: "h-10 w-10", img: "h-7 w-7", label: "text-xs", hint: "text-[10px]" },
  md: { box: "h-16 w-16", img: "h-11 w-11", label: "text-sm", hint: "text-xs" },
  lg: { box: "h-24 w-24", img: "h-16 w-16", label: "text-base", hint: "text-xs" },
};

/**
 * Brand pulse loader — soft scale + opacity on the Tawala mark.
 * Respects prefers-reduced-motion (static mark).
 */
export function BrandLoader({
  label = "Loading…",
  size = "md",
  className,
  hint,
  fullScreen = false,
}: BrandLoaderProps) {
  const s = sizeMap[size];

  const body = (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl",
          s.box,
        )}
      >
        {/* Soft brand glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-brand-primary/10 blur-md animate-brand-pulse"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
        <img
          src="/logo.svg"
          alt=""
          width={64}
          height={64}
          className={cn(
            "relative object-contain animate-brand-pulse",
            s.img,
          )}
          draggable={false}
        />
      </div>
      <div className="text-center space-y-1 max-w-xs px-2">
        <p className={cn("font-semibold text-foreground tracking-tight", s.label)}>
          {label}
        </p>
        {hint ? (
          <p className={cn("text-muted font-medium", s.hint)}>{hint}</p>
        ) : null}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-background p-6">
        {body}
      </div>
    );
  }

  return body;
}
