"use client";

/**
 * Checkout workspace — order summary (left) + customer/payment form (right).
 * Presentational polish only; stage/finalize contracts unchanged.
 */
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
import { clearStagedSaleId } from "@/features/sales/lib/stagedSale";
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
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const terminalHref = `/org/${organizationId}/${businessId}/terminal`;

  const cancelStagedAndReturn = useCallback(async () => {
    if (!businessId || !saleId || cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/v1/org/stores/sales/${saleId}/cancel-staged?businessId=${encodeURIComponent(businessId)}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { detail?: string; error?: string })?.detail ||
            (body as { error?: string })?.error ||
            "Could not cancel staged sale",
        );
      }
      clearStagedSaleId(businessId);
      toast.success("Staged sale cancelled");
      router.push(terminalHref);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
      setCancelling(false);
    }
  }, [businessId, saleId, cancelling, router, terminalHref]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
        <p className="animate-pulse text-sm text-muted">
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
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
            This staged sale could not be loaded. Return to the terminal and try
            again.
          </p>
        </div>
        <Link
          href={terminalHref}
          className="inline-flex h-11 items-center rounded-md border border-border/60 bg-card px-4 text-xs font-bold tracking-wide uppercase hover:bg-surface"
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
  // Backend stores subtotal post-discount; recover goods for honest labels
  const netSubtotal = Number(activeSale.subtotal) || 0;
  const taxAmount = Number(activeSale.tax_amount) || 0;
  const discount = Number(activeSale.discount) || 0;
  const goodsSubtotal = netSubtotal + discount;
  const grandTotal = Number(activeSale.total_amount) || 0;
  const rawServices = (activeSale as { service_amount?: unknown }).service_amount;
  const serviceLines: { description: string; amount: number }[] = (() => {
    if (!rawServices) return [];
    if (Array.isArray(rawServices)) {
      return rawServices
        .filter((s) => s && typeof s === "object")
        .map((s) => {
          const o = s as { description?: string; amount?: number };
          return {
            description: String(o.description || "").trim(),
            amount: Number(o.amount) || 0,
          };
        })
        .filter((s) => s.description && s.amount > 0);
    }
    if (typeof rawServices === "object") {
      const o = rawServices as { description?: string; amount?: number };
      const description = String(o.description || "").trim();
      const amount = Number(o.amount) || 0;
      return description && amount > 0 ? [{ description, amount }] : [];
    }
    return [];
  })();
  const servicesTotal = serviceLines.reduce((s, x) => s + x.amount, 0);
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
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                Amount to collect
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {formatMoney(currency, grandTotal)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            {itemsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted" />
            )}
          </button>

          <div
            className={`${itemsOpen ? "block" : "hidden"} border-t border-border/40 px-4 pb-5 lg:block lg:border-t-0 lg:px-8 lg:py-8`}
          >
            {/* Desktop hero total */}
            <div className="mb-6 hidden rounded-md border border-brand-primary/15 bg-brand-primary/5 px-5 py-4 lg:block">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                Amount to collect
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {formatMoney(currency, grandTotal)}
              </p>
            </div>

            <p className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">
              Items ({itemCount})
            </p>
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 bg-surface/30 px-3 py-4 text-xs text-muted">
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
                      <p className="text-xs text-muted tabular-nums">
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
              <div className="flex justify-between text-muted">
                <span>Items</span>
                <span className="tabular-nums">
                  {formatMoney(currency, goodsSubtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −{formatMoney(currency, discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Tax</span>
                <span className="tabular-nums">
                  {formatMoney(currency, taxAmount)}
                </span>
              </div>
              {serviceLines.map((s) => (
                <div
                  key={`${s.description}-${s.amount}`}
                  className="flex justify-between text-muted"
                >
                  <span className="truncate pr-2">{s.description}</span>
                  <span className="tabular-nums shrink-0">
                    +{formatMoney(currency, s.amount)}
                  </span>
                </div>
              ))}
              {servicesTotal > 0 && serviceLines.length === 0 ? (
                <div className="flex justify-between text-muted">
                  <span>Services</span>
                  <span className="tabular-nums">
                    +{formatMoney(currency, servicesTotal)}
                  </span>
                </div>
              ) : null}
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
        <section className="flex flex-1 flex-col justify-center px-4 py-4 sm:px-8 ">
          <div className="mx-auto w-full max-w-md">
            <CheckoutForm
              saleId={activeSale.id}
              grandTotal={grandTotal}
              organizationId={organizationId}
              businessId={businessId}
            />
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => void cancelStagedAndReturn()}
                className="text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel staged sale & return to terminal"}
              </button>
              <p className="text-center text-xs text-muted">
                Totals from staged sale · abandon cancels the pending sale
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
