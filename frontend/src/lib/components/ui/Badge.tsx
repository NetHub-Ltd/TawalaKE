import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "success" | "warning" | "error" | "sync";
  className?: string;
}

const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-register text-foreground",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[#fdf2f0] text-brand-secondary",
  error: "bg-[var(--error-container)] text-[var(--on-error-container)]",
  sync: "bg-[var(--success-soft)] text-[var(--success)]",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {variant === "sync" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
