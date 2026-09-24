import { cn } from "@/lib/utils";

export type BrandLoaderSize = "sm" | "md" | "lg";

export interface BrandLoaderProps {
  /** Context-aware status line shown under the mark */
  label?: string;
  size?: BrandLoaderSize;
  className?: string;
  /** Optional secondary hint (keep short) */
  hint?: string;
  /**
   * Frosted glass over existing UI — blur only, no color wash.
   * Lets layout outlines remain visible behind the loader.
   */
  overlay?: boolean;
  /** @deprecated Use overlay — kept for callers that used fullScreen */
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
 * Brand loader: light sweep on the logo + gradient sweep on label text.
 * Optional frosted overlay (blur only — no tint) so app chrome stays visible.
 */
export function BrandLoader({
  label = "Loading…",
  size = "md",
  className,
  hint,
  overlay = false,
  fullScreen = false,
}: BrandLoaderProps) {
  const s = sizeMap[size];
  const asOverlay = overlay || fullScreen;

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
      {/* Logo + light sweep */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl",
          s.box,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
        <img
          src="/logo.svg"
          alt=""
          width={64}
          height={64}
          className={cn("relative z-0 object-contain", s.img)}
          draggable={false}
        />
        {/* Neutral light band — no brand color */}
        <div
          className="pointer-events-none absolute inset-0 z-10 animate-logo-shine"
          aria-hidden
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <div className="max-w-xs space-y-1 px-2 text-center">
        <p
          className={cn(
            "font-semibold tracking-tight animate-text-shine",
            s.label,
          )}
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--foreground) 0%, var(--foreground) 40%, rgba(255,255,255,0.95) 50%, var(--foreground) 60%, var(--foreground) 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {label}
        </p>
        {hint ? (
          <p className={cn("font-medium text-muted", s.hint)}>{hint}</p>
        ) : null}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (asOverlay) {
    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-transparent"
        aria-busy="true"
        aria-live="polite"
      >
        {body}
      </div>
    );
  }

  return body;
}
