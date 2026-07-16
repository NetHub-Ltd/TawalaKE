// "use client";

// import { Package, AlertCircle } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Layout: Side-pinned Cart with independent Grid scrolling.
//  * UX: Optimized for high-throughput retail (Fitts's Law applied to product cards).
//  * Performance: Skeleton loaders prevent layout shift during product fetch.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   const { addToCart } = useCartStore();
//   const { products = [], isLoading } = useProducts(businessId);

//   // Error boundary layout tied safely to system styling metrics
//   if (!businessId && !isLoading) {
//     return (
//       <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
//         <div className="card-layered max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6">
//           <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
//             <AlertCircle size={32} aria-hidden="true" />
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-h3">
//               Context Error
//             </h2>
//             <p className="text-muted text-sm font-medium">
//               Workspace verification failed. Re-authentication required for security.
//             </p>
//           </div>
//           <Link href="/terminal" className="w-full">
//             <button 
//               type="button"
//               className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-md"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     /* Flex Layout Engine: 
//       Forces absolute boundary containment to isolate child scrolls.
//       Stretches horizontally across the terminal block viewport cleanly.
//     */
//     <div className="absolute inset-0 flex flex-row overflow-hidden">
      
//       {/* Registry Grid: Consumes all flexible content space autonomously */}
//       <main className="flex-1 h-full overflow-y-auto p-4 lg:p-6 min-w-0">
//         <div className="max-w-[1600px] mx-auto">
//           {isLoading ? (
//             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
//               {[...Array(8)].map((_, i) => (
//                 <div
//                   key={i}
//                   className="card-layered h-64 bg-card animate-pulse"
//                 />
//               ))}
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
//                 {products.map((product) => (
//                   <ProductCard
//                     key={product.id}
//                     product={product}
//                     onAdd={addToCart}
//                   />
//                 ))}
//               </div>

//               {products.length === 0 && (
//                 <div className="h-[50vh] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/60 rounded-[2.25rem] mt-2 bg-surface/10 p-6">
//                   <Package size={48} strokeWidth={1.5} className="mb-4 text-muted/60" aria-hidden="true" />
//                   <p className="font-bold uppercase text-xs tracking-widest text-muted">
//                     Inventory Empty
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </main>

//       {/* Side-Pinned Cart Container:
//         - `w-96`: Locked to a strict 24rem (384px) layout profile.
//         - `shrink-0`: Blocks the flex canvas from squishing or altering width metrics.
//         - `h-full`: Forces layout execution perfectly from top to bottom of parent panel bounds.
//       */}
//       <aside className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
//         <CartSidebar businessId={businessId} />
//       </aside>

//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { Package, AlertCircle, LayoutGrid, List, Search } from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
import { ProductCard } from "./product-card";

/**
 * @Scribe_Audit
 * Layout: Side-pinned Cart with independent Grid scrolling and persistent layout metrics.
 * UX: Search pattern matching combined with instantaneous structural view mutations.
 * Performance: Synchronized localStorage interaction avoiding hydration mismatches.
 */

interface TerminalCockpitProps {
  businessId: string;
}

export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
  const { addToCart } = useCartStore();
  const { products = [], isLoading } = useProducts(businessId);

  // Layout View States & Search Query Streams
  const [viewMode, setViewMode] = useState<"card" | "row">("card");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Safely hydrate view state configuration from localStorage on client mount
  useEffect(() => {
    const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
    if (savedMode === "card" || savedMode === "row") {
      setViewMode(savedMode);
    }
  }, []);

  // Update selection matrix state and commit to persistent local disk array
  const handleViewChange = (mode: "card" | "row") => {
    setViewMode(mode);
    localStorage.setItem("terminal_view_mode", mode);
  };

  // Filter products inline based on search match criteria
  const filteredProducts = products.filter((product) =>
    product.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Error boundary layout tied safely to system styling metrics
  if (!businessId && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="card-layered max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6">
          <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
            <AlertCircle size={32} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-h3">Context Error</h2>
            <p className="text-muted text-sm font-medium">
              Workspace verification failed. Re-authentication required for security.
            </p>
          </div>
          <Link href="/terminal" className="w-full">
            <button
              type="button"
              className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
            >
              Return to Switchboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-row overflow-hidden">
      
      {/* Registry Canvas Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0 bg-background">
        
        {/* --- HIGH-THROUGHPUT SYSTEM HEADER HUB --- */}
        <div className="p-4 lg:p-6 pb-2 shrink-0 border-b border-border/40 bg-surface/10 flex items-center justify-between gap-4">
          
          {/* Real-time Filter Field Input Section */}
          <div className="relative flex-1 max-w-md">
            <Search 
              size={15} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" 
              aria-hidden="true" 
            />
            <input
              type="text"
              placeholder="Search by product name, SKU, or attribute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl text-xs font-medium bg-card border border-border/40 focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all font-sans"
            />
          </div>

          {/* Persistent Display View Mode Matrix Controls */}
          <div className="flex items-center bg-surface border border-border/40 rounded-xl p-0.5 shrink-0" role="inline-visual-toggle">
            <button
              type="button"
              onClick={() => handleViewChange("card")}
              aria-label="Switch to grid layout view option"
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
                viewMode === "card"
                  ? "bg-card text-brand-primary shadow-xs border border-border/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("row")}
              aria-label="Switch to row list layout view option"
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
                viewMode === "row"
                  ? "bg-card text-brand-primary shadow-xs border border-border/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <List size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* --- PRODUCT DISPLAY CONTENT LAYER --- */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className={viewMode === "card" 
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
                : "flex flex-col gap-2.5"
              }>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`card-layered bg-card animate-pulse border border-border/20 ${
                      viewMode === "card" ? "h-44 rounded-xl" : "h-[4.25rem] rounded-xl"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* Responsive View Grid Layout Toggle Wrapper */}
                <div className={viewMode === "card" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
                  : "flex flex-col gap-2.5"
                }>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={addToCart}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Fallback Screen: Handled elegantly based on content matching matrices */}
                {filteredProducts.length === 0 && (
                  <div className="h-[40vh] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
                    <Package size={40} strokeWidth={1.5} className="mb-3 text-muted/40" aria-hidden="true" />
                    <p className="font-bold uppercase text-[10px] tracking-widest text-muted/80">
                      {products.length === 0 ? "Inventory Empty" : "No Matching Items Found"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Side-Pinned Cart Container Panel */}
      <aside className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
        <CartSidebar businessId={businessId} />
      </aside>

    </div>
  );
}