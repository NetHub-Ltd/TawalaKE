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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * Architecture: Refactored to Full-Width. Container is now responsive and spans parent.
 * Logic: Added Manual Discount capture (controlled input).
 * UX: Added "Focus Mode" expansion trigger for high-volume orders.
 */

export const CartSidebar = ({ businessId }: { businessId?: string }) => {
  const router = useRouter();
  const {
    cart,
    updateQty,
    clearCart,
    getTotal,
    discount = 0,
    setDiscount,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-card animate-pulse" />;

  const { subtotal, tax, total } = getTotal();

  const handleExpand = () => {
    if (businessId) {
      router.push(`/terminal/${businessId}/cart`);
    }
  };

  return (
    <aside className="w-full h-full bg-card flex flex-col shadow-sm overflow-hidden border border-border/40 rounded-[2.5rem]">
      {/* Header */}
      <div className="p-6 border-b border-border/60 flex items-center justify-between bg-card/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ReceiptText size={20} />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tighter text-lg leading-none">
              Order Manifest
            </h3>
            <p className="text-[10px] text-secondary/50 font-bold uppercase tracking-widest mt-1">
              {cart.length} Line Items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpand}
            className="p-2.5 rounded-xl hover:bg-muted text-secondary/40 transition-all"
            title="Expand to Full Screen"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={clearCart}
            className="p-2.5 rounded-xl hover:bg-red-50 text-secondary/40 hover:text-red-500 transition-all"
            title="Clear Manifest"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Item Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar bg-background/20">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
            <ShoppingCart size={64} strokeWidth={1.5} />
            <p className="font-black uppercase text-[10px] tracking-[0.4em] mt-4">
              Waiting for Items
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/40 shadow-sm transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-bold text-xs truncate uppercase text-foreground">
                  {item.name}
                </p>
                <p className="text-[10px] font-mono text-secondary/60 mt-0.5">
                  Ksh {item.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1 border border-border/10">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-background rounded-lg transition-all active:scale-75"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="text-xs font-black w-6 text-center tabular-nums">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-background rounded-lg transition-all active:scale-75"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>

              <div className="w-24 text-right">
                <p className="font-black text-xs text-foreground italic tabular-nums">
                  Ksh {(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-8 bg-card border-t border-border space-y-4">
        {/* Discount Control */}
        <div className="flex items-center justify-between">
          {isAddingDiscount ? (
            <div className="flex items-center gap-2 w-full animate-in slide-in-from-bottom-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-secondary/40">
                  KSH
                </span>
                <input
                  autoFocus
                  type="number"
                  className="w-full bg-muted border-none rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                  placeholder="0.00"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  onBlur={() => setIsAddingDiscount(false)}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingDiscount(true)}
              className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity"
            >
              <Tag size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {discount > 0 ? `Discount: Ksh ${discount}` : "Apply Discount"}
              </span>
            </button>
          )}
        </div>

        <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-secondary/50">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-foreground">
              Ksh {subtotal.toLocaleString()}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Manual Discount</span>
              <span>- Ksh {discount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center py-4 border-t border-border/40">
          <span className="text-xs font-black uppercase tracking-widest text-primary">
            Total
          </span>
          <span className="text-4xl font-black text-foreground italic tracking-tighter tabular-nums">
            Ksh {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button
          disabled={cart.length === 0}
          className="w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl bg-foreground text-background hover:scale-[1.01] active:scale-95 disabled:opacity-20"
        >
          <CreditCard size={18} />
          Complete Transaction
        </button>
      </div>
    </aside>
  );
};
