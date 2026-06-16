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

  // Error boundary layout tied safely to system styling metrics
  if (!businessId && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="card-layered max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6">
          <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
            <AlertCircle size={32} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-h3">
              Context Error
            </h2>
            <p className="text-muted text-sm font-medium">
              Workspace verification failed. Re-authentication required for security.
            </p>
          </div>
          <Link href="/terminal" className="w-full">
            <button 
              type="button"
              className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-md"
            >
              Return to Switchboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    /* Flex Layout Engine: 
      Forces absolute boundary containment to isolate child scrolls.
      Stretches horizontally across the terminal block viewport cleanly.
    */
    <div className="absolute inset-0 flex flex-row overflow-hidden">
      
      {/* Registry Grid: Consumes all flexible content space autonomously */}
      <main className="flex-1 h-full overflow-y-auto p-4 lg:p-6 min-w-0">
        <div className="max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="card-layered h-64 bg-card animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="h-[50vh] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/60 rounded-[2.25rem] mt-2 bg-surface/10 p-6">
                  <Package size={48} strokeWidth={1.5} className="mb-4 text-muted/60" aria-hidden="true" />
                  <p className="font-bold uppercase text-xs tracking-widest text-muted">
                    Inventory Empty
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Side-Pinned Cart Container:
        - `w-96`: Locked to a strict 24rem (384px) layout profile.
        - `shrink-0`: Blocks the flex canvas from squishing or altering width metrics.
        - `h-full`: Forces layout execution perfectly from top to bottom of parent panel bounds.
      */}
      <aside className="w-86 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
        <CartSidebar businessId={businessId} />
      </aside>

    </div>
  );
}