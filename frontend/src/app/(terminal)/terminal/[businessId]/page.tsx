// "use client";

// import { useState } from "react";
// import {
//   Package,
//   LayoutGrid,
// } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import Link from "next/link";
// // import { useBusinessContext } from "./layout";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// // --- CONSTANTS ---
// const CATEGORIES = ["All", "Beverages", "Food", "Services", "Retail"];

// // --- UI SUB-COMPONENTS ---

// const SidebarItem = ({ icon: Icon, active, onClick }: any) => (
//   <button
//     onClick={onClick}
//     className={cn(
//       "p-4 rounded-2xl transition-all",
//       active
//         ? "bg-primary text-white shadow-soft"
//         : "text-secondary hover:bg-card hover:text-foreground",
//     )}
//   >
//     <Icon size={24} />
//   </button>
// );

// const ProductCard = ({ product, onAdd }: any) => (
//   <button
//     onClick={() => onAdd(product)}
//     className="group h-48 relative flex flex-col text-left bg-card border border-border rounded-4xl p-5 transition-all hover:shadow-soft hover:border-primary/40 active:scale-95"
//   >
//     <div className="flex justify-between items-start mb-2">
//       <div className="h-12 w-12 rounded-2xl bg-background group-hover:bg-primary/10 flex items-center justify-center transition-colors">
//         <Package
//           size={24}
//           className="group-hover:text-primary text-secondary"
//         />
//       </div>
//       <span className="text-[10px] font-black text-secondary bg-background px-3 py-1 rounded-full uppercase">
//         {product.stock} in stock
//       </span>
//     </div>
//     <div className="flex-1 flex flex-col justify-end">
//       <h3 className="font-bold text-foreground text-base mb-1">
//         {product.name}
//       </h3>
//       <p className="text-2xl text-foreground font-bold leading-none">
//         Kshs. {product.price.toFixed(2)}
//       </p>
//     </div>
//   </button>
// );

// // --- MAIN TERMINAL VIEW ---

// export default function TerminalCockpit() {
//   const { addToCart } = useCartStore(); // Using your Zustand store
//   // const businessId = searchParams.get("businessId");
//   const businessId = useBusinessContext()?.businessId; // Get businessId from context
//   if (!businessId)
//     return (
//       <div className="h-screen w-full flex flex-col items-center justify-center">
//         <div className="bg-card p-10 rounded-2xl w-2xl flex flex-col shadow-soft items-center gap-4">
//           <p className="text-red-500">
//             Sorry we encountered a problem loading your business workspace,
//             please try again later or contact support if the issue persists.
//           </p>
//           <Link href="/terminal">
//             <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80">
//               Back to Terminal
//             </button>
//           </Link>
//         </div>
//         {/* <button></button> */}
//       </div>
//     );

//   const { products } = useProducts(businessId.toString());

//   const [activeTab, setActiveTab] = useState("register");
//   const [activeCategory, setActiveCategory] = useState("All");

//   return (
//     <div className="h-screen w-full flex bg-background overflow-hidden selection:bg-primary/20">
//       {/* 2. MAIN CONTENT AREA */}
//       <main className="flex-1 flex flex-col min-w-0 p-10">
//         {activeTab === "register" ? (
//           <>
//             {/* Category Filter */}
//             <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
//               {CATEGORIES.map((cat) => (
//                 <button
//                   key={cat}
//                   onClick={() => setActiveCategory(cat)}
//                   className={cn(
//                     "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
//                     activeCategory === cat
//                       ? "bg-foreground text-background shadow-lg"
//                       : "bg-card text-secondary border border-border hover:border-primary/50",
//                   )}
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>

//             {/* Product Grid */}
//             <section className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 custom-scrollbar pr-4">
//               {products.map((product) => (
//                 <ProductCard
//                   key={product.id}
//                   product={product}
//                   onAdd={addToCart} // Directly calling Zustand action
//                 />
//               ))}
//             </section>
//           </>
//         ) : (
//           <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic">
//             <LayoutGrid size={48} className="mb-4" />
//             <h2 className="uppercase tracking-widest text-sm">
//               Modular View: {activeTab}
//             </h2>
//           </div>
//         )}
//       </main>

//       {/* 3. PLUGGED IN CART SIDEBAR */}
//       <CartSidebar />

//       <style jsx global>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: var(--border);
//           border-radius: 10px;
//         }
//       `}</style>
//     </div>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { Package, LayoutGrid, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * @Scribe_Audit
 * Performance: Memoized category filtering to prevent re-renders on cart updates.
 * UX: Added tactile feedback for touch terminals.
 * A11y: Improved button labeling and error state visibility.
 */

// --- CONSTANTS ---
const CATEGORIES = ["All", "Beverages", "Food", "Services", "Retail"] as const;

// --- UI SUB-COMPONENTS ---

interface ProductCardProps {
  product: { id: string; name: string; price: number; stock: number };
  onAdd: (product: any) => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isOutOfStock}
      aria-label={`Add ${product.name} to cart. Price: Kshs ${product.price}. ${product.stock} available.`}
      className={cn(
        "group h-52 relative flex flex-col text-left bg-card border border-border rounded-[2.5rem] p-6 transition-all",
        "hover:shadow-soft hover:border-primary/40 active:scale-[0.97]",
        isOutOfStock && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="h-14 w-14 rounded-2xl bg-background group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <Package
            size={24}
            className="group-hover:text-primary text-secondary transition-colors"
          />
        </div>
        <span
          className={cn(
            "text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter",
            isOutOfStock
              ? "bg-red-100 text-red-600"
              : "bg-background text-secondary",
          )}
        >
          {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
        </span>
      </div>

      <div className="mt-auto">
        <h3 className="font-bold text-foreground text-base mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-2xl text-foreground font-black tracking-tight">
          <span className="text-xs font-medium text-secondary mr-1">Kshs</span>
          {product.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>
    </button>
  );
};

// --- MAIN TERMINAL VIEW ---

export default function TerminalCockpit() {
  const { addToCart } = useCartStore();
  const businessContext = useBusinessContext();
  const businessId = businessContext?.businessId;

  const [activeTab, setActiveTab] = useState("register");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { products = [], isLoading } = useProducts(
    businessId?.toString() || "",
  );

  // Optimized Filter Logic
  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.active === activeCategory);
  }, [products, activeCategory]);

  if (!businessId && !isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="glass p-12 rounded-[3rem] max-w-xl w-full flex flex-col items-center text-center gap-6 shadow-soft">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Terminal Link Interrupted</h2>
            <p className="text-secondary text-sm">
              We couldn't verify your business environment. Please
              re-authenticate or select a workspace.
            </p>
          </div>
          <Link href="/terminal" className="w-full">
            <button className="btn w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
              Return to Switchboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden selection:bg-primary/20">
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 p-8 lg:p-12">
        {activeTab === "register" ? (
          <>
            {/* Category Filter - Fixed Scrollbar Logic */}
            <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border",
                    activeCategory === cat
                      ? "bg-foreground text-background border-foreground shadow-lg scale-105"
                      : "bg-card text-secondary border-border hover:border-primary/50",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid - Performance Optimized */}
            <section className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="h-52 rounded-[2.5rem] bg-card animate-pulse border border-border"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 && !isLoading && (
                <div className="h-64 flex flex-col items-center justify-center text-secondary border-2 border-dashed border-border rounded-[2.5rem]">
                  <Package size={40} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase text-[10px] tracking-widest">
                    No products found in {activeCategory}
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic">
            <LayoutGrid size={48} className="mb-4" />
            <h2 className="uppercase tracking-widest text-sm font-black">
              Modular View: {activeTab}
            </h2>
          </div>
        )}
      </main>

      {/* PLUGGED IN CART SIDEBAR */}
      <CartSidebar />

      {/* Localized Styles for Custom Scrollbars */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--secondary);
        }
      `}</style>
    </div>
  );
}