"use client";

import { useState } from "react";
import {
  Package,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
import Link from "next/link";
// import { useBusinessContext } from "./layout";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";


// --- CONSTANTS ---
const CATEGORIES = ["All", "Beverages", "Food", "Services", "Retail"];

// --- UI SUB-COMPONENTS ---

const SidebarItem = ({ icon: Icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "p-4 rounded-2xl transition-all",
      active
        ? "bg-primary text-white shadow-soft"
        : "text-secondary hover:bg-card hover:text-foreground",
    )}
  >
    <Icon size={24} />
  </button>
);

const ProductCard = ({ product, onAdd }: any) => (
  <button
    onClick={() => onAdd(product)}
    className="group h-48 relative flex flex-col text-left bg-card border border-border rounded-4xl p-5 transition-all hover:shadow-soft hover:border-primary/40 active:scale-95"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="h-12 w-12 rounded-2xl bg-background group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        <Package
          size={24}
          className="group-hover:text-primary text-secondary"
        />
      </div>
      <span className="text-[10px] font-black text-secondary bg-background px-3 py-1 rounded-full uppercase">
        {product.stock} in stock
      </span>
    </div>
    <div className="flex-1 flex flex-col justify-end">
      <h3 className="font-bold text-foreground text-base mb-1">
        {product.name}
      </h3>
      <p className="text-2xl text-foreground font-bold leading-none">
        Kshs. {product.price.toFixed(2)}
      </p>
    </div>
  </button>
);

// --- MAIN TERMINAL VIEW ---

export default function TerminalCockpit() {
  const { addToCart } = useCartStore(); // Using your Zustand store
  // const businessId = searchParams.get("businessId");
  const businessId = useBusinessContext()?.businessId; // Get businessId from context
  if (!businessId)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <div className="bg-card p-10 rounded-2xl w-2xl flex flex-col shadow-soft items-center gap-4">
          <p className="text-red-500">
            Sorry we encountered a problem loading your business workspace,
            please try again later or contact support if the issue persists.
          </p>
          <Link href="/terminal">
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80">
              Back to Terminal
            </button>
          </Link>
        </div>
        {/* <button></button> */}
      </div>
    );

  const { products } = useProducts(businessId.toString());

  const [activeTab, setActiveTab] = useState("register");
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden selection:bg-primary/20">
      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 p-10">
        {activeTab === "register" ? (
          <>
            {/* Category Filter */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                    activeCategory === cat
                      ? "bg-foreground text-background shadow-lg"
                      : "bg-card text-secondary border border-border hover:border-primary/50",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <section className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 custom-scrollbar pr-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart} // Directly calling Zustand action
                />
              ))}
            </section>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic">
            <LayoutGrid size={48} className="mb-4" />
            <h2 className="uppercase tracking-widest text-sm">
              Modular View: {activeTab}
            </h2>
          </div>
        )}
      </main>

      {/* 3. PLUGGED IN CART SIDEBAR */}
      <CartSidebar />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}