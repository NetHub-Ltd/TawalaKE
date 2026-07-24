// "use client";

// import React, { useState, useMemo } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { Loader2, AlertCircle, Package, Plus, Search, Layers } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import Link from "next/link";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
//   const { organizationId } = useBusinessContext();
  
//   const { products = [], isLoading, isError } = useProducts(businessId);
  
//   // Real-time local search query stream state
//   const [searchQuery, setSearchQuery] = useState<string>("");

//   const handleRowSave = async (payload: {
//     product_id: string;
//     business_id: string;
//     quantity: number;
//     reason_code: string;
//     notes: string;
//   }) => {
//     const res = await fetch("/api/v1/business/stock/audit", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       const errorData = await res.json();
//       throw new Error(errorData?.detail || "Failed to update stock records.");
//     }

//     const responseData = await res.json();
//     console.log("📋 [Stock Adjusted] ->", responseData);

//     queryClient.setQueryData(["products", businessId], (oldCacheData: any) => {
//       if (!oldCacheData) return oldCacheData;

//       const updateList = (items: ProductResponse[]) =>
//         items.map((p) =>
//           p.id === payload.product_id ? { ...p, stock: payload.quantity } : p
//         );

//       if (Array.isArray(oldCacheData)) {
//         return updateList(oldCacheData);
//       }
//       if (oldCacheData && Array.isArray(oldCacheData.products)) {
//         return {
//           ...oldCacheData,
//           products: updateList(oldCacheData.products),
//         };
//       }

//       return oldCacheData;
//     });
//   };

//   /**
//    * CASE-INSENSITIVE INVENTORY PATTERN MATCHING
//    * Fixed key mapping mismatch: Evaluates schema fields `product.label` 
//    * and nested Orval schema parameters `product.attributes.sku` safely.
//    */
//   const filteredProducts = useMemo(() => {
//     const physicalItemsOnly = (products as ProductResponse[]).filter(
//       (product) => product.track_stock !== false
//     );

//     if (!searchQuery.trim()) return physicalItemsOnly;

//     const normalizedQuery = searchQuery.toLowerCase();
    
//     return physicalItemsOnly.filter((product) => {
//       const labelMatch = product.label?.toLowerCase().includes(normalizedQuery);
//       const skuMatch = product.attributes?.sku?.toLowerCase().includes(normalizedQuery);
      
//       return !!(labelMatch || skuMatch);
//     });
//   }, [products, searchQuery]);

//   // Automated Semantic JSON-LD Schema for Application Context Extraction
//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     "name": "NetHub Inventory Audit Workspace",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "All",
//     "browserRequirements": "Requires HTML5 features",
//   };

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-4 z-50">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
//         <p className="font-bold uppercase tracking-wider text-muted text-xs">
//           Loading Stock Records...
//         </p>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-2xl border border-border/40 shadow-lift flex flex-col items-center text-center gap-4 mt-20">
//         <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
//           <AlertCircle size={24} />
//         </div>
//         <div className="space-y-2">
//           <h3 className="uppercase tracking-tight text-foreground font-bold text-sm">
//             Failed to Load Stock Data
//           </h3>
//           <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
//             Could not open the stock take sheet. Please check your connection and try again.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <main id="main-content" className="w-full p-4 md:p-6 flex flex-col overflow-hidden select-none font-sans antialiased">
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />
      
//       {/* Header Information Control Area (~10% Layout Real Estate Height Profile) */}
//       <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">

//         <div className="shrink-0 flex items-center">
//           <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
//             <button className="inline-flex items-center gap-2 px-4 h-9 bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border-none">
//               <Plus size={14} strokeWidth={3} className="shrink-0" />
//               <span>Add New Stock</span>
//             </button>
//           </Link>
//         </div>
//       </header>

//       {/* Structured Functional Table Architecture (Bound strictly to 90% fixed height window specs) */}
//       <div className="h-[90%] max-h-[90%] mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-lift flex flex-col overflow-hidden min-h-0">
        
//         {/* Fixed High-Throughput Search Functionality Controls Panel Zone */}
//         <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div className="relative w-full max-w-md">
//             <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" />
//             <input
//               type="text"
//               placeholder="Search items by product name, barcode, or SKU reference..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full h-9 pl-10 pr-4 rounded-xl text-xs font-medium bg-background border border-border/60 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/40 transition-all"
//             />
//           </div>
//           <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0">
//             Showing <span className="text-brand-primary font-black">{filteredProducts.length}</span> / {products.length} Items Listed
//           </div>
//         </div>

//         {/* STATIC TABLE COLUMN HEADER CONTAINER: Completely unyielding to scroll actions */}
//         <div className="flex items-center px-6 h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted shrink-0 select-none z-10">
//           <div className="flex-1 min-w-[200px] md:min-w-[250px]">Product Detail</div>
//           <div className="w-24 md:w-32 shrink-0">System Count</div>
//           <div className="w-32 md:w-40 shrink-0">Actual Count (On-Shelf)</div>
//           <div className="w-24 md:w-36 shrink-0">Difference Delta</div>
//           <div className="w-24 md:w-28 shrink-0 text-right">Commit</div>
//         </div>

//         {/* SCROLLABLE DATA ROWS AREA: The only operational layer executing layout scrolling */}
//         <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-border/30 bg-card/10 min-h-0">
//           {filteredProducts.length === 0 ? (
//             <div className="h-full w-full flex flex-col items-center justify-center text-muted p-6 gap-3 animate-in fade-in duration-200">
//               <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
//               <p className="font-bold text-[10px] uppercase tracking-widest text-center text-muted/70">
//                 {searchQuery ? "No matching catalog lines detected" : "No trackable inventory products active"}
//               </p>
//             </div>
//           ) : (
//             filteredProducts.map((product) => (
//               <AuditTableRow
//                 key={product.id}
//                 product={product}
//                 businessId={businessId}
//                 onSaveSuccess={handleRowSave}
//               />
//             ))
//           )}
//         </div>

//       </div>
//     </main>
//   );
// };

// "use client";

// import React, { useState, useMemo } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { Loader2, AlertCircle, Package, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import Link from "next/link";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
//   const { organizationId } = useBusinessContext();

//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [page, setPage] = useState<number>(1);
//   const limit = 20;

//   // Matching signature: businessId, productId (undefined), page, limit
//   const {
//     products = [],
//     pagination,
//     isLoading,
//     isError,
//   } = useProducts(businessId, undefined, page, limit);

//   const handleRowSave = async (payload: {
//     product_id: string;
//     business_id: string;
//     quantity: number;
//     reason_code: string;
//     notes: string;
//   }) => {
//     const res = await fetch("/api/v1/business/stock/audit", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       const errorData = await res.json();
//       throw new Error(errorData?.detail || "Failed to update stock records.");
//     }

//     const responseData = await res.json();
//     console.log("📋 [Stock Adjusted] ->", responseData);

//     queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//   };

//   // Filters stock-trackable items and matches client-side query string
//   const filteredTrackableProducts = useMemo(() => {
//     return products.filter((product: ProductResponse) => {
//       const isTrackable = product.track_stock !== false;
//       if (!isTrackable) return false;

//       if (!searchQuery.trim()) return true;

//       const query = searchQuery.toLowerCase();
//       const matchName = product.name?.toLowerCase().includes(query);
//       const matchSku = product.sku?.toLowerCase().includes(query);
//       const matchBarcode = product.barcode?.toLowerCase().includes(query);

//       return matchName || matchSku || matchBarcode;
//     });
//   }, [products, searchQuery]);

//   const totalPages = pagination?.pages ?? 1;

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//   };

//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     name: "NetHub Inventory Audit Workspace",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "All",
//     browserRequirements: "Requires HTML5 features",
//   };

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-4 z-50">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
//         <p className="font-bold uppercase tracking-wider text-muted text-xs">
//           Loading Stock Records...
//         </p>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-2xl border border-border/40 shadow-lift flex flex-col items-center text-center gap-4 mt-20">
//         <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
//           <AlertCircle size={24} />
//         </div>
//         <div className="space-y-2">
//           <h3 className="uppercase tracking-tight text-foreground font-bold text-sm">
//             Failed to Load Stock Data
//           </h3>
//           <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
//             Could not open the stock take sheet. Please check your connection and try again.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <main id="main-content" className="w-full p-4 md:p-6 flex flex-col overflow-hidden select-none font-sans antialiased">
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />

//       <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">
//         <div className="shrink-0 flex items-center">
//           <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
//             <button className="inline-flex items-center gap-2 px-4 h-9 bg-brand-secondary text-background rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer border-none hover:bg-brand-secondary/90">
//               <Plus size={14} strokeWidth={3} className="shrink-0" />
//               <span>Add New Stock</span>
//             </button>
//           </Link>
//         </div>
//       </header>

//       <div className="h-[90%] max-h-[90%] mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-lift flex flex-col overflow-hidden min-h-0">
//         <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div className="relative w-full max-w-md">
//             <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" />
//             <input
//               type="text"
//               placeholder="Search items by product name, barcode, or SKU reference..."
//               value={searchQuery}
//               onChange={handleSearchChange}
//               className="w-full h-9 pl-10 pr-4 rounded-xl text-xs font-medium bg-background border border-border/60 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/40 transition-colors"
//             />
//           </div>
//           <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0">
//             Showing <span className="text-brand-primary font-black">{filteredTrackableProducts.length}</span> Items Listed
//           </div>
//         </div>

//         <div className="flex items-center px-6 h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted shrink-0 select-none z-10">
//           <div className="flex-1 min-w-[200px] md:min-w-[250px]">Product Detail</div>
//           <div className="w-24 md:w-32 shrink-0">System Count</div>
//           <div className="w-32 md:w-40 shrink-0">Actual Count (On-Shelf)</div>
//           <div className="w-24 md:w-36 shrink-0">Difference Delta</div>
//           <div className="w-24 md:w-28 shrink-0 text-right">Commit</div>
//         </div>

//         <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-border/30 bg-card/10 min-h-0">
//           {filteredTrackableProducts.length === 0 ? (
//             <div className="h-full w-full flex flex-col items-center justify-center text-muted p-6 gap-3">
//               <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
//               <p className="font-bold text-[10px] uppercase tracking-widest text-center text-muted/70">
//                 {searchQuery ? "No matching catalog lines detected" : "No trackable inventory products active"}
//               </p>
//             </div>
//           ) : (
//             filteredTrackableProducts.map((product: ProductResponse) => (
//               <AuditTableRow
//                 key={product.id}
//                 product={product}
//                 businessId={businessId}
//                 onSaveSuccess={handleRowSave}
//               />
//             ))
//           )}
//         </div>

//         <div className="p-3 bg-surface/30 border-t border-border/40 shrink-0 flex items-center justify-between">
//           <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
//             Page {page} of {totalPages}
//           </span>
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={14} />
//             </button>
//             <button
//               type="button"
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page >= totalPages}
//               className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
//               aria-label="Next page"
//             >
//               <ChevronRight size={14} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// "use client";

// import React, { useState, useMemo } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { Loader2, AlertCircle, Package, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import Link from "next/link";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
//   const { organizationId } = useBusinessContext();

//   // Navigation & Control States
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [page, setPage] = useState<number>(1);
//   const [limit, setLimit] = useState<number>(20);

//   // Hook consume matching: businessId, productId (undefined), page, limit
//   const {
//     products = [],
//     pagination,
//     isLoading,
//     isError,
//   } = useProducts(businessId, undefined, page, limit);

//   const handleRowSave = async (payload: {
//     product_id: string;
//     business_id: string;
//     quantity: number;
//     reason_code: string;
//     notes: string;
//   }) => {
//     const res = await fetch("/api/v1/business/stock/audit", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       const errorData = await res.json();
//       throw new Error(errorData?.detail || "Failed to update stock records.");
//     }

//     const responseData = await res.json();
//     console.log("📋 [Stock Adjusted] ->", responseData);

//     queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//   };

//   // Filter products by stock tracking flag and active client search query
//   const filteredProducts = useMemo(() => {
//     return products.filter((product: ProductResponse) => {
//       const isTrackable = product.track_stock !== false;
//       if (!isTrackable) return false;

//       if (!searchQuery.trim()) return true;

//       const q = searchQuery.toLowerCase();
//       return (
//         product.name?.toLowerCase().includes(q) ||
//         product.sku?.toLowerCase().includes(q) ||
//         product.barcode?.toLowerCase().includes(q)
//       );
//     });
//   }, [products, searchQuery]);

//   const totalRecords = pagination?.total ?? 0;
//   const totalPages = pagination?.pages ?? 1;

//   // Calculate range bounds for footer readouts
//   const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
//   const endRecord = Math.min(page * limit, totalRecords);

//   const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setLimit(Number(e.target.value));
//     setPage(1);
//   };

//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//   };

//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     name: "NetHub Inventory Audit Workspace",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "All",
//     browserRequirements: "Requires HTML5 features",
//   };

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-4 z-50">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
//         <p className="font-bold uppercase tracking-wider text-muted text-xs">
//           Loading Stock Records...
//         </p>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-2xl border border-border/40 shadow-lift flex flex-col items-center text-center gap-4 mt-20">
//         <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
//           <AlertCircle size={24} />
//         </div>
//         <div className="space-y-2">
//           <h3 className="uppercase tracking-tight text-foreground font-bold text-sm">
//             Failed to Load Stock Data
//           </h3>
//           <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
//             Could not open the stock take sheet. Please check your connection and try again.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <main id="main-content" className="w-full p-4 md:p-6 flex flex-col overflow-hidden select-none font-sans antialiased">
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />

//       <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">
//         <div className="shrink-0 flex items-center">
//           <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
//             <button className="inline-flex items-center gap-2 px-4 h-9 bg-brand-secondary text-background rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer border-none hover:bg-brand-secondary/90">
//               <Plus size={14} strokeWidth={3} className="shrink-0" />
//               <span>Add New Stock</span>
//             </button>
//           </Link>
//         </div>
//       </header>

//       <div className="h-[90%] max-h-[90%] mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-lift flex flex-col overflow-hidden min-h-0">
        
//         {/* Search & Control Header */}
//         <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div className="relative w-full max-w-md">
//             <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" />
//             <input
//               type="text"
//               placeholder="Search items by product name, barcode, or SKU reference..."
//               value={searchQuery}
//               onChange={handleSearchChange}
//               className="w-full h-9 pl-10 pr-4 rounded-xl text-xs font-medium bg-background border border-border/60 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/40 transition-colors"
//             />
//           </div>
//           <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0">
//             Database Count: <span className="text-brand-primary font-black">{totalRecords}</span> Records
//           </div>
//         </div>

//         {/* Table Column Headers */}
//         <div className="flex items-center px-6 h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted shrink-0 select-none z-10">
//           <div className="flex-1 min-w-[200px] md:min-w-[250px]">Product Detail</div>
//           <div className="w-24 md:w-32 shrink-0">System Count</div>
//           <div className="w-32 md:w-40 shrink-0">Actual Count (On-Shelf)</div>
//           <div className="w-24 md:w-36 shrink-0">Difference Delta</div>
//           <div className="w-24 md:w-28 shrink-0 text-right">Commit</div>
//         </div>

//         {/* Scrollable Data Viewport */}
//         <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-border/30 bg-card/10 min-h-0">
//           {filteredProducts.length === 0 ? (
//             <div className="h-full w-full flex flex-col items-center justify-center text-muted p-6 gap-3">
//               <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
//               <p className="font-bold text-[10px] uppercase tracking-widest text-center text-muted/70">
//                 {searchQuery ? "No matching catalog lines detected" : "No trackable inventory products active"}
//               </p>
//             </div>
//           ) : (
//             filteredProducts.map((product: ProductResponse) => (
//               <AuditTableRow
//                 key={product.id}
//                 product={product}
//                 businessId={businessId}
//                 onSaveSuccess={handleRowSave}
//               />
//             ))
//           )}
//         </div>

//         {/* Dynamic Pagination Controls Footer */}
//         <div className="p-3 bg-surface/30 border-t border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2">
//               <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
//                 Rows per page:
//               </span>
//               <select
//                 value={limit}
//                 onChange={handleLimitChange}
//                 className="h-7 px-2 rounded-lg border border-border/60 bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-primary"
//               >
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>

//             <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
//               Showing {startRecord}–{endRecord} of {totalRecords}
//             </span>
//           </div>

//           <div className="flex items-center gap-3 self-end sm:self-auto">
//             <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
//               Page {page} of {totalPages}
//             </span>

//             <div className="flex items-center gap-1.5">
//               <button
//                 type="button"
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={page <= 1}
//                 className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
//                 aria-label="Previous page"
//               >
//                 <ChevronLeft size={14} />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 disabled={page >= totalPages}
//                 className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
//                 aria-label="Next page"
//               >
//                 <ChevronRight size={14} />
//               </button>
//             </div>
//           </div>

//         </div>

//       </div>
//     </main>
//   );
// };

"use client";

import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuditTableRow } from "@/features/inventory/AuditTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";
import {
  Loader2,
  AlertCircle,
  Package,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import Link from "next/link";

interface AuditWorkspaceProps {
  businessId: string;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
  const queryClient = useQueryClient();
  const { organizationId } = useBusinessContext();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const {
    products = [],
    pagination,
    isLoading,
    isError,
  } = useProducts(businessId, undefined, page, limit);

  const handleRowSave = async (payload: {
    product_id: string;
    business_id: string;
    quantity: number;
    reason_code: string;
    notes: string;
  }) => {
    const res = await fetch("/api/v1/business/stock/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData?.detail || "Failed to update stock records.");
    }

    queryClient.invalidateQueries({ queryKey: ["products", businessId] });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product: ProductResponse) => {
      if (product.track_stock === false) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        product.label?.toLowerCase().includes(query) ||
        product.attributes.sku?.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const totalRecords = pagination?.total ?? 0;
  const totalPages = pagination?.pages ?? 1;
  const currentPage = pagination?.page ?? page;

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NetHub Inventory Audit Workspace",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires HTML5 features",
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-4 z-50">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="font-bold uppercase tracking-wider text-muted text-xs">
          Loading Stock Records...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-card rounded-2xl border border-border/40 shadow-lift flex flex-col items-center text-center gap-4 mt-20">
        <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-tight text-foreground font-bold text-sm">
            Failed to Load Stock Data
          </h3>
          <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
            Could not open the stock take sheet. Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" className="w-full flex flex-col overflow-hidden select-none font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Stock Take Audit</h1>
          <p className="text-xs text-muted font-medium">Reconcile physical inventory counts against system balances.</p>
        </div>
        <div className="shrink-0 flex items-center">
          <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
            <button className="inline-flex items-center gap-2 px-4 h-9 bg-brand-secondary text-background rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer border-none hover:bg-brand-secondary/90">
              <Plus size={14} strokeWidth={3} className="shrink-0" />
              <span>Add New Stock</span>
            </button>
          </Link>
        </div>
      </header>

      <div className="mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-lift flex flex-col overflow-hidden min-h-[500px]">
        {/* Table Top Controls Bar */}
        <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/80 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter current view by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-xl text-xs font-medium bg-background border border-border/60 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-foreground placeholder-muted/40 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label htmlFor="rows-per-page" className="text-[11px] font-semibold text-muted whitespace-nowrap">
                Rows per page:
              </label>
              <select
                id="rows-per-page"
                value={limit}
                onChange={handlePageSizeChange}
                className="h-8 px-2 rounded-lg bg-background border border-border/60 text-xs font-bold text-foreground focus:outline-none focus:border-brand-primary/60 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0 bg-surface/60 px-3 py-1.5 rounded-lg border border-border/40">
              Showing <span className="text-brand-primary font-black">{filteredProducts.length}</span> of <span className="text-foreground font-black">{totalRecords}</span> Total
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center px-6 h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted shrink-0 select-none z-10">
          <div className="flex-1 min-w-[200px] md:min-w-[250px]">Product Detail</div>
          <div className="w-24 md:w-32 shrink-0">System Count</div>
          <div className="w-32 md:w-40 shrink-0">Actual Count (On-Shelf)</div>
          <div className="w-24 md:w-36 shrink-0">Difference Delta</div>
          <div className="w-24 md:w-28 shrink-0 text-right">Commit</div>
        </div>

        {/* Data Rows Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-border/30 bg-card/10 min-h-[350px]">
          {filteredProducts.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted p-12 gap-3">
              <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
              <p className="font-bold text-[10px] uppercase tracking-widest text-center text-muted/70">
                {searchQuery ? "No matching catalog lines detected on this page" : "No trackable inventory products active"}
              </p>
            </div>
          ) : (
            filteredProducts.map((product: ProductResponse) => (
              <AuditTableRow
                key={product.id}
                product={product}
                businessId={businessId}
                onSaveSuccess={handleRowSave}
              />
            ))
          )}
        </div>

        {/* Navigation Footer */}
        <footer className="p-3 bg-surface/30 border-t border-border/40 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[11px] font-medium text-muted">
            Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
            <span className="font-bold text-foreground">{endRecord}</span> of{" "}
            <span className="font-bold text-foreground">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted mr-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
};