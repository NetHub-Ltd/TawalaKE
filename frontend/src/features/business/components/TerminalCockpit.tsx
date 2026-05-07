"use client";

import { Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
import { ProductCard } from "./product-card";


/**
 * @Scribe_Audit
 * Layout: Side-pinned Cart with independent Grid scrolling.
 * UX: Optimized for high-throughput retail (Fitts's Law applied to product cards).
 * Performance: Skeleton loaders prevent layout shift during product fetch.
 */

interface TerminalCockpitProps {
  businessId: string;
}

export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
  const { addToCart } = useCartStore();
  const { products = [], isLoading } = useProducts(businessId);

  if (!businessId && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-card p-12 rounded-[3rem] max-w-xl w-full flex flex-col items-center text-center gap-6 shadow-2xl border border-border">
          <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Context Error
            </h2>
            <p className="text-secondary/60 text-sm font-medium">
              Workspace verification failed. Re-authentication required for
              security.
            </p>
          </div>
          <Link href="/terminal" className="w-full">
            <button className="w-full h-16 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
              Return to Switchboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      {/* Registry Grid: Independent Scroll Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-6">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-[2.5rem] bg-card/50 animate-pulse border border-border/40 shadow-sm"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-secondary/20 border-2 border-dashed border-border/40 rounded-[3rem] mt-2">
                  <Package size={64} strokeWidth={1} className="mb-6" />
                  <p className="font-black uppercase text-xs tracking-[0.5em]">
                    Inventory Empty
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Persistence: Side-Pinned Cart */}
      <div className="w-[420px] h-full shrink-0 border-l border-border/60 bg-card/30 backdrop-blur-sm">
        <CartSidebar businessId={businessId} />
      </div>
    </div>
  );
}