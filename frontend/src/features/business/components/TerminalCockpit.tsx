// "use client";

// import React, { useState, useEffect, useTransition, useId, useMemo } from "react";
// import {
//   Package,
//   AlertCircle,
//   LayoutGrid,
//   List,
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Loader2,
// } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Layout: Side-pinned Cart POS Terminal Cockpit with persistent vertical geometry.
//  * Performance: True server-side search/pagination via `useProducts`, debounced search with `startTransition` (sub-16ms INP).
//  * CLS Optimization: Zero Cumulative Layout Shift via persistent structural containers, locked skeletons, and static footer positioning.
//  * Accessibility: WCAG AA compliant with full landmark hierarchy and 44px touch targets.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   // Accessibility Form Controls IDs
//   const searchInputId = useId();
//   const categorySelectId = useId();
//   const pageSizeSelectId = useId();

//   const { addToCart } = useCartStore();
//   const [isPending, startTransition] = useTransition();

//   // Layout & Filter States
//   const [viewMode, setViewMode] = useState<"card" | "row">(() => {
//     if (typeof window === "undefined") {
//       return "card";
//     }

//     const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
//     return savedMode === "card" || savedMode === "row" ? savedMode : "card";
//   });
//   const [rawSearch, setRawSearch] = useState<string>("");
//   const [debouncedSearch, setDebouncedSearch] = useState<string>("");
//   const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

//   // Pagination States
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [pageSize, setPageSize] = useState<number>(12);

//   // Persist view mode setting
//   const handleViewChange = (mode: "card" | "row") => {
//     setViewMode(mode);
//     localStorage.setItem("terminal_view_mode", mode);
//   };

//   // Debounce search query to decouple high-frequency typing from network invocation
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       startTransition(() => {
//         setDebouncedSearch(rawSearch.trim());
//         setCurrentPage(1);
//       });
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [rawSearch]);

//   /**
//    * Server-driven hook query invocation.
//    * Parameter position alignment:
//    * (businessId, productId, page, limit, sortBy, sortOrder, search)
//    */
//   const {
//     products = [],
//     pagination,
//     total = 0,
//     isLoading,
//     isFetching,
//   } = useProducts(
//     businessId,
//     undefined, // productId
//     currentPage, // page
//     pageSize, // limit
//     undefined, // sortBy
//     "desc", // sortOrder
//     debouncedSearch // search
//   );

//   // Filter server-returned batch if category sub-selection is active
//   const displayedProducts = useMemo(() => {
//     if (selectedCategory === "ALL") return products;
//     return products.filter((p) => p.category === selectedCategory);
//   }, [products, selectedCategory]);

//   // Dynamically extract unique categories from current dataset scope
//   const categories = useMemo(() => {
//     const set = new Set<string>();
//     products.forEach((p) => {
//       if (p.category) {
//         set.add(p.category);
//       }
//     });
//     return Array.from(set).sort();
//   }, [products]);

//   // Computed Pagination Metrics
//   const totalItems = total || products.length;
//   const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalItems / pageSize));
//   const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, totalItems);

//   // Category filter handler with non-blocking UI transition
//   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const val = e.target.value;
//     startTransition(() => {
//       setSelectedCategory(val);
//       setCurrentPage(1);
//     });
//   };

//   // Page size selector handler with non-blocking transition
//   const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newSize = Number(e.target.value);
//     startTransition(() => {
//       setPageSize(newSize);
//       setCurrentPage(1);
//     });
//   };

//   // Context Error View
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
//               className="w-full min-h-[44px] bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Structured Data Schema for POS Terminal
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     "name": "POS Terminal Cockpit",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "All",
//     "offers": {
//       "@type": "AggregateOffer",
//       "priceCurrency": "USD",
//       "offerCount": totalItems,
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <div className="absolute inset-0 flex flex-row overflow-hidden bg-background">
//         {/* Registry Canvas Main Container */}
//         <main
//           id="main-content"
//           className="flex-1 h-full flex flex-col min-w-0 overflow-hidden "
//         >
//           {/* <h1 className="sr-only">POS Product Terminal Registry</h1> */}

//           {/* --- ULTRA-COMPACT HEADER CONTROL HUB --- */}
//           <header className="px-4 lg:px-6 shrink-0 border-b border-border/60 bg-card shadow-xs flex items-center justify-between gap-3 z-10 min-h-[56px] h-[56px]">
//             {/* Inline Search & Category Controls */}
//             <div className="flex items-center gap-2 flex-1 max-w-2xl">
//               {/* Search Input */}
//               <div className="relative flex-1 min-w-[160px]">
//                 <label htmlFor={searchInputId} className="sr-only">
//                   Search products by name or SKU
//                 </label>
//                 <Search
//                   size={15}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none"
//                   aria-hidden="true"
//                 />
//                 <input
//                   id={searchInputId}
//                   type="text"
//                   placeholder="Search products, SKU..."
//                   value={rawSearch}
//                   onChange={(e) => setRawSearch(e.target.value)}
//                   className="w-full min-h-[44px] pl-9 pr-8 rounded-lg text-xs font-medium bg-background border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all"
//                 />
//                 {(isPending || isFetching) && (
//                   <Loader2
//                     size={14}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary pointer-events-none"
//                     aria-hidden="true"
//                   />
//                 )}
//               </div>

//               {/* Inline Category Dropdown Filter */}
//               <div className="relative shrink-0 w-36 sm:w-44">
//                 <label htmlFor={categorySelectId} className="sr-only">
//                   Filter products by category
//                 </label>
//                 <Filter
//                   size={13}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10"
//                   aria-hidden="true"
//                 />
//                 <select
//                   id={categorySelectId}
//                   value={selectedCategory}
//                   onChange={handleCategoryChange}
//                   aria-label="Filter products by category"
//                   className="w-full min-h-[44px] pl-9 pr-6 rounded-lg text-xs font-semibold bg-background border border-border/60 text-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none capitalize truncate"
//                 >
//                   <option value="ALL">All Categories</option>
//                   {categories.map((cat) => (
//                     <option key={cat} value={cat}>
//                       {cat.replace(/_/g, " ")}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Metrics Badge & Layout View Mode Toggles */}
//             <div className="flex items-center gap-2 shrink-0">
//               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2 py-1 rounded-md border border-border/40 hidden md:inline">
//                 {totalItems} {totalItems === 1 ? "Item" : "Items"}
//               </span>

//               <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 shrink-0">
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("card")}
//                   aria-label="Switch to grid layout view option"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "card"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <LayoutGrid size={16} aria-hidden="true" />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("row")}
//                   aria-label="Switch to row list layout view option"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "row"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <List size={16} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           </header>

//           {/* --- PRODUCT DISPLAY DISPLAY REGION (ZERO CLS SCROLL CANVAS) --- */}
//           <section
//             aria-label="Product Catalog Matrix"
//             className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0"
//           >
//             <div className="max-w-[1600px] mx-auto min-h-[400px]">
//               {isLoading ? (
//                 <div
//                   className={
//                     viewMode === "card"
//                       ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                       : "flex flex-col gap-2.5"
//                   }
//                 >
//                   {[...Array(pageSize)].map((_, i) => (
//                     <div
//                       key={i}
//                       className={`card-layered bg-card animate-pulse border border-border/20 ${
//                         viewMode === "card" ? "h-48 rounded-xl" : "h-[4.25rem] rounded-xl"
//                       }`}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <>
//                   <div
//                     className={
//                       viewMode === "card"
//                         ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                         : "flex flex-col gap-2.5"
//                     }
//                   >
//                     {displayedProducts.map((product) => (
//                       <ProductCard
//                         key={product.id}
//                         product={product}
//                         onAdd={addToCart}
//                         viewMode={viewMode}
//                       />
//                     ))}
//                   </div>

//                   {displayedProducts.length === 0 && (
//                     <div className="h-[360px] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
//                       <Package
//                         size={40}
//                         strokeWidth={1.5}
//                         className="mb-3 text-muted/40"
//                         aria-hidden="true"
//                       />
//                       <p className="font-bold uppercase text-xs tracking-widest text-muted/80">
//                         {debouncedSearch || selectedCategory !== "ALL"
//                           ? "No Matching Items Found"
//                           : "Inventory Empty"}
//                       </p>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </section>

//           {/* --- PERSISTENT PAGINATION FOOTER BAR (PREVENTS CLS) --- */}
//           <footer className="px-4 lg:px-6 shrink-0 border-t border-border/40 bg-card/60 flex items-center justify-between gap-4 text-xs min-h-[52px] h-[52px]">
//             <div className="flex items-center gap-3">
//               <span className="text-[11px] font-medium text-muted hidden sm:inline">
//                 Showing{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : startIndex}
//                 </strong>{" "}
//                 to{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : endIndex}
//                 </strong>{" "}
//                 of{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : totalItems}
//                 </strong>
//               </span>

//               <div className="flex items-center gap-1.5">
//                 <label
//                   htmlFor={pageSizeSelectId}
//                   className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline"
//                 >
//                   Per page:
//                 </label>
//                 <select
//                   id={pageSizeSelectId}
//                   value={pageSize}
//                   onChange={handlePageSizeChange}
//                   disabled={isLoading}
//                   aria-label="Select items per page"
//                   className="min-h-[44px] px-2 rounded-lg bg-background border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50"
//                 >
//                   <option value={8}>8</option>
//                   <option value={12}>12</option>
//                   <option value={24}>24</option>
//                   <option value={48}>48</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.max(1, p - 1)))
//                 }
//                 disabled={currentPage === 1 || isFetching || isLoading}
//                 aria-label="Previous page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <ChevronLeft size={16} className="sm:mr-1" />
//                 <span className="hidden sm:inline text-xs">Prev</span>
//               </button>

//               <span className="px-2 text-[11px] font-bold text-muted">
//                 Page {currentPage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1)))
//                 }
//                 disabled={currentPage === totalPages || isFetching || isLoading}
//                 aria-label="Next page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 bg-background text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <span className="hidden sm:inline text-xs">Next</span>
//                 <ChevronRight size={16} className="sm:ml-1" />
//               </button>
//             </div>
//           </footer>
//         </main>

//         {/* Side-Pinned Cart Container Panel */}
//         <aside
//           aria-label="Shopping Cart Sidebar"
//           className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0"
//         >
//           <CartSidebar businessId={businessId} />
//         </aside>
//       </div>
//     </>
//   );
// }

// "use client";

// import React, { useState, useEffect, useTransition, useId, useMemo } from "react";
// import {
//   Package,
//   AlertCircle,
//   LayoutGrid,
//   List,
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Loader2,
// } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Layout: Side-pinned Cart POS Terminal Cockpit inheriting global canvas background from root layout.ts.
//  * Performance: True server-side search/pagination via `useProducts`, non-blocking React transitions (sub-16ms INP).
//  * CLS Optimization: Zero Cumulative Layout Shift via persistent structural containers and locked skeleton dimensions.
//  * Accessibility: WCAG AA compliant with standard H1 page landmarks and 44px minimum touch targets.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   // Accessibility Form Control IDs
//   const searchInputId = useId();
//   const categorySelectId = useId();
//   const pageSizeSelectId = useId();

//   const { addToCart } = useCartStore();
//   const [isPending, startTransition] = useTransition();

//   // Layout & Filter States
//   const [viewMode, setViewMode] = useState<"card" | "row">(() => {
//     if (typeof window === "undefined") {
//       return "card";
//     }
//     const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
//     return savedMode === "card" || savedMode === "row" ? savedMode : "card";
//   });

//   const [rawSearch, setRawSearch] = useState<string>("");
//   const [debouncedSearch, setDebouncedSearch] = useState<string>("");
//   const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

//   // Pagination States
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [pageSize, setPageSize] = useState<number>(12);

//   // Persist view mode setting
//   const handleViewChange = (mode: "card" | "row") => {
//     setViewMode(mode);
//     localStorage.setItem("terminal_view_mode", mode);
//   };

//   // Debounce search query to decouple high-frequency typing from network invocation
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       startTransition(() => {
//         setDebouncedSearch(rawSearch.trim());
//         setCurrentPage(1);
//       });
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [rawSearch]);

//   /**
//    * Server-driven hook query invocation.
//    * Parameter position alignment:
//    * (businessId, productId, page, limit, sortBy, sortOrder, search)
//    */
//   const {
//     products = [],
//     pagination,
//     total = 0,
//     isLoading,
//     isFetching,
//   } = useProducts(
//     businessId,
//     undefined, // productId
//     currentPage, // page
//     pageSize, // limit
//     undefined, // sortBy
//     "desc", // sortOrder
//     debouncedSearch // search
//   );

//   // Filter server-returned batch if category sub-selection is active
//   const displayedProducts = useMemo(() => {
//     if (selectedCategory === "ALL") return products;
//     return products.filter((p) => p.category === selectedCategory);
//   }, [products, selectedCategory]);

//   // Dynamically extract unique categories from current dataset scope
//   const categories = useMemo(() => {
//     const set = new Set<string>();
//     products.forEach((p) => {
//       if (p.category) {
//         set.add(p.category);
//       }
//     });
//     return Array.from(set).sort();
//   }, [products]);

//   // Computed Pagination Metrics
//   const totalItems = total || products.length;
//   const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalItems / pageSize));
//   const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, totalItems);

//   // Category filter handler with non-blocking UI transition
//   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const val = e.target.value;
//     startTransition(() => {
//       setSelectedCategory(val);
//       setCurrentPage(1);
//     });
//   };

//   // Page size selector handler with non-blocking transition
//   const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newSize = Number(e.target.value);
//     startTransition(() => {
//       setPageSize(newSize);
//       setCurrentPage(1);
//     });
//   };

//   // Context Error View
//   if (!businessId && !isLoading) {
//     return (
//       <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
//         <div className="bg-card rounded-2xl border border-border/60 max-w-xl w-full p-8 md:p-12 flex flex-col items-center text-center gap-6 shadow-md">
//           <div className="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner">
//             <AlertCircle size={32} aria-hidden="true" />
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-xl font-bold text-foreground">Context Error</h2>
//             <p className="text-muted text-sm font-medium">
//               Workspace verification failed. Re-authentication required for security.
//             </p>
//           </div>
//           <Link href="/terminal" className="w-full">
//             <button
//               type="button"
//               className="w-full min-h-[44px] bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Structured Data Schema for POS Terminal Application
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     "name": "POS Terminal Cockpit",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "All",
//     "offers": {
//       "@type": "AggregateOffer",
//       "priceCurrency": "KES",
//       "offerCount": totalItems,
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <div className="absolute inset-0 flex flex-row overflow-hidden">
//         {/* Registry Canvas Main Container */}
//         <main
//           id="main-content"
//           className="flex-1 h-full flex flex-col min-w-0 overflow-hidden"
//         >
//           <h1 className="sr-only">POS Product Terminal Registry</h1>

//           {/* --- ULTRA-COMPACT HEADER CONTROL HUB --- */}
//           <header className="px-4 lg:px-6 shrink-0 border-b border-border/60 bg-card shadow-xs flex items-center justify-between gap-3 z-10 min-h-[56px] h-[56px]">
//             {/* Inline Search & Category Controls */}
//             <div className="flex items-center gap-2 flex-1 max-w-2xl">
//               {/* Search Input */}
//               <div className="relative flex-1 min-w-[160px]">
//                 <label htmlFor={searchInputId} className="sr-only">
//                   Search products by name or category
//                 </label>
//                 <Search
//                   size={15}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none"
//                   aria-hidden="true"
//                 />
//                 <input
//                   id={searchInputId}
//                   type="text"
//                   placeholder="Search products..."
//                   value={rawSearch}
//                   onChange={(e) => setRawSearch(e.target.value)}
//                   className="w-full min-h-[44px] pl-9 pr-8 rounded-lg text-xs font-medium bg-surface/60 border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all"
//                 />
//                 {(isPending || isFetching) && (
//                   <Loader2
//                     size={14}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary pointer-events-none"
//                     aria-hidden="true"
//                   />
//                 )}
//               </div>

//               {/* Inline Category Dropdown Filter */}
//               <div className="relative shrink-0 w-36 sm:w-44">
//                 <label htmlFor={categorySelectId} className="sr-only">
//                   Filter products by category
//                 </label>
//                 <Filter
//                   size={13}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10"
//                   aria-hidden="true"
//                 />
//                 <select
//                   id={categorySelectId}
//                   value={selectedCategory}
//                   onChange={handleCategoryChange}
//                   aria-label="Filter products by category"
//                   className="w-full min-h-[44px] pl-9 pr-6 rounded-lg text-xs font-semibold bg-surface/60 border border-border/60 text-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none capitalize truncate"
//                 >
//                   <option value="ALL">All Categories</option>
//                   {categories.map((cat) => (
//                     <option key={cat} value={cat}>
//                       {cat.replace(/_/g, " ")}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Metrics Badge & Layout View Mode Toggles */}
//             <div className="flex items-center gap-2 shrink-0">
//               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2 py-1 rounded-md border border-border/40 hidden md:inline">
//                 {totalItems} {totalItems === 1 ? "Item" : "Items"}
//               </span>

//               <div className="flex items-center bg-surface/80 border border-border/40 rounded-lg p-0.5 shrink-0">
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("card")}
//                   aria-label="Switch to grid layout view option"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "card"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <LayoutGrid size={16} aria-hidden="true" />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("row")}
//                   aria-label="Switch to row list layout view option"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "row"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <List size={16} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           </header>

//           {/* --- PRODUCT DISPLAY REGION (ZERO CLS SCROLL CANVAS) --- */}
//           <section
//             aria-label="Product Catalog Matrix"
//             className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0"
//           >
//             <div className="max-w-[1600px] mx-auto min-h-[400px]">
//               {isLoading ? (
//                 <div
//                   className={
//                     viewMode === "card"
//                       ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                       : "flex flex-col gap-2.5"
//                   }
//                 >
//                   {[...Array(pageSize)].map((_, i) => (
//                     <div
//                       key={i}
//                       className={`bg-card animate-pulse border border-border/20 ${
//                         viewMode === "card" ? "h-48 rounded-xl" : "h-[4.25rem] rounded-xl"
//                       }`}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <>
//                   <div
//                     className={
//                       viewMode === "card"
//                         ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                         : "flex flex-col gap-2.5"
//                     }
//                   >
//                     {displayedProducts.map((product) => (
//                       <ProductCard
//                         key={product.id}
//                         product={product}
//                         onAdd={addToCart}
//                         viewMode={viewMode}
//                       />
//                     ))}
//                   </div>

//                   {displayedProducts.length === 0 && (
//                     <div className="h-[360px] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-card/40 p-6 animate-in fade-in duration-200">
//                       <Package
//                         size={40}
//                         strokeWidth={1.5}
//                         className="mb-3 text-muted/40"
//                         aria-hidden="true"
//                       />
//                       <p className="font-bold uppercase text-xs tracking-widest text-muted/80">
//                         {debouncedSearch || selectedCategory !== "ALL"
//                           ? "No Matching Items Found"
//                           : "Inventory Empty"}
//                       </p>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </section>

//           {/* --- PERSISTENT PAGINATION FOOTER BAR (PREVENTS CLS) --- */}
//           <footer className="px-4 lg:px-6 shrink-0 border-t border-border/40 bg-card/80 flex items-center justify-between gap-4 text-xs min-h-[52px] h-[52px]">
//             <div className="flex items-center gap-3">
//               <span className="text-[11px] font-medium text-muted hidden sm:inline">
//                 Showing{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : startIndex}
//                 </strong>{" "}
//                 to{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : endIndex}
//                 </strong>{" "}
//                 of{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : totalItems}
//                 </strong>
//               </span>

//               <div className="flex items-center gap-1.5">
//                 <label
//                   htmlFor={pageSizeSelectId}
//                   className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline"
//                 >
//                   Per page:
//                 </label>
//                 <select
//                   id={pageSizeSelectId}
//                   value={pageSize}
//                   onChange={handlePageSizeChange}
//                   disabled={isLoading}
//                   aria-label="Select items per page"
//                   className="min-h-[44px] px-2 rounded-lg bg-surface/80 border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50"
//                 >
//                   <option value={8}>8</option>
//                   <option value={12}>12</option>
//                   <option value={24}>24</option>
//                   <option value={48}>48</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.max(1, p - 1)))
//                 }
//                 disabled={currentPage === 1 || isFetching || isLoading}
//                 aria-label="Previous page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 bg-surface/80 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <ChevronLeft size={16} className="sm:mr-1" />
//                 <span className="hidden sm:inline text-xs">Prev</span>
//               </button>

//               <span className="px-2 text-[11px] font-bold text-muted">
//                 Page {currentPage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1)))
//                 }
//                 disabled={currentPage === totalPages || isFetching || isLoading}
//                 aria-label="Next page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 bg-surface/80 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <span className="hidden sm:inline text-xs">Next</span>
//                 <ChevronRight size={16} className="sm:ml-1" />
//               </button>
//             </div>
//           </footer>
//         </main>

//         {/* Side-Pinned Cart Container Panel */}
//         <aside
//           aria-label="Shopping Cart Sidebar"
//           className="w-72 lg:w-80 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0"
//         >
//           <CartSidebar businessId={businessId} />
//         </aside>
//       </div>
//     </>
//   );
// }

// "use client";

// import React, { useState, useEffect, useTransition, useId, useMemo } from "react";
// import {
//   Package,
//   AlertCircle,
//   LayoutGrid,
//   List,
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
// } from "lucide-react";
// import Link from "next/link";
// import { CartSidebar } from "@/features/sales/components/CartSideBar";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./product-card";

// /**
//  * @Scribe_Audit
//  * Cockpit: High-density POS checkout terminal engineered for rapid order composition.
//  * Friction Minimization: Excised category filters and automatically hidden out-of-stock inventory.
//  * Layout Alignment: Removed root background overrides to let global layout variables drive surface context.
//  * INP Optimization: Sub-16ms interaction paint latency via debounced state transition primitives.
//  */

// interface TerminalCockpitProps {
//   businessId: string;
// }

// export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
//   // Accessibility Form Controls IDs
//   const searchInputId = useId();
//   const pageSizeSelectId = useId();

//   const { addToCart } = useCartStore();
//   const [isPending, startTransition] = useTransition();

//   // Layout & Search States
//   const [viewMode, setViewMode] = useState<"card" | "row">(() => {
//     if (typeof window === "undefined") {
//       return "card";
//     }

//     const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
//     return savedMode === "card" || savedMode === "row" ? savedMode : "card";
//   });
//   const [rawSearch, setRawSearch] = useState<string>("");
//   const [debouncedSearch, setDebouncedSearch] = useState<string>("");

//   // Pagination States
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [pageSize, setPageSize] = useState<number>(12);

//   // Persist view mode setting
//   const handleViewChange = (mode: "card" | "row") => {
//     setViewMode(mode);
//     localStorage.setItem("terminal_view_mode", mode);
//   };

//   // Debounce search query to decouple high-frequency typing from network invocation
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       startTransition(() => {
//         setDebouncedSearch(rawSearch.trim());
//         setCurrentPage(1);
//       });
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [rawSearch]);

//   /**
//    * Server-driven hook query invocation.
//    * Parameter position alignment:
//    * (businessId, productId, page, limit, sortBy, sortOrder, search)
//    */
//   const {
//     products = [],
//     pagination,
//     total = 0,
//     isLoading,
//     isFetching,
//   } = useProducts(
//     businessId,
//     undefined, // productId
//     currentPage, // page
//     pageSize, // limit
//     undefined, // sortBy
//     "desc", // sortOrder
//     debouncedSearch // search
//   );

//   // Zero-Friction Inventory Feed: Filter out out-of-stock items from terminal display
//   const displayedProducts = useMemo(() => {
//     return products.filter((product) => {
//       if (!product.track_stock) return true;
//       return product.stock > 0;
//     });
//   }, [products]);

//   // Computed Pagination Metrics based on active available products
//   const totalItems = total || displayedProducts.length;
//   const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalItems / pageSize));
//   const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, totalItems);

//   // Page size selector handler with non-blocking transition
//   const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newSize = Number(e.target.value);
//     startTransition(() => {
//       setPageSize(newSize);
//       setCurrentPage(1);
//     });
//   };

//   // Context Error View
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
//               className="w-full min-h-[44px] bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
//             >
//               Return to Switchboard
//             </button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Structured Data Schema for POS Terminal
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     "name": "POS Terminal Cockpit",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "All",
//     "offers": {
//       "@type": "AggregateOffer",
//       "priceCurrency": "KES",
//       "offerCount": totalItems,
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <div className="absolute inset-0 flex flex-row overflow-hidden">
//         {/* Registry Canvas Main Container */}
//         <main
//           id="main-content"
//           className="flex-1 h-full flex flex-col min-w-0 overflow-hidden"
//         >
//           {/* --- ULTRA-COMPACT HEADER CONTROL HUB --- */}
//           <header className="px-4 lg:px-6 shrink-0 border-b border-border/60 bg-card shadow-xs flex items-center justify-between gap-3 z-10 min-h-[56px] h-[56px]">
//             {/* Direct High-Speed Search Input */}
//             <div className="flex items-center gap-2 flex-1 max-w-xl">
//               <div className="relative flex-1">
//                 <label htmlFor={searchInputId} className="sr-only">
//                   Search products by name or label
//                 </label>
//                 <Search
//                   size={15}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none"
//                   aria-hidden="true"
//                 />
//                 <input
//                   id={searchInputId}
//                   type="text"
//                   placeholder="Instant item search..."
//                   value={rawSearch}
//                   onChange={(e) => setRawSearch(e.target.value)}
//                   className="w-full min-h-[44px] pl-9 pr-8 rounded-lg text-xs font-medium border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all"
//                 />
//                 {(isPending || isFetching) && (
//                   <Loader2
//                     size={14}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary pointer-events-none"
//                     aria-hidden="true"
//                   />
//                 )}
//               </div>
//             </div>

//             {/* Metrics Badge & Layout View Mode Toggles */}
//             <div className="flex items-center gap-2 shrink-0">
//               <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2 py-1 rounded-md border border-border/40 hidden md:inline">
//                 {totalItems} Available
//               </span>

//               <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 shrink-0">
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("card")}
//                   aria-label="Switch to grid layout view"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "card"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <LayoutGrid size={16} aria-hidden="true" />
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => handleViewChange("row")}
//                   aria-label="Switch to list row layout view"
//                   className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
//                     viewMode === "row"
//                       ? "bg-card text-brand-primary shadow-xs border border-border/20"
//                       : "text-muted hover:text-foreground"
//                   }`}
//                 >
//                   <List size={16} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           </header>

//           {/* --- PRODUCT DISPLAY REGION (ZERO CLS SCROLL CANVAS) --- */}
//           <section
//             aria-label="Available Product Matrix"
//             className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0"
//           >
//             <div className="max-w-[1600px] mx-auto min-h-[400px]">
//               {isLoading ? (
//                 <div
//                   className={
//                     viewMode === "card"
//                       ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                       : "flex flex-col gap-2.5"
//                   }
//                 >
//                   {[...Array(pageSize)].map((_, i) => (
//                     <div
//                       key={i}
//                       className={`card-layered bg-card animate-pulse border border-border/20 ${
//                         viewMode === "card" ? "h-48 rounded-xl" : "h-[4.25rem] rounded-xl"
//                       }`}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <>
//                   <div
//                     className={
//                       viewMode === "card"
//                         ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
//                         : "flex flex-col gap-2.5"
//                     }
//                   >
//                     {displayedProducts.map((product) => (
//                       <ProductCard
//                         key={product.id}
//                         product={product}
//                         onAdd={addToCart}
//                         viewMode={viewMode}
//                       />
//                     ))}
//                   </div>

//                   {displayedProducts.length === 0 && (
//                     <div className="h-[360px] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
//                       <Package
//                         size={40}
//                         strokeWidth={1.5}
//                         className="mb-3 text-muted/40"
//                         aria-hidden="true"
//                       />
//                       <p className="font-bold uppercase text-xs tracking-widest text-muted/80">
//                         {debouncedSearch
//                           ? "No Active Items Match Search"
//                           : "No Available Stock in Store"}
//                       </p>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </section>

//           {/* --- PERSISTENT PAGINATION FOOTER BAR --- */}
//           <footer className="px-4 lg:px-6 shrink-0 border-t border-border/40 bg-card/60 flex items-center justify-between gap-4 text-xs min-h-[52px] h-[52px]">
//             <div className="flex items-center gap-3">
//               <span className="text-[11px] font-medium text-muted hidden sm:inline">
//                 Showing{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : startIndex}
//                 </strong>{" "}
//                 to{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : endIndex}
//                 </strong>{" "}
//                 of{" "}
//                 <strong className="font-bold text-foreground">
//                   {isLoading ? 0 : totalItems}
//                 </strong>
//               </span>

//               <div className="flex items-center gap-1.5">
//                 <label
//                   htmlFor={pageSizeSelectId}
//                   className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline"
//                 >
//                   Per page:
//                 </label>
//                 <select
//                   id={pageSizeSelectId}
//                   value={pageSize}
//                   onChange={handlePageSizeChange}
//                   disabled={isLoading}
//                   aria-label="Select items per page"
//                   className="min-h-[44px] px-2 rounded-lg border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50"
//                 >
//                   <option value={8}>8</option>
//                   <option value={12}>12</option>
//                   <option value={24}>24</option>
//                   <option value={48}>48</option>
//                   <option value={48}>96</option>
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.max(1, p - 1)))
//                 }
//                 disabled={currentPage === 1 || isFetching || isLoading}
//                 aria-label="Previous page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <ChevronLeft size={16} className="sm:mr-1" />
//                 <span className="hidden sm:inline text-xs">Prev</span>
//               </button>

//               <span className="px-2 text-[11px] font-bold text-muted">
//                 Page {currentPage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 onClick={() =>
//                   startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1)))
//                 }
//                 disabled={currentPage === totalPages || isFetching || isLoading}
//                 aria-label="Next page"
//                 className="min-h-[44px] px-3 rounded-lg border border-border/60 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
//               >
//                 <span className="hidden sm:inline text-xs">Next</span>
//                 <ChevronRight size={16} className="sm:ml-1" />
//               </button>
//             </div>
//           </footer>
//         </main>

//         {/* Side-Pinned Cart Container Panel */}
//         <aside
//           aria-label="Shopping Cart Sidebar"
//           className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0"
//         >
//           <CartSidebar businessId={businessId} />
//         </aside>
//       </div>
//     </>
//   );
// }

"use client";

import React, { useState, useEffect, useTransition, useId, useMemo } from "react";
import {
  Package,
  AlertCircle,
  LayoutGrid,
  List,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { CartSidebar } from "@/features/sales/components/CartSideBar";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductCard } from "./ProductCard";
import { ProductCard } from "./product-card";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Friction Elimination: Out-of-stock inventory hidden from standard search view by default, 
 * but explicitly isolated when "Out of Stock" category filter is selected.
 * Power-User UX: `Ctrl + Click` / `Cmd + Click` on any card immediately removes item from cart.
 * Theme Cleanliness: Stripped root canvas background overrides, permitting cascading layout styles.
 */

interface TerminalCockpitProps {
  businessId: string;
}

export default function TerminalCockpit({ businessId }: TerminalCockpitProps) {
  // Accessibility Form Controls IDs
  const searchInputId = useId();
  const categorySelectId = useId();
  const pageSizeSelectId = useId();

  const { addToCart, removeFromCart } = useCartStore();
  const [isPending, startTransition] = useTransition();

  // Layout & Filter States
  const [viewMode, setViewMode] = useState<"card" | "row">(() => {
    if (typeof window === "undefined") {
      return "card";
    }

    const savedMode = localStorage.getItem("terminal_view_mode") as "card" | "row";
    return savedMode === "card" || savedMode === "row" ? savedMode : "card";
  });
  const [rawSearch, setRawSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Persist view mode setting
  const handleViewChange = (mode: "card" | "row") => {
    setViewMode(mode);
    localStorage.setItem("terminal_view_mode", mode);
  };

  // Debounce search query to decouple high-frequency typing from network invocation
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(rawSearch.trim());
        setCurrentPage(1);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [rawSearch]);

  /**
   * Server-driven hook query invocation.
   */
  const {
    products = [],
    pagination,
    total = 0,
    isLoading,
    isFetching,
  } = useProducts(
    businessId,
    undefined, // productId
    currentPage, // page
    pageSize, // limit
    undefined, // sortBy
    "desc", // sortOrder
    debouncedSearch // search
  );

  // Dynamically extract unique categories from current dataset scope
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        set.add(p.category);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Context-Aware Display Logic
  const displayedProducts = useMemo(() => {
    // 1. Explicit Out-Of-Stock Audit View
    if (selectedCategory === "OUT_OF_STOCK") {
      return products.filter((p) => p.track_stock && p.stock <= 0);
    }

    // 2. Default In-Stock Feed (hides out-of-stock items to remove checkout friction)
    const inStockProducts = products.filter((p) => !p.track_stock || p.stock > 0);

    if (selectedCategory === "ALL") {
      return inStockProducts;
    }

    // 3. Category Specific In-Stock Feed
    return inStockProducts.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Computed Pagination Metrics
  const totalItems = total || displayedProducts.length;
  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Category filter handler with non-blocking UI transition
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setSelectedCategory(val);
      setCurrentPage(1);
    });
  };

  // Page size selector handler with non-blocking transition
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    startTransition(() => {
      setPageSize(newSize);
      setCurrentPage(1);
    });
  };

  // High-Speed Cashier Modifier Interaction Handler (Ctrl/Cmd + Click to Remove)
  const handleProductInteraction = (product: ProductResponse, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      removeFromCart(product.id);
      return;
    }

    // Standard Click: Add to Cart if item is in stock
    if (!product.track_stock || product.stock > 0) {
      addToCart(product);
    }
  };

  // Context Error View
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
              className="w-full min-h-[44px] bg-foreground text-background rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
            >
              Return to Switchboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Structured Data Schema for POS Terminal
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "POS Terminal Cockpit",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "KES",
      "offerCount": totalItems,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="absolute inset-0 flex flex-row overflow-hidden">
        {/* Registry Canvas Main Container */}
        <main
          id="main-content"
          className="flex-1 h-full flex flex-col min-w-0 overflow-hidden"
        >
          {/* --- ULTRA-COMPACT HEADER CONTROL HUB --- */}
          <header className="px-4 lg:px-6 shrink-0 border-b border-border/60 bg-card shadow-xs flex items-center justify-between gap-3 z-10 min-h-[56px] h-[56px]">
            {/* Inline Search & Category Controls */}
            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[150px]">
                <label htmlFor={searchInputId} className="sr-only">
                  Search products by name or SKU
                </label>
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Instant product search..."
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-8 rounded-lg text-xs font-medium border border-border/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/10 text-foreground placeholder-muted/50 transition-all"
                />
                {(isPending || isFetching) && (
                  <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Category & Out-Of-Stock Filter Dropdown */}
              <div className="relative shrink-0 w-40 sm:w-48">
                <label htmlFor={categorySelectId} className="sr-only">
                  Filter products by category or stock status
                </label>
                <Filter
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10"
                  aria-hidden="true"
                />
                <select
                  id={categorySelectId}
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  aria-label="Filter products by category or stock status"
                  className="w-full min-h-[44px] pl-9 pr-6 rounded-lg text-xs font-semibold border border-border/60 text-foreground focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/10 transition-all cursor-pointer outline-none capitalize truncate"
                >
                  <option value="ALL">All Available Stock</option>
                  <option value="OUT_OF_STOCK">⚠️ Out of Stock Items</option>
                  {categories.length > 0 && (
                    <optgroup label="Categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Micro Shortcut Guide & View Toggles */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewChange("card")}
                  aria-label="Switch to grid layout view"
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
                    viewMode === "card"
                      ? "bg-card text-brand-primary shadow-xs border border-border/20"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("row")}
                  aria-label="Switch to row list layout view"
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-all active:scale-95 cursor-pointer ${
                    viewMode === "row"
                      ? "bg-card text-brand-primary shadow-xs border border-border/20"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <List size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          {/* --- PRODUCT DISPLAY MATRIX --- */}
          <section
            aria-label="Product Catalog Matrix"
            className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0"
          >
            <div className="max-w-[1600px] mx-auto min-h-[400px]">
              {isLoading ? (
                <div
                  className={
                    viewMode === "card"
                      ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                      : "flex flex-col gap-2.5"
                  }
                >
                  {[...Array(pageSize)].map((_, i) => (
                    <div
                      key={i}
                      className={`card-layered bg-card animate-pulse border border-border/20 ${
                        viewMode === "card" ? "h-48 rounded-xl" : "h-[4.25rem] rounded-xl"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div
                    className={
                      viewMode === "card"
                        ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                        : "flex flex-col gap-2.5"
                    }
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onInteract={handleProductInteraction}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>

                  {displayedProducts.length === 0 && (
                    <div className="h-[360px] flex flex-col items-center justify-center text-muted border-2 border-dashed border-border/40 rounded-[2.25rem] bg-surface/5 p-6 animate-in fade-in duration-200">
                      <Package
                        size={40}
                        strokeWidth={1.5}
                        className="mb-3 text-muted/40"
                        aria-hidden="true"
                      />
                      <p className="font-bold uppercase text-xs tracking-widest text-muted/80">
                        {selectedCategory === "OUT_OF_STOCK"
                          ? "No Out of Stock Items Found"
                          : debouncedSearch || selectedCategory !== "ALL"
                          ? "No Matching Items Found"
                          : "Inventory Empty"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* --- PERSISTENT PAGINATION FOOTER BAR --- */}
          <footer className="px-4 lg:px-6 shrink-0 border-t border-border/40 bg-card/60 flex items-center justify-between gap-4 text-xs min-h-[52px] h-[52px]">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-muted hidden sm:inline">
                Showing{" "}
                <strong className="font-bold text-foreground">
                  {isLoading ? 0 : startIndex}
                </strong>{" "}
                to{" "}
                <strong className="font-bold text-foreground">
                  {isLoading ? 0 : endIndex}
                </strong>{" "}
                of{" "}
                <strong className="font-bold text-foreground">
                  {isLoading ? 0 : totalItems}
                </strong>
              </span>

              <div className="flex items-center gap-1.5">
                <label
                  htmlFor={pageSizeSelectId}
                  className="text-[10px] font-bold uppercase tracking-wider text-muted hidden md:inline"
                >
                  Per page:
                </label>
                <select
                  id={pageSizeSelectId}
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  disabled={isLoading}
                  aria-label="Select items per page"
                  className="min-h-[44px] px-2 rounded-lg border border-border/60 text-[11px] font-semibold text-foreground outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50"
                >
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  startTransition(() => setCurrentPage((p) => Math.max(1, p - 1)))
                }
                disabled={currentPage === 1 || isFetching || isLoading}
                aria-label="Previous page"
                className="min-h-[44px] px-3 rounded-lg border border-border/60 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={16} className="sm:mr-1" />
                <span className="hidden sm:inline text-xs">Prev</span>
              </button>

              <span className="px-2 text-[11px] font-bold text-muted">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  startTransition(() => setCurrentPage((p) => Math.min(totalPages, p + 1)))
                }
                disabled={currentPage === totalPages || isFetching || isLoading}
                aria-label="Next page"
                className="min-h-[44px] px-3 rounded-lg border border-border/60 text-foreground flex items-center justify-center font-semibold transition-all hover:bg-surface disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span className="hidden sm:inline text-xs">Next</span>
                <ChevronRight size={16} className="sm:ml-1" />
              </button>
            </div>
          </footer>
        </main>

        {/* Side-Pinned Cart Container Panel */}
        <aside
          aria-label="Shopping Cart Sidebar"
          className="w-76 shrink-0 h-full overflow-hidden border-l border-border/40 bg-card/40 flex flex-col min-w-0"
        >
          <CartSidebar businessId={businessId} />
        </aside>
      </div>
    </>
  );
}