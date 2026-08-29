"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
import { useSales } from "@/features/sales/hooks/useSales";

/* -------------------------------------------------------------------------- */
/* Types – match the real API response                                        */
/* -------------------------------------------------------------------------- */

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

interface _Sale {
  id: string;
  currency: string;
  status: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  business?: { id: string; name: string };
  cashier?: { id: string; full_name: string };
  customer?: { id: string; name: string; phone: string };
  items: LineItem[];
}


/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatMoney(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CheckoutWorkspace({
  saleId,
  organizationId,
  businessId,
}: CheckoutWorkspaceProps) {
  const { sales, isLoading, error } = useSales({ businessId, saleId });

  // The hook returns { items: _Sale[], meta } when a saleId is provided
  const activeSale = sales[0] ?? null;

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="h-dvh w-full bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading sale...
        </p>
      </div>
    );
  }

  /* ---------- Error / not found ---------- */
  if (error || !activeSale) {
    return (
      <div className="h-dvh w-full bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold">Couldn’t load this sale</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {error?.message || "Please go back and try again."}
          </p>
        </div>
        <Link
          href={`/org/${organizationId}/${businessId}/terminal`}
          className="mt-2 h-11 px-5 rounded-xl bg-brand-primary text-white text-sm font-medium flex items-center justify-center"
        >
          Back to counter
        </Link>
      </div>
    );
  }

  /* ---------- Derived values (simple & direct) ---------- */
  const currency = activeSale.currency || "KES";
  const lineItems = activeSale.items ?? [];
  const subtotal = Number(activeSale.subtotal) || 0;
  const taxAmount = Number(activeSale.tax_amount) || 0;
  const discount = Number(activeSale.discount) || 0;
  const grandTotal = Number(activeSale.total_amount) || subtotal + taxAmount - discount;

  /* ---------- Render ---------- */
  return (
    <div className="h-dvh w-full bg-background flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT – Summary (what the cashier needs to see) */}
        <section className="flex flex-col justify-center lg:border-r border-border/60 px-8 overflow-y-auto">
          <div className="w-full max-w-sm mx-auto space-y-8">
            {/* Big amount */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Amount to collect
              </p>
              <p className="text-4xl font-semibold tracking-tight tabular-nums">
                {formatMoney(currency, grandTotal)}
              </p>
            </div>

            {/* Line items */}
            {lineItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items ({lineItems.length})
                </p>
                <div className="space-y-2.5">
                  {lineItems.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className="flex justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {item.quantity} × {formatMoney(currency, item.unit_price)}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatMoney(currency, item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-border/60 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatMoney(currency, subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatMoney(currency, taxAmount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatMoney(currency, discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-border/70">
                <span className="font-medium">Total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatMoney(currency, grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT – Checkout form */}
        <section className="flex flex-col justify-center px-8 py-10 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            <CheckoutForm
              saleId={activeSale.id}          // ← guaranteed to exist here
              grandTotal={grandTotal}
              organizationId={organizationId}
              businessId={businessId}
            />
          </div>
        </section>
      </main>
    </div>
  );
}