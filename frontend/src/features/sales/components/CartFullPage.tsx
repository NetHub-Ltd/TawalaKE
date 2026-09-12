"use client";

/**
 * Full-page cart — same store + stage path as sidebar tray.
 * Touch-friendly layout for tablet / expanded review before checkout.
 */
import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Loader2,
  Tag,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { fetchPosConfig } from "@/features/sales/lib/posConfig";
import { setStagedSaleId } from "@/features/sales/lib/stagedSale";

export function CartFullPage({
  organizationId: orgProp,
  businessId: businessProp,
}: {
  organizationId?: string;
  businessId?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { organizationId: ctxOrg, businessId: ctxBiz } = useBusinessContext();

  const resolvedOrgId = orgProp || (Array.isArray(ctxOrg) ? ctxOrg[0] : ctxOrg);
  const resolvedBusinessId =
    businessProp || (Array.isArray(ctxBiz) ? ctxBiz[0] : ctxBiz);
  const userId = session?.user?.id;

  const {
    cart,
    updateQty,
    removeFromCart,
    clearCart,
    getFinancials,
    discount,
    setDiscount,
    validateAndSetScope,
    setTaxRate,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const discountId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && resolvedBusinessId && userId) {
      validateAndSetScope(resolvedBusinessId, userId);
    }
  }, [mounted, resolvedBusinessId, userId, validateAndSetScope]);

  useEffect(() => {
    if (!mounted || !resolvedBusinessId) return;
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchPosConfig(resolvedBusinessId);
        if (!cancelled) setTaxRate(cfg.tax_rate);
      } catch {
        /* server applies tax on stage */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, resolvedBusinessId, setTaxRate]);

  if (!mounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading cart…
      </div>
    );
  }

  const { subtotal, taxAmount, grandTotal } = getFinancials();
  const terminalHref = `/org/${resolvedOrgId}/${resolvedBusinessId}/terminal`;
  const isEmpty = cart.length === 0;

  async function stageAndCheckout() {
    if (isEmpty || !resolvedBusinessId || !resolvedOrgId) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Staging transaction…");
    try {
      const response = await fetch(`/api/v1/org/stores/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: resolvedBusinessId,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
          })),
          discount: discount || 0,
          service: null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.detail || errorData?.error || "Failed to stage sale",
        );
      }
      const pendingSaleData = await response.json();
      toast.success("Order staged", {
        id: toastId,
        description: `KES ${grandTotal.toLocaleString()}`,
      });
      if (pendingSaleData?.id) {
        setStagedSaleId(resolvedBusinessId, pendingSaleData.id);
      }
      router.push(
        `/org/${resolvedOrgId}/${resolvedBusinessId}/checkout?sale_id=${pendingSaleData.id}`,
      );
    } catch (e) {
      toast.error("Checkout staging failed", {
        id: toastId,
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href={terminalHref}
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to terminal
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <ShoppingCart className="h-5 w-5 text-brand-primary" />
            Cart
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEmpty
              ? "No items yet"
              : `${cart.length} line${cart.length === 1 ? "" : "s"} · review before checkout`}
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => {
              clearCart();
              toast.info("Cart cleared");
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 px-3 text-xs font-semibold text-muted-foreground hover:bg-surface"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">Cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add products from the terminal, then return here to review.
          </p>
          <Link
            href={terminalHref}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white"
          >
            Open terminal
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card">
            {cart.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    KES {item.price.toLocaleString()} each
                    {item.sku ? ` · ${item.sku}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border border-border/60 bg-background">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      aria-label={`Decrease ${item.name}`}
                      onClick={() => updateQty(item.id, -1)}
                      className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center font-mono text-sm font-semibold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      aria-label={`Increase ${item.name}`}
                      onClick={() => updateQty(item.id, 1)}
                      className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="min-w-[5.5rem] text-right font-mono text-sm font-bold tabular-nums">
                    KES {(item.price * item.qty).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => removeFromCart(item.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <label
                htmlFor={discountId}
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                <Tag className="h-3.5 w-3.5" />
                Discount (KES)
              </label>
              <button
                type="button"
                onClick={() => setIsAddingDiscount((v) => !v)}
                className="text-xs font-semibold text-brand-primary"
              >
                {isAddingDiscount || discount > 0 ? "Edit" : "Add"}
              </button>
            </div>
            {(isAddingDiscount || discount > 0) && (
              <input
                id={discountId}
                type="number"
                min={0}
                step="any"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="mb-4 h-11 w-full rounded-xl border border-border/60 bg-background px-3 font-mono text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">
                  KES {subtotal.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Tax</dt>
                <dd className="tabular-nums">
                  KES {taxAmount.toLocaleString()}
                </dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">
                    −KES {discount.toLocaleString()}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-border/50 pt-3">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-mono text-xl font-bold tabular-nums text-foreground">
                  KES {grandTotal.toLocaleString()}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={isSubmitting || isEmpty}
              onClick={() => void stageAndCheckout()}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Staging…
                </>
              ) : (
                <>
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
