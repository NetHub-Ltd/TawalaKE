"use client";

/**
 * Checkout workspace — order summary (left) + customer/payment form (right).
 * Presentational polish only; stage/finalize contracts unchanged.
 */
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
import { useSales, normalizeLineItems, getSaleItemCount } from "@/features/sales/hooks/useSales";

interface CheckoutWorkspaceProps {
  saleId: string;
  organizationId: string;
  businessId: string;
}

interface LineItem {
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

function formatMoney(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CheckoutWorkspace({
  saleId,
  organizationId,
  businessId,
}: CheckoutWorkspaceProps) {
  const { sales, isLoading, error } = useSales({ businessId, saleId });
  const activeSale = sales[0] ?? null;
  const [itemsOpen, setItemsOpen] = useState(false);

  const terminalHref = `/org/${organizationId}/${businessId}/terminal`;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
        <p className="animate-pulse text-sm text-muted-foreground">
          Loading sale…
        </p>
      </div>
    );
  }

  if (error || !activeSale) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
            Sale not found
          </h2>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            This staged sale could not be loaded. Return to the terminal and try
            again.
          </p>
        </div>
        <Link
          href={terminalHref}
          className="inline-flex h-11 items-center rounded-xl border border-border/60 bg-card px-4 text-xs font-bold tracking-wide uppercase hover:bg-surface"
        >
          Return to terminal
        </Link>
      </div>
    );
  }

  const currency = activeSale.currency || "KES";
  const items: LineItem[] =
    (activeSale.items && activeSale.items.length > 0
      ? activeSale.items
      : normalizeLineItems(
          (activeSale as { sale_items?: unknown; line_items?: unknown })
            .sale_items ??
            (activeSale as { line_items?: unknown }).line_items,
        )) || [];
  const itemCount = Math.max(getSaleItemCount(activeSale), items.length);
  const subtotal = Number(activeSale.subtotal) || 0;
  const taxAmount = Number(activeSale.tax_amount) || 0;
  const discount = Number(activeSale.discount) || 0;
  const grandTotal = Number(activeSale.total_amount) || 0;
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col lg:flex-row">
        {/* ORDER SUMMARY */}
        <section className="border-b border-border/50 bg-card/40 lg:w-[42%] lg:border-r lg:border-b-0">
          {/* Mobile compact summary */}
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left lg:hidden"
            onClick={() => setItemsOpen((v) => !v)}
            aria-expanded={itemsOpen}
          >
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Amount to collect
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {formatMoney(currency, grandTotal)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            {itemsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <div
            className={`${itemsOpen ? "block" : "hidden"} border-t border-border/40 px-4 pb-5 lg:block lg:border-t-0 lg:px-8 lg:py-8`}
          >
            {/* Desktop hero total */}
            <div className="mb-6 hidden rounded-2xl border border-brand-primary/15 bg-brand-primary/5 px-5 py-4 lg:block">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Amount to collect
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {formatMoney(currency, grandTotal)}
              </p>
            </div>

            <p className="mb-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Items ({itemCount})
            </p>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 bg-surface/30 px-3 py-4 text-xs text-muted-foreground">
                Line items could not be loaded for this staged sale. Totals below
                are still from the server — you can complete the sale safely.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li
                    key={`${item.name}-${idx}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {item.quantity} × {formatMoney(currency, item.unit_price)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-foreground">
                      {formatMoney(currency, item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {formatMoney(currency, subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −{formatMoney(currency, discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">
                  {formatMoney(currency, taxAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-mono text-lg font-bold tabular-nums text-foreground">
                  {formatMoney(currency, grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <CheckoutForm
              saleId={activeSale.id}
              grandTotal={grandTotal}
              organizationId={organizationId}
              businessId={businessId}
            />
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Totals from staged sale · cart kept until this sale completes
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
