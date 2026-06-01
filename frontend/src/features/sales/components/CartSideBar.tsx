"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import {useBusinessContext} from "@/features/business/hooks/useBusiness"

/**
 * @Scribe_Audit
 * Aesthetic: Clean, distraction-free minimalist retail panel matching the human-centric vibe.
 * UX: Subdued border accents, elegant layout spacing, and clear action indicators.
 * Architecture: Seamless Zustand sync paired with dynamic checkout route redirects.
 */

export const CartSidebar = ({ businessId }: { businessId?: string }) => {
  const router = useRouter();
  const { cart, updateQty, clearCart, getFinancials, discount, setDiscount } = useCartStore();
  const {organizationId} = useBusinessContext()

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-white/60 border border-slate-100 animate-pulse rounded-[2rem]" />
    );
  }

  // Get precision financials dynamically from updated store definitions
  const { subtotal, taxAmount, grandTotal } = getFinancials();

  const handleExpand = () => {
    if (businessId) {
      router.push(`/org/${organizationId}/terminal/${businessId}/cart`);
    }
  };

  const handleCheckoutRedirect = () => {
    if (cart.length > 0) {
      router.push(`/org/${organizationId}/terminal/${businessId}/checkout`);
    }
  };

  return (
    <aside className="w-full max-w-sm h-full bg-white border-l border-slate-100 flex flex-col overflow-hidden ml-auto relative">
      
      {/* --- CART HEADER ZONE --- */}
      <div className="p-6 pb-4 flex items-center justify-between shrink-0 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
            <ReceiptText size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1e2229]">
              Current Tray
            </h2>
            <p className="text-[10px] text-[#7d859a] font-bold uppercase tracking-wide mt-0.5">
              {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
            </p>
          </div>
        </div>

        {/* Dynamic Context Tool Bar */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            title="Expand Tray View"
            className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 transition-all active:scale-95"
          >
            <Maximize2 size={15} />
          </button>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              title="Clear Tray items"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* --- ITEM STREAM AREA --- */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 custom-scrollbar min-h-0 bg-[#fafbfc]/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <ShoppingCart size={18} />
            </div>
            <p className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
              Tray is empty
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-soft hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-xs text-[#1e2229] truncate tracking-tight">
                  {item.name}
                </p>
                <p className="text-[10px] font-bold text-[#7d859a] mt-0.5">
                  KES {item.price.toLocaleString()}
                </p>
              </div>

              {/* Seamless Quantity Counter Actions */}
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5 mx-2 shrink-0">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="h-6 w-6 flex items-center justify-center hover:bg-white text-slate-500 hover:text-primary rounded-md transition-all active:scale-90"
                >
                  <Minus size={10} strokeWidth={3} />
                </button>
                <span className="text-[11px] font-bold w-6 text-center text-[#1e2229] tabular-nums">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="h-6 w-6 flex items-center justify-center hover:bg-white text-slate-500 hover:text-primary rounded-md transition-all active:scale-90"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-xs text-[#1e2229] tabular-nums">
                  {(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- FINANCIAL DISCOUNTS & SUMMARY BALANCING --- */}
      <div className="p-6 border-t border-slate-100 bg-white space-y-4 shrink-0">
        
        {/* Distraction-Free Adaptive Discount Row */}
        <div className="flex items-center justify-between min-h-[36px] bg-slate-50/50 border border-slate-100/60 rounded-xl px-3 py-1.5">
          {isAddingDiscount ? (
            <div className="relative w-full flex items-center animate-in fade-in slide-in-from-bottom-0.5 duration-200">
              <Tag size={13} className="text-primary absolute left-1" />
              <input
                autoFocus
                type="number"
                min="0"
                className="w-full bg-transparent border-none py-0 pl-6 pr-6 text-xs font-bold text-[#1e2229] focus:outline-none focus:ring-0 placeholder-slate-300"
                placeholder="Enter KES amount"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                onBlur={() => !discount && setIsAddingDiscount(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsAddingDiscount(false)}
              />
              {discount > 0 && (
                <button
                  onClick={() => {
                    setDiscount(0);
                    setIsAddingDiscount(false);
                  }}
                  className="absolute right-0 text-slate-400 hover:text-rose-500 p-1"
                  title="Remove Discount"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAddingDiscount(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 hover:opacity-80 transition-all"
            >
              <Tag size={11} strokeWidth={2.5} />
              {discount > 0 ? `Discount Applied: -KES ${discount.toLocaleString()}` : "Add Discount"}
            </button>
          )}

          {!isAddingDiscount && discount > 0 && (
            <button 
              onClick={() => setDiscount(0)}
              className="text-[9px] font-bold text-rose-500 uppercase hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* Clear Ledger Insets */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-[11px] font-medium text-[#7d859a]">
            <span>Subtotal</span>
            <span className="text-[#1e2229] font-bold tabular-nums">
              KES {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-[11px] font-medium text-[#7d859a]">
            <span>Estimated Tax</span>
            <span className="text-[#1e2229] font-bold tabular-nums">
              KES {taxAmount.toLocaleString()}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-[11px] font-medium text-emerald-600">
              <span>Discount Deducted</span>
              <span className="font-bold tabular-nums">
                -KES {discount.toLocaleString()}
              </span>
            </div>
          )}

          {/* Core Payable Total Anchor */}
          <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-[#1e2229]">
              Total Payable
            </span>
            <div className="text-right">
              <span className="text-lg font-black text-primary tracking-tight tabular-nums">
                KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* --- CHECKOUT REDIRECT ROUTE BUTTON --- */}
        <button
          disabled={cart.length === 0}
          onClick={handleCheckoutRedirect}
          className="w-full h-11 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </aside>
  );
};