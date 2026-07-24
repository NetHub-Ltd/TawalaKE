// "use client";

// import React, { useState, useEffect } from "react";
// import { Package, AlertCircle, LayoutGrid, List, Search } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Layout: Side-pinned Cart with independent Grid scrolling and persistent layout metrics.
//  * UX: Search pattern matching combined with instantaneous structural view mutations.
//  * Performance: Synchronized localStorage interaction avoiding hydration mismatches.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   const { addToCart } = useCartStore();
//   const { products = [], isLoading } = useProducts(businessId);

//   // Layout View States & Search Query Streams
//   const [viewMode, setViewMode] = useState<"card" | "row">("card");
//   const [searchQuery, setSearchQuery] = useState<string>("");

//   // Safely hydrate view state configuration from localStorage on client mount
//   useEffect(() => {
//     const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
//     if (savedMode === "card" || savedMode === "row") {
//       setViewMode(savedMode);
//     }
//   }, []);

//   // Update selection matrix state and commit to persistent local disk array
//   const handleViewChange = (mode: "card" | "row") => {
//     setViewMode(mode);
//     localStorage.setItem("terminal_view_mode", mode);
//   };

//   // Filter products inline based on search match criteria
//   const filteredProducts = products.filter((product) =>
//     product.label?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Error boundary layout tied safely to system styling metrics
//   if (!businessId && !isLoading) {
//     return (
//       <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
//         <div className="card-layered max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6">
//           <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
//             <AlertCircle size={32} aria-hidden="true" />
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-h3">Context Error</h2>
//             <p className="text-muted text-sm font-medium">
//               Workspace verification failed. Re-authentication required for security.
//             </p>
//           </div>
//           <Link href="/terminal" className="w-full">
//             <button
//               type="button"
//               className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="absolute inset-0 flex flex-row overflow-hidden">
      
//       {/* Registry Canvas Area */}
//       <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0 bg-background">
        
//         {/* --- HIGH-THROUGHPUT SYSTEM HEADER HUB --- */}
//         <div className="p-4 lg:p-6 pb-2 shrink-0 border-b border-border/40 bg-surface/10 flex items-center justify-between gap-4">
          
//           {/* Real-time Filter Field Input Section */}
//           <div className="relative flex-1 max-w-md">
//             <Search 
//               size={15} 
//               className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" 
//               aria-hidden="true" 
//             />
//             <input
//               type="text"
//               placeholder="Search by product name, SKU, or attribute..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full h-10 pl-10 pr-4 rounded-xl text-xs font-medium bg-card border border-border/40 focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all font-sans"
//             />
//           </div>

//           {/* Persistent Display View Mode Matrix Controls */}
//           <div className="flex items-center bg-surface border border-border/40 rounded-xl p-0.5 shrink-0" role="inline-visual-toggle">
//             <button
//               type="button"
//               onClick={() => handleViewChange("card")}
//               aria-label="Switch to grid layout view option"
//               className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
//                 viewMode === "card"
//                   ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                   : "text-muted hover:text-foreground"
//               }`}
//             >
//               <LayoutGrid size={15} aria-hidden="true" />
//             </button>
//             <button
//               type="button"
//               onClick={() => handleViewChange("row")}
//               aria-label="Switch to row list layout view option"
//               className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
//                 viewMode === "row"
//                   ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                   : "text-muted hover:text-foreground"
//               }`}
//             >
//               <List size={15} aria-hidden="true" />
//             </button>
//           </div>
//         </div>

//         {/* --- PRODUCT DISPLAY CONTENT LAYER --- */}
//         <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
//           <div className="max-w-[1600px] mx-auto">
//             {isLoading ? (
//               <div className={viewMode === "card" 
//                 ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
//                 : "flex flex-col gap-2.5"
//               }>
//                 {[...Array(8)].map((_, i) => (
//                   <div
//                     key={i}
//                     className={`card-layered bg-card animate-pulse border border-border/20 ${
//                       viewMode === "card" ? "h-44 rounded-xl" : "h-[4.25rem] rounded-xl"
//                     }`}
//                   />
//                 ))}
//               </div>
//             ) : (
//               <>
//                 {/* Responsive View Grid Layout Toggle Wrapper */}
//                 <div className={viewMode === "card" 
//                   ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
//                   : "flex flex-col gap-2.5"
//                 }>
//                   {filteredProducts.map((product) => (
//                     <ProductCard
//                       key={product.id}
//                       product={product}
//                       onAdd={addToCart}
//                       viewMode={viewMode}
//                     />
//                   ))}
//                 </div>

//                 {/* Fallback Screen: Handled elegantly based on content matching matrices */}
//                 {filteredProducts.length === 0 && (
//                   <div className="h-[40vh] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
//                     <Package size={40} strokeWidth={1.5} className="mb-3 text-muted/40" aria-hidden="true" />
//                     <p className="font-bold uppercase text-[10px] tracking-widest text-muted/80">
//                       {products.length === 0 ? "Inventory Empty" : "No Matching Items Found"}
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </main>

//       {/* Side-Pinned Cart Container Panel */}
//       <aside className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
//         <CartSidebar businessId={businessId} />
//       </aside>

//     </div>
//   );
// }

// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { Package, AlertCircle, LayoutGrid, List, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Layout: Side-pinned Cart with distinct header control panel, category filter, and paginated product viewport.
//  * Performance: Dynamic category extraction and paginated slice memoization with layout state persistence.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   const { addToCart } = useCartStore();
//   const { products = [], isLoading } = useProducts(businessId);

//   // Layout & Filter States
//   const [viewMode, setViewMode] = useState<"card" | "row">("card");
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
//   // Pagination States
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [pageSize, setPageSize] = useState<number>(12);

//   // Safely hydrate view state configuration from localStorage on client mount
//   useEffect(() => {
//     const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
//     if (savedMode === "card" || savedMode === "row") {
//       setViewMode(savedMode);
//     }
//   }, []);

//   // Persist view mode setting
//   const handleViewChange = (mode: "card" | "row") => {
//     setViewMode(mode);
//     localStorage.setItem("terminal_view_mode", mode);
//   };

//   // Dynamically extract unique categories from products list
//   const categories = useMemo(() => {
//     const set = new Set<string>();
//     products.forEach((p) => {
//       if (p.category) {
//         set.add(p.category);
//       }
//     });
//     return Array.from(set).sort();
//   }, [products]);

//   // Reset page when search or category selection changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchQuery, selectedCategory, pageSize]);

//   // Combined Search & Category Filtering
//   const filteredProducts = useMemo(() => {
//     return products.filter((product) => {
//       const query = searchQuery.toLowerCase().trim();
//       const matchesSearch =
//         !query ||
//         product.label?.toLowerCase().includes(query) ||
//         product.attributes?.sku?.toLowerCase().includes(query);

//       const matchesCategory =
//         selectedCategory === "ALL" || product.category === selectedCategory;

//       return matchesSearch && matchesCategory;
//     });
//   }, [products, searchQuery, selectedCategory]);

//   // Computed Pagination Metrics
//   const totalItems = filteredProducts.length;
//   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
//   const paginatedProducts = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredProducts.slice(start, start + pageSize);
//   }, [filteredProducts, currentPage, pageSize]);

//   const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, totalItems);

//   // Error boundary layout tied safely to system styling metrics
//   if (!businessId && !isLoading) {
//     return (
//       <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
//         <div className="card-layered max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6">
//           <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
//             <AlertCircle size={32} aria-hidden="true" />
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-h3">Context Error</h2>
//             <p className="text-muted text-sm font-medium">
//               Workspace verification failed. Re-authentication required for security.
//             </p>
//           </div>
//           <Link href="/terminal" className="w-full">
//             <button
//               type="button"
//               className="w-full h-12 bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="absolute inset-0 flex flex-row overflow-hidden">
      
//       {/* Registry Canvas Area */}
//       <main className="flex-1 h-full overflow-y-auto flex flex-col min-w-0 bg-background">
        
//         {/* --- DISTINCT POS HEADER CONTROL HUB --- */}
//         <header className="p-4 lg:px-6 lg:py-4 shrink-0 border-b border-border/60 bg-card shadow-xs flex flex-col gap-3.5 z-10">
//           {/* Top Bar: Title & Terminal Metrics */}
//           <div className="flex items-center justify-between gap-4">
//             <div>
//               <h1 className="text-base font-black tracking-tight text-foreground uppercase">
//                 Terminal POS Registry
//               </h1>
//               <p className="text-[11px] font-medium text-muted">
//                 Fast product lookup & checkout matrix
//               </p>
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2.5 py-1 rounded-lg border border-border/40">
//                 {totalItems} {totalItems === 1 ? "Item" : "Items"}
//               </span>
              
//               {/* View Mode Switcher */}
//               <div className="flex items-center bg-surface border border-border/40 rounded-xl p-0.5 shrink-0">
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("card")}
//                   aria-label="Switch to grid layout view option"
//                   className={`p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "card"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <LayoutGrid size={15} aria-hidden="true" />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("row")}
//                   aria-label="Switch to row list layout view option"
//                   className={`p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "row"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <List size={15} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Bottom Control Bar: Search & Category Filter */}
//           <div className="flex flex-col sm:flex-row items-center gap-3">
//             {/* Real-time Search Input */}
//             <div className="relative flex-1 w-full">
//               <Search 
//                 size={15} 
//                 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" 
//                 aria-hidden="true" 
//               />
//               <input
//                 type="text"
//                 placeholder="Search by product name, SKU..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full h-9 pl-10 pr-4 rounded-xl text-xs font-medium bg-background border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all font-sans"
//               />
//             </div>

//             {/* Category Filter Dropdown */}
//             <div className="relative w-full sm:w-56 shrink-0 flex items-center">
//               <Filter 
//                 size={14} 
//                 className="absolute left-3 text-muted pointer-events-none z-10" 
//                 aria-hidden="true" 
//               />
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 aria-label="Filter products by category"
//                 className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-semibold bg-background border border-border/60 text-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none capitalize"
//               >
//                 <option value="ALL">All Categories ({products.length})</option>
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat.replace(/_/g, " ")}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </header>

//         {/* --- PRODUCT DISPLAY CONTENT LAYER --- */}
//         <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
//           <div className="max-w-[1600px] mx-auto">
//             {isLoading ? (
//               <div className={viewMode === "card" 
//                 ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
//                 : "flex flex-col gap-2.5"
//               }>
//                 {[...Array(pageSize)].map((_, i) => (
//                   <div
//                     key={i}
//                     className={`card-layered bg-card animate-pulse border border-border/20 ${
//                       viewMode === "card" ? "h-44 rounded-xl" : "h-[4.25rem] rounded-xl"
//                     }`}
//                   />
//                 ))}
//               </div>
//             ) : (
//               <>
//                 {/* Responsive View Grid Layout Toggle Wrapper */}
//                 <div className={viewMode === "card" 
//                   ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
//                   : "flex flex-col gap-2.5"
//                 }>
//                   {paginatedProducts.map((product) => (
//                     <ProductCard
//                       key={product.id}
//                       product={product}
//                       onAdd={addToCart}
//                       viewMode={viewMode}
//                     />
//                   ))}
//                 </div>

//                 {/* Empty State Fallback */}
//                 {paginatedProducts.length === 0 && (
//                   <div className="h-[40vh] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
//                     <Package size={40} strokeWidth={1.5} className="mb-3 text-muted/40" aria-hidden="true" />
//                     <p className="font-bold uppercase text-[10px] tracking-widest text-muted/80">
//                       {products.length === 0 ? "Inventory Empty" : "No Matching Items Found"}
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>

//         {/* --- PAGINATION FOOTER BAR --- */}
//         {!isLoading && totalItems > 0 && (
//           <footer className="p-3 lg:px-6 shrink-0 border-t border-border/40 bg-card/60 flex items-center justify-between gap-4 text-xs">
//             {/* Pagination Range Meta */}
//             <div className="flex items-center gap-3">
//               <span className="text-[11px] font-medium text-muted hidden sm:inline">
//                 Showing <strong className="font-bold text-foreground">{startIndex}</strong> to{" "}
//                 <strong className="font-bold text-foreground">{endIndex}</strong> of{" "}
//                 <strong className="font-bold text-foreground">{totalItems}</strong>
//               </span>

//               {/* Per-Page Selector */}
//               <div className="flex items-center gap-1.5">
//                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline">
//                   Per page:
//                 </span>
//                 <select
//                   value={pageSize}
//                   onChange={(e) => setPageSize(Number(e.target.value))}
//                   aria-label="Select items per page"
//                   className="h-7 px-2 rounded-lg bg-background border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer"
//                 >
//                   <option value={8}>8</option>
//                   <option value={12}>12</option>
//                   <option value={24}>24</option>
//                   <option value={48}>48</option>
//                 </select>
//               </div>
//             </div>

//             {/* Pagination Buttons */}
//             <div className="flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                 disabled={currentPage === 1}
//                 aria-label="Previous page"
//                 className="h-8 px-2.5 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <ChevronLeft size={14} className="sm:mr-1" />
//                 <span className="hidden sm:inline text-[11px]">Prev</span>
//               </button>

//               <span className="px-2 text-[11px] font-bold text-muted">
//                 Page {currentPage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={currentPage === totalPages}
//                 aria-label="Next page"
//                 className="h-8 px-2.5 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <span className="hidden sm:inline text-[11px]">Next</span>
//                 <ChevronRight size={14} className="sm:ml-1" />
//               </button>
//             </div>
//           </footer>
//         )}
//       </main>

//       {/* Side-Pinned Cart Container Panel */}
//       <aside className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
//         <CartSidebar businessId={businessId} />
//       </aside>

//     </div>
//   );
// }

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Package, AlertCircle, LayoutGrid, List, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
import { ProductCard } from "./product-card";

/**
 * @Scribe_Audit
 * Layout: Side-pinned Cart with ultra-compact single-row header hub and paginated product registry.
 * Performance: Zero vertical stacking in header, preserving max viewport for instant product scanning.
 */

interface TerminalCockpitProps {
  businessId: string;
}

export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
  const { addToCart } = useCartStore();
  const { products = [], isLoading } = useProducts(businessId);

  // Layout & Filter States
  const [viewMode, setViewMode] = useState<"card" | "row">("card");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Hydrate view mode setting from localStorage on client mount
  useEffect(() => {
    const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
    if (savedMode === "card" || savedMode === "row") {
      setViewMode(savedMode);
    }
  }, []);

  // Persist view mode setting
  const handleViewChange = (mode: "card" | "row") => {
    setViewMode(mode);
    localStorage.setItem("terminal_view_mode", mode);
  };

  // Dynamically extract unique categories from products list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Reset page when search or category selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, pageSize]);

  // Combined Search & Category Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        product.label?.toLowerCase().includes(query) ||
        product.attributes?.sku?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "ALL" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Computed Pagination Metrics
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

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
        
        {/* --- ULTRA-COMPACT SINGLE-ROW HEADER HUB --- */}
        <header className="px-4 lg:px-6 py-2 shrink-0 border-b border-border/60 bg-card shadow-xs flex items-center justify-between gap-3 z-10 min-h-[52px]">

          {/* Inline Controls Area */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px]">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" 
                aria-hidden="true" 
              />
              <input
                type="text"
                placeholder="Search products, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg text-xs font-medium bg-background border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all"
              />
            </div>

            {/* Inline Category Dropdown Filter */}
            <div className="relative shrink-0 w-36 sm:w-44">
              <Filter 
                size={13} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" 
                aria-hidden="true" 
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter products by category"
                className="w-full h-8 pl-8 pr-6 rounded-lg text-xs font-semibold bg-background border border-border/60 text-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none capitalize truncate"
              >
                <option value="ALL">All ({products.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Badge & View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2 py-1 rounded-md border border-border/40 hidden md:inline">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </span>

            <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => handleViewChange("card")}
                aria-label="Switch to grid layout view option"
                className={`p-1 min-h-[28px] min-w-[28px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
                  viewMode === "card"
                    ? "bg-card text-brand-primary shadow-xs border border-border/20"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <LayoutGrid size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("row")}
                aria-label="Switch to row list layout view option"
                className={`p-1 min-h-[28px] min-w-[28px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
                  viewMode === "row"
                    ? "bg-card text-brand-primary shadow-xs border border-border/20"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <List size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* --- PRODUCT DISPLAY CONTENT LAYER --- */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className={viewMode === "card" 
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
                : "flex flex-col gap-2.5"
              }>
                {[...Array(pageSize)].map((_, i) => (
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
                <div className={viewMode === "card" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" 
                  : "flex flex-col gap-2.5"
                }>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={addToCart}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {paginatedProducts.length === 0 && (
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

        {/* --- PAGINATION FOOTER BAR --- */}
        {!isLoading && totalItems > 0 && (
          <footer className="p-2.5 lg:px-6 shrink-0 border-t border-border/40 bg-card/60 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-muted hidden sm:inline">
                Showing <strong className="font-bold text-foreground">{startIndex}</strong> to{" "}
                <strong className="font-bold text-foreground">{endIndex}</strong> of{" "}
                <strong className="font-bold text-foreground">{totalItems}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline">
                  Per page:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Select items per page"
                  className="h-7 px-2 rounded-lg bg-background border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="h-7 px-2.5 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={14} className="sm:mr-1" />
                <span className="hidden sm:inline text-[11px]">Prev</span>
              </button>

              <span className="px-2 text-[11px] font-bold text-muted">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="h-7 px-2.5 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span className="hidden sm:inline text-[11px]">Next</span>
                <ChevronRight size={14} className="sm:ml-1" />
              </button>
            </div>
          </footer>
        )}
      </main>

      {/* Side-Pinned Cart Container Panel */}
      <aside className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0">
        <CartSidebar businessId={businessId} />
      </aside>

    </div>
  );
}