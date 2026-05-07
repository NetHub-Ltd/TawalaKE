"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Tag,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * Architecture: Full-page Focus Mode for high-detail checkout.
 * UX: Maximized touch targets for tablet/touch-monitor environments.
 * Logic: Syncs with same useCartStore used in the Sidebar Cockpit.
 */

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;

  const { cart, updateQty, clearCart, getTotal, discount, setDiscount } =
    useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return <div className="h-screen w-full bg-background animate-pulse" />;

  const { subtotal, tax, total } = getTotal();

  if (cart.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-background">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-secondary/20">
          <Receipt size={48} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">
            Manifest Empty
          </h1>
          <p className="text-secondary/60 text-sm font-medium">
            Add items in the cockpit to begin checkout.
          </p>
        </div>
        <Link href={`/terminal/${businessId}`}>
          <button className="flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
            <ArrowLeft size={16} />
            Back to Registry
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="px-10 py-8 border-b border-border/60 flex items-center justify-between bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
              Order Review
            </h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <ShieldCheck size={12} /> Secure Transaction Terminal
            </p>
          </div>
        </div>

        <button
          onClick={clearCart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <Trash2 size={16} /> Clear Order
        </button>
      </header>

      {/* Main Content Split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Detailed Item List */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-8 bg-card border border-border/40 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-sm font-medium text-secondary/60 tabular-nums">
                    Ksh {item.price.toLocaleString()} / unit
                  </p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-2xl border border-border/10">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-12 w-12 flex items-center justify-center bg-card rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      <Minus size={18} strokeWidth={3} />
                    </button>
                    <span className="text-lg font-black w-10 text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-12 w-12 flex items-center justify-center bg-card rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="w-40 text-right">
                    <p className="text-2xl font-black italic text-foreground tabular-nums">
                      Ksh {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Financial Summary Sidebar (Internal to Full Page) */}
        <section className="w-[500px] bg-card border-l border-border/60 p-12 flex flex-col justify-between shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
          <div className="space-y-10">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-secondary/40 border-b border-border pb-4">
              Financial Breakdown
            </h2>

            <div className="space-y-6">
              <div className="flex justify-between text-lg font-bold text-secondary/60">
                <span>Subtotal</span>
                <span className="text-foreground tabular-nums font-black">
                  Ksh {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-secondary/60">
                <span>Service Tax (8%)</span>
                <span className="text-foreground tabular-nums font-black">
                  Ksh {tax.toLocaleString()}
                </span>
              </div>

              {/* Enhanced Discount Block */}
              <div className="pt-6 border-t border-dashed border-border/60">
                {isAddingDiscount ? (
                  <div className="relative animate-in slide-in-from-right-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary">
                      KSH
                    </span>
                    <input
                      autoFocus
                      type="number"
                      className="w-full h-16 bg-muted rounded-2xl pl-14 pr-6 text-xl font-black focus:ring-4 focus:ring-primary/10 border-none transition-all"
                      placeholder="0.00"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      onBlur={() => setIsAddingDiscount(false)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingDiscount(true)}
                    className="w-full h-16 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl flex items-center justify-center gap-3 transition-all text-primary/60 hover:text-primary"
                  >
                    <Tag size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      {discount > 0
                        ? `Manual Discount: Ksh ${discount}`
                        : "Add Discount Override"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Amount Payable
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-secondary/40">KSH</span>
                <span className="text-7xl font-black tracking-tighter italic text-foreground tabular-nums leading-none">
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button className="w-full py-8 bg-foreground text-background rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-foreground/20">
              <CreditCard size={24} />
              Finalize & Print Receipt
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
