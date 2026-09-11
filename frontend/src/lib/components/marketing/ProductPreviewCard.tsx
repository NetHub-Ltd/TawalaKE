/**
 * Decorative product preview for the public homepage.
 * Illustrative only — no live data, no product navigation, no business logic.
 */
import {
  TrendingUp,
  CheckCircle2,
  Banknote,
  AlertTriangle,
} from "lucide-react";

export function ProductPreviewCard() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-4 text-left shadow-lift sm:p-5"
      aria-hidden="true"
    >
      {/* Soft accent glow — purely visual */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-brand-primary/5 blur-2xl" />

      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-accent" />
          </span>
          <span className="text-xs font-bold tracking-wide text-muted uppercase">
            Live shift
          </span>
          <span className="text-border">·</span>
          <span className="text-xs font-semibold text-muted">Cashier Wanjiku</span>
        </div>
        <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-tight text-brand-primary">
          Ndovu POS
        </span>
      </div>

      {/* Metric highlight */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl border border-border/60 bg-background p-3.5">
        <div>
          <span className="mb-0.5 block text-xs font-medium text-muted">
            Today&apos;s net profit
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            KSh 18,450
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-bold text-brand-primary">
            <TrendingUp size={14} aria-hidden="true" />
            +14.2%
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-accent">
            <CheckCircle2 size={13} aria-hidden="true" />
            0 leakages
          </span>
        </div>
      </div>

      {/* Illustrative activity rows */}
      <div className="mt-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/80 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
              <Banknote size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-bold text-foreground">
                  M-Pesa STK push received
                </span>
                <span className="rounded bg-brand-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-accent">
                  Matched
                </span>
              </div>
              <span className="mt-0.5 block truncate text-[11px] text-muted">
                Ref: QHB72KL9 · Till 882103
              </span>
            </div>
          </div>
          <span className="ml-2 shrink-0 text-sm font-extrabold text-brand-accent">
            +KSh 750
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/60 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-100/80 text-red-600">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 truncate">
              <span className="block truncate text-xs font-bold text-red-950">
                Cooking Oil 2L (FreshFri)
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-red-700">
                Automated reorder alert triggered
              </span>
            </div>
          </div>
          <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
            3 left
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">
        Illustrative preview — not live shop data
      </p>
    </div>
  );
}
