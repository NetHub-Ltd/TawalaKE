"use client";

import React, { useEffect, useState, useCallback, useId } from "react";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ReceiptText,
  Maximize2,
  Tag,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * @Scribe_Audit
 * Architecture: Tenant-scoped React Client Component with session-based isolation verification.
 * Accessibility: WCAG AA compliant with keyboard-accessible controls and screen reader live regions.
 * Performance: Tabular numeric layout preventing cumulative layout shifts (CLS) on rapid price streams.
 */

interface EditableQuantityProps {
  itemId: string;
  currentQty: number;
  updateQty: (id: string, delta: number) => void;
  disabled?: boolean;
}

const EditableQuantity = ({ itemId, currentQty, updateQty, disabled }: EditableQuantityProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentQty.toString());
  const inputId = useId();

  useEffect(() => {
    if (!isEditing) {
      setValue(currentQty.toString());
    }
  }, [currentQty, isEditing]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    const parsedValue = parseFloat(value);

    if (isNaN(parsedValue) || parsedValue <= 0) {
      setValue(currentQty.toString());
      return;
    }

    const delta = parsedValue - currentQty;
    if (delta !== 0) {
      updateQty(itemId, delta);
    }
  }, [value, currentQty, itemId, updateQty]);

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        <label htmlFor={inputId} className="sr-only">Edit item quantity</label>
        <input
          id={inputId}
          type="number"
          step="any"
          min="0.001"
          autoFocus
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommit();
            if (e.key === "Escape") {
              setValue(currentQty.toString());
              setIsEditing(false);
            }
          }}
          className="w-16 h-8 text-center text-xs font-bold font-mono bg-background border-2 border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none animate-in fade-in zoom-in-95 duration-100"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      title="Click to enter explicit item quantity"
      aria-label={`Current quantity ${currentQty}. Click to enter manual quantity.`}
      className="text-xs font-bold min-w-[36px] h-8 px-1 text-center text-foreground hover:text-brand-primary hover:bg-background/80 rounded tabular-nums font-mono transition-all border border-transparent hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 flex items-center justify-center select-none cursor-pointer disabled:opacity-50"
    >
      {currentQty}
    </button>
  );
};

export const CartSidebar = ({ businessId: explicitBusinessId }: { businessId?: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { organizationId, businessId: contextBusinessId } = useBusinessContext();

  // Extract string safe identifiers for multi-tenant scope guards
  const resolvedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;
  const resolvedBusinessId = explicitBusinessId || (Array.isArray(contextBusinessId) ? contextBusinessId[0] : contextBusinessId);
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
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Multi-Tenant Isolation Enforcement: Auto-purges cross-user state mismatch
  useEffect(() => {
    if (mounted && resolvedBusinessId && userId) {
      validateAndSetScope(resolvedBusinessId, userId);
    }
  }, [mounted, resolvedBusinessId, userId, validateAndSetScope]);

  if (!mounted) {
    return (
      <aside 
        className="w-full h-full bg-card animate-pulse border-l border-border/40" 
        aria-hidden="true"
      />
    );
  }

  const { subtotal, taxAmount, grandTotal } = getFinancials();

  const handleExpand = () => {
    if (resolvedBusinessId && resolvedOrgId) {
      router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/cart`);
    }
  };

  const handleClearCartWithFeedback = () => {
    clearCart();
    toast.info("Cart Reset", {
      description: "All pending terminal items have been cleared.",
    });
  };

  const handleCheckoutRedirect = async () => {
    if (cart.length === 0 || !resolvedBusinessId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const toastId = toast.loading("Staging transaction...", {
      description: "Reserving stock allocations and generating database entry.",
    });

    const payload = {
      business_id: resolvedBusinessId,
      user_id: userId,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
      })),
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Failed to establish pending order entry.");
      }

      const pendingSaleData = await response.json();

      toast.success("Order staged successfully", {
        id: toastId,
        description: `Sale ID: ${pendingSaleData.id.slice(0, 8)} • Total KES ${grandTotal.toLocaleString()}`,
      });

      clearCart();
      router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/checkout?sale_id=${pendingSaleData.id}`);
    } catch (error: any) {
      console.error("Checkout Submission Error:", error);
      const fallbackMsg = error?.message || "Operational pipeline error. Please try again.";
      setSubmitError(fallbackMsg);

      toast.error("Checkout staging failed", {
        id: toastId,
        description: fallbackMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside 
      className="w-full h-full bg-card border-l border-border/40 flex flex-col overflow-hidden relative select-none"
      aria-label="Active Checkout Tray Summary"
    >
      {/* CART HEADER */}
      <header className="p-4 lg:p-5 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
            <ReceiptText size={18} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground leading-none">
              Current Sale
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1 block">
              {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExpand}
            title="Expand Tray View"
            aria-label="Expand Cart View"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-primary hover:bg-surface/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            <Maximize2 size={16} aria-hidden="true" />
          </button>
          {cart.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClearCartWithFeedback}
              title="Clear Tray items"
              aria-label="Clear All Cart Items"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* ITEM STREAM AREA */}
      <div 
        className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 flex flex-col gap-3 min-h-0 bg-surface/10"
        aria-live="polite"
        aria-atomic="false"
      >
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-14 w-14 bg-surface/60 border border-border/40 rounded-2xl flex items-center justify-center text-muted-foreground shadow-xs">
              <ShoppingCart size={22} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-black uppercase text-xs tracking-widest text-foreground">
                Tray is empty
              </p>
              <p className="text-[11px] text-muted-foreground max-w-[180px]">
                Select products from the catalog to build a transaction.
              </p>
            </div>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-3.5 bg-background border border-border/40 rounded-2xl shadow-xs hover:border-brand-primary/30 transition-all duration-200"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-xs text-foreground truncate tracking-tight">
                  {item.name}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 font-mono tabular-nums">
                  KES {item.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center bg-surface border border-border/40 rounded-xl p-1 mx-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateQty(item.id, -1)}
                  aria-label={`Decrease quantity for ${item.name}`}
                  className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <Minus size={12} strokeWidth={2.5} aria-hidden="true" />
                </button>

                <EditableQuantity
                  itemId={item.id}
                  currentQty={item.qty}
                  updateQty={updateQty}
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateQty(item.id, 1)}
                  aria-label={`Increase quantity for ${item.name}`}
                  className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-1 text-right">
                <p className="font-black text-xs text-foreground tabular-nums font-mono">
                  {(item.price * item.qty).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => removeFromCart(item.id)}
                  title="Remove Item"
                  aria-label={`Remove ${item.name} from cart`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-brand-accent transition-opacity cursor-pointer disabled:opacity-0"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FINANCIAL SUMMARY & ACTIONS */}
      <footer className="p-4 lg:p-5 border-t border-border/40 bg-card space-y-3.5 shrink-0 shadow-lg">
        <div className="flex items-center justify-between min-h-[44px] bg-surface border border-border/40 rounded-xl px-3 py-1.5">
          {isAddingDiscount ? (
            <div className="relative w-full flex items-center animate-in fade-in slide-in-from-bottom-0.5 duration-200">
              <Tag size={14} className="text-brand-primary absolute left-2" aria-hidden="true" />
              <input
                autoFocus
                disabled={isSubmitting}
                type="number"
                min="0"
                className="w-full bg-transparent border-none py-1 pl-7 pr-7 text-xs font-bold text-foreground focus:outline-none focus:ring-0 placeholder-muted-foreground font-mono disabled:opacity-50"
                placeholder="Discount amount"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                onBlur={() => !discount && setIsAddingDiscount(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsAddingDiscount(false);
                    if (discount > 0) {
                      toast.success("Discount Applied", {
                        description: `Deducted KES ${discount.toLocaleString()} from grand total.`,
                      });
                    }
                  }
                }}
              />
              {discount > 0 && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscount(0);
                    setIsAddingDiscount(false);
                    toast.info("Discount Removed");
                  }}
                  className="absolute right-1 text-muted-foreground hover:text-brand-accent p-1.5 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Remove Discount"
                  aria-label="Remove Discount"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddingDiscount(true)}
              className="text-[11px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[44px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg px-1"
            >
              <Tag size={13} strokeWidth={2.5} aria-hidden="true" />
              {discount > 0 ? `Discount: -KES ${discount.toLocaleString()}` : "Add Discount"}
            </button>
          )}

          {!isAddingDiscount && discount > 0 && !isSubmitting && (
            <button
              type="button"
              onClick={() => {
                setDiscount(0);
                toast.info("Discount Reset");
              }}
              className="text-[10px] font-bold text-brand-accent uppercase hover:underline cursor-pointer min-h-[32px] px-2 flex items-center"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-2 pt-0.5">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-bold tabular-nums font-mono">
              KES {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>Estimated Tax</span>
            <span className="text-foreground font-bold tabular-nums font-mono">
              KES {taxAmount.toLocaleString()}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-[11px] font-bold text-brand-accent bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20">
              <span>Discount Deducted</span>
              <span className="tabular-nums font-mono">
                -KES {discount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-border/60">
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              Total Payable
            </span>
            <span className="text-lg font-black text-brand-primary tracking-tight tabular-nums font-mono">
              KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="p-3 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent font-bold text-center animate-in fade-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={cart.length === 0 || isSubmitting}
          onClick={handleCheckoutRedirect}
          className="group w-full min-h-[48px] rounded-xl bg-brand-primary text-background font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 active:scale-[0.99] transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Staging Order...</span>
            </>
          ) : (
            <>
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </footer>
    </aside>
  );
};