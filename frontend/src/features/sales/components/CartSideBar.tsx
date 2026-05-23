
"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  ReceiptText,
  Maximize2,
  Tag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/sales/stores/useCartStore";

/**
 * @Scribe_Audit
 * Aesthetic: Refactored for a "Soft-Native" desktop feel. Reduced width to 380px max.
 * UX: Subdued item borders; focus on clean typography and depth via shadow-soft.
 * Performance: Memoized sub-components would be the next step for massive manifests.
 */

export const CartSidebar = ({ businessId }: { businessId?: string }) => {
  const router = useRouter();
  const { cart, updateQty, clearCart, getTotal, discount, setDiscount } =
    useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <div className="w-full h-full bg-card animate-pulse rounded-[2.5rem]" />
    );

  const { subtotal, tax, total } = getTotal();

  const handleExpand = () => {
    if (businessId) {
      router.push(`/terminal/${businessId}/cart`);
    }
  };

  return (
    <aside className="w-full max-w-86 h-full bg-card flex flex-col shadow-soft overflow-hidden ml-auto">
      {/* Header: Identity */}
      <div className="p-8 pb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary shadow-inner">
            <ReceiptText size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Current Order
            </h2>
            <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-[0.2em] mt-0.5">
              {cart.length} items scanned
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            className="p-3 rounded-full hover:bg-muted text-secondary/30 transition-all active:scale-90"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={clearCart}
            className="p-3 rounded-full hover:bg-red-50 text-secondary/30 hover:text-red-500 transition-all active:scale-90"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Cart Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-4 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 grayscale">
            <ShoppingCart size={80} strokeWidth={1} />
            <p className="font-black uppercase text-[10px] tracking-[0.5em] mt-6">
              Empty Tray
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-5 bg-background/40 rounded-[2rem] border border-transparent hover:border-primary/5 hover:bg-background transition-all duration-300"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs uppercase text-foreground/80 tracking-tight leading-none mb-1">
                  {item.name}
                </p>
                <p className="text-[10px] font-mono text-secondary/40">
                  Ksh {(item.price ?? 0).toLocaleString()}
                </p>
              </div>

              {/* Quantity Interaction */}
              <div className="flex items-center gap-1 bg-muted/40 rounded-full p-1 mx-4">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-card rounded-full transition-all active:scale-75 shadow-sm"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="text-[11px] font-black w-7 text-center tabular-nums">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-card rounded-full transition-all active:scale-75 shadow-sm"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>

              <div className="text-right">
                <p className="font-black text-sm text-foreground italic tabular-nums">
                  {((item.price ?? 0) * item.qty).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Financial Summary */}
      <div className="p-10 bg-muted/20 space-y-6 shrink-0">
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-secondary/40">
            <span>Subtotal</span>
            <span className="text-foreground/60 tabular-nums">
              Ksh {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-secondary/40">
            <span>Tax (8%)</span>
            <span className="text-foreground/60 tabular-nums">
              Ksh {tax.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isAddingDiscount ? (
              <div className="relative w-full animate-in fade-in slide-in-from-bottom-1">
                <input
                  autoFocus
                  type="number"
                  className="w-full bg-background border-none rounded-2xl py-3 pl-12 pr-10 text-xs font-black focus:ring-2 focus:ring-primary/10 shadow-inner"
                  placeholder="0.00"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  onBlur={() => !discount && setIsAddingDiscount(false)}
                />
                <Tag
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                />
                {discount > 0 && (
                  <button
                    onClick={() => {
                      setDiscount(0);
                      setIsAddingDiscount(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAddingDiscount(true)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 hover:opacity-60 transition-all"
              >
                <Tag size={12} strokeWidth={3} />
                {discount > 0 ? `Discounted: -Ksh ${discount}` : "Add Discount"}
              </button>
            )}
          </div>
        </div>

        {/* The Payable Section (Visual Anchor) */}
        <div className="pt-6 border-t border-color-border/10">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1">
              Payable
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-secondary/30 italic">
                KSH
              </span>
              <span className="text-2xl font-black text-foreground tracking-tighter tabular-nums leading-none">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          className="w-full py-2 rounded-[2.5rem] bg-foreground text-background font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-10 disabled:grayscale"
        >
          {/* <CreditCard size={20} strokeWidth={1.5} /> */}
          Complete Transaction
        </button>
      </div>
    </aside>
  );
};