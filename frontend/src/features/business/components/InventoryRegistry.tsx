// "use client";

// import React, { useMemo, useState } from "react";
// import Link from "next/link";
// import {
//   Plus,
//   Search,
//   PackageSearch,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import { RegistryRow } from "@/features/inventory/RegistryRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Architecture: Refactored to map over RegistryRow for inline editing capabilities.
//  * Logic: Centralized update/delete handlers passed to atomic children.
//  * Performance: Memoized pagination and filtering to handle registry scaling.
//  */

// export function InventoryRegistry() {
//   const { businessId } = useBusinessContext();
//   const { products, isLoading, updateProduct, deleteProduct } = useProducts(
//     businessId as string,
//   );

//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const filteredItems = useMemo(() => {
//     if (!products) return [];
//     return products.filter(
//       (p) =>
//         p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
//     );
//   }, [products, searchQuery]);

//   const paginatedItems = useMemo(() => {
//     const start = (currentPage - 1) * itemsPerPage;
//     return filteredItems.slice(start, start + itemsPerPage);
//   }, [filteredItems, currentPage]);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

//   const handleUpdate = (id: string, data: Partial<ProductResponse>) => {
//     updateProduct.mutate({ id, ...data });
//   };

//   const handleDelete = (id: string, name: string) => {
//     if (confirm(`DECOMMISSION ASSET: [${name}]? This action is logged.`)) {
//       deleteProduct.mutate(id);
//     }
//   };

//   return (
//     <main className="flex-1 flex flex-col min-h-screen bg-background">
//       {/* Precision Header */}
//       <header className="border-b border-border bg-card px-8 py-6 flex items-center justify-between sticky top-0 z-10">
//         <div className="flex items-center gap-6">
//           <div className="h-12 w-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/10">
//             <PackageSearch size={24} strokeWidth={1.5} />
//           </div>
//           <div>
//             <h1 className="text-xl font-black uppercase tracking-tight leading-none">
//               Asset <span className="text-primary">Registry</span>
//             </h1>
//             <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-[0.2em] mt-1">
//               Ref: INVENTORY_DB_KNY_{new Date().getFullYear()}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="relative group">
//             <Search
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors"
//               size={14}
//             />
//             <input
//               type="text"
//               placeholder="Search SKU / Label..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1); // Reset to page 1 on search
//               }}
//               className="h-10 w-64 bg-muted/50 border border-border rounded-md px-10 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 outline-none transition-all"
//             />
//           </div>
//           <Link href={`/terminal/${businessId}/inventory/new`}>
//             <button className="h-10 px-5 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
//               <Plus size={14} strokeWidth={3} /> Register Asset
//             </button>
//           </Link>
//         </div>
//       </header>

//       {/* Sheet Layout */}
//       <div className="flex-1 p-8">
//         <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse text-left">
//               <thead>
//                 <tr className="bg-muted/50 border-b border-border">
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 w-24">
//                     Status
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 w-48">
//                     SKU / Identifier
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">
//                     Asset Description
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right w-40">
//                     Unit Price (Ksh)
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right w-32">
//                     Inventory
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center w-28">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/30">
//                 {isLoading ? (
//                   <SkeletonRows />
//                 ) : paginatedItems.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-6 py-20 text-center opacity-20"
//                     >
//                       <p className="text-[10px] font-black uppercase tracking-[0.5em]">
//                         No records found
//                       </p>
//                     </td>
//                   </tr>
//                 ) : (
//                   paginatedItems.map((product) => (
//                     <RegistryRow
//                       key={product.id}
//                       product={product}
//                       onUpdate={handleUpdate}
//                       onDelete={handleDelete}
//                     />
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Sheet Footer: Pagination */}
//           <footer className="border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
//             <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-[0.2em]">
//               Showing {paginatedItems.length} of {filteredItems.length} records
//             </span>
//             <div className="flex items-center gap-2">
//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((p) => p - 1)}
//                 className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-secondary/60 hover:text-primary disabled:opacity-30 transition-all"
//                 aria-label="Previous Page"
//               >
//                 <ChevronLeft size={16} />
//               </button>
//               <div className="px-4 text-[10px] font-black tracking-widest text-foreground">
//                 PAGE {currentPage} / {totalPages || 1}
//               </div>
//               <button
//                 disabled={currentPage === totalPages || totalPages === 0}
//                 onClick={() => setCurrentPage((p) => p + 1)}
//                 className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-secondary/60 hover:text-primary disabled:opacity-30 transition-all"
//                 aria-label="Next Page"
//               >
//                 <ChevronRight size={16} />
//               </button>
//             </div>
//           </footer>
//         </div>
//       </div>
//     </main>
//   );
// }

// function SkeletonRows() {
//   return (
//     <>
//       {[...Array(8)].map((_, i) => (
//         <tr key={i} className="animate-pulse">
//           <td colSpan={6} className="px-6 py-4 h-16 border-b border-border/10">
//             <div className="h-4 bg-muted/40 rounded-sm w-full" />
//           </td>
//         </tr>
//       ))}
//     </>
//   );
// }



// "use client";

// import React, { useMemo, useState } from "react";
// import Link from "next/link";
// import ProductS
// import {
//   Plus,
//   Search,
//   PackageSearch,
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
// } from "lucide-react";
// import { RegistryRow } from "@/features/inventory/RegistryRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { cn } from "@/lib/utils";

// /**
//  * @Scribe_Audit
//  * Visual Hierarchy: Standardized typography and spacing for clarity.
//  * Input Design: Refined search and actions.
//  * Alignment: Perfectly synced with RegistryRow widths.
//  */

// // Localizing TableHeader for alignment synchronization
// const TableHeaderCell = ({
//   children,
//   className,
// }: {
//   children: React.ReactNode;
//   className?: string;
// }) => (
//   <th
//     className={cn(
//       "px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
//       className,
//     )}
//   >
//     {children}
//   </th>
// );

// export function InventoryRegistry() {
//   const { businessId } = useBusinessContext();
//   const { products, isLoading, updateProduct, deleteProduct } = useProducts(
//     businessId as string,
//   );

//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const filteredItems = useMemo(() => {
//     if (!products) return [];
//     return products.filter(
//       (p) =>
//         p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
//     );
//   }, [products, searchQuery]);

//   const paginatedItems = useMemo(() => {
//     const start = (currentPage - 1) * itemsPerPage;
//     return filteredItems.slice(start, start + itemsPerPage);
//   }, [filteredItems, currentPage]);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

//   const handleUpdate = (id: string, data: Partial<ProductResponse>) => {
//     updateProduct.mutate({ id, ...data });
//   };

//   const handleDelete = (id: string, name: string) => {
//     if (confirm(`DECOMMISSION ASSET: [${name}]? This action is logged.`)) {
//       deleteProduct.mutate(id);
//     }
//   };

//   return (
//     <main className="flex-1 flex flex-col min-h-screen bg-background font-sans">
//       {/* Visual Context Header */}
//       <header className="border-b border-border/80 bg-card/95 px-8 py-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
//         <div className="flex items-center gap-6">
//           <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
//             <PackageSearch size={24} strokeWidth={1.5} />
//           </div>
//           <div className="space-y-0.5">
//             <h1 className="text-3xl font-extrabold tracking-tighter text-foreground leading-none">
//               Inventory <span className="text-primary">Registry</span>
//             </h1>
//             <p className="text-sm font-medium text-muted-foreground">
//               Official Asset Database Cluster | Ref:{" "}
//               <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
//                 DB_KNY_{new Date().getFullYear()}
//               </code>
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="relative group">
//             <Search
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
//               size={16}
//             />
//             <input
//               type="text"
//               placeholder="Search by Label or SKU identifier..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1); // Reset to page 1 on search
//               }}
//               className="h-11 w-80 bg-card border border-input rounded-lg pl-10 pr-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
//             />
//           </div>
//           <Link href={`/terminal/${businessId}/inventory/new`}>
//             <button className="h-11 px-6 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-lg font-bold text-sm tracking-tight flex items-center gap-2 hover:bg-foreground/90 dark:hover:bg-primary/90 shadow-sm active:scale-98 transition-all">
//               <Plus size={16} /> Register Asset
//             </button>
//           </Link>
//         </div>
//       </header>

//       {/* Main Database Layer */}
//       <div className="flex-1 p-8">
//         <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse text-left table-fixed">
//               <thead className="bg-muted/50 border-b border-border">
//                 <tr>
//                   {/* ALIGNMENT SYNC WITH REGISTRYROW WIDTHS */}
//                   <TableHeaderCell className="w-[120px]">
//                     Status / ID
//                   </TableHeaderCell>
//                   <TableHeaderCell className="min-w-[280px]">
//                     Product / SKU
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[200px] text-right">
//                     Pricing (Ksh)
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[180px] text-right">
//                     Inventory / Unit
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[120px] text-right">
//                     Actions
//                   </TableHeaderCell>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/50">
//                 {isLoading ? (
//                   <SkeletonRows />
//                 ) : paginatedItems.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={5}
//                       className="px-6 py-24 text-center text-muted-foreground"
//                     >
//                       <PackageSearch size={48} className="mx-auto mb-6 opacity-30 text-primary" strokeWidth={1} />
//                       <p className="text-base font-semibold tracking-tight">
//                         No Database Records Found
//                       </p>
//                       <p className="text-sm font-medium text-muted-foreground/80 mt-1.5">
//                         Adjust your search parameters or register a new asset.
//                       </p>
//                     </td>
//                   </tr>
//                 ) : (
//                   paginatedItems.map((product) => (
//                     <RegistryRow
//                       key={product.id}
//                       product={product}
//                       onUpdate={handleUpdate}
//                       onDelete={handleDelete}
//                     />
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Database Footer: Control Interface */}
//           <footer className="border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
//             <span className="text-xs font-semibold text-muted-foreground tabular-nums">
//               Showing{" "}
//               <span className="text-foreground">
//                 {paginatedItems.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-foreground">
//                 {filteredItems.length.toLocaleString()}
//               </span>{" "}
//               database records
//             </span>
//             <div className="flex items-center gap-3">
//               <div className="text-xs font-bold tracking-tight text-foreground/80 tabular-nums">
//                 Page {currentPage} of {totalPages || 1}
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <button
//                   type="button"
//                   disabled={currentPage === 1 || totalPages === 0}
//                   onClick={() => setCurrentPage((p) => p - 1)}
//                   className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//                   aria-label="Previous Page"
//                 >
//                   <ChevronLeft size={18} />
//                 </button>
//                 <button
//                   type="button"
//                   disabled={currentPage === totalPages || totalPages === 0}
//                   onClick={() => setCurrentPage((p) => p + 1)}
//                   className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//                   aria-label="Next Page"
//                 >
//                   <ChevronRight size={18} />
//                 </button>
//               </div>
//             </div>
//           </footer>
//         </div>
//       </div>
//     </main>
//   );
// }

// function SkeletonRows() {
//   return (
//     <>
//       {[...Array(8)].map((_, i) => (
//         <tr key={i} className="animate-pulse">
//           <td colSpan={5} className="px-4 py-5 h-[90px] border-b border-border/70 align-top">
//             <div className="flex items-center gap-4">
//               <div className="h-10 w-10 bg-muted rounded-xl" />
//               <div className="flex-1 space-y-2">
//                 <div className="h-4 bg-muted rounded-sm w-1/3" />
//                 <div className="h-3 bg-muted rounded-sm w-1/5" />
//               </div>
//               <div className="h-4 bg-muted rounded-sm w-[150px]" />
//               <div className="h-4 bg-muted rounded-sm w-[100px]" />
//               <div className="h-9 w-9 bg-muted rounded-lg" />
//             </div>
//           </td>
//         </tr>
//       ))}
//     </>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
import {
  Plus,
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductResponse } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * Visual Hierarchy: Standardized typography and spacing for clarity.
 * Input Design: Refined search and actions.
 * Integration: Wired ProductSmartRow to optimize presentation layer mechanics.
 */

// Localizing TableHeader for alignment synchronization
const TableHeaderCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={cn(
      "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none",
      className,
    )}
  >
    {children}
  </th>
);

export function InventoryRegistry() {
  const { businessId } = useBusinessContext();
  const { products, isLoading, updateProduct, deleteProduct } = useProducts(
    businessId as string,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Hooking the presentation layer edit callbacks to mutation parameters
  const handleEditRedirect = (id: string) => {
    // Navigates directly to the structural edit router canvas
    window.location.href = `/terminal/${businessId}/inventory/${id}/edit`;
  };

  const handleDelete = (id: string) => {
    const targetProduct = products?.find((p) => p.id === id);
    const productName = targetProduct ? targetProduct.label : "Unknown Asset";

    if (confirm(`DECOMMISSION ASSET: [${productName}]? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-background font-sans overflow-hidden">
      {/* Visual Context Header */}
      <header className="border-b border-border/80 bg-card/95 px-8 py-6 flex items-center justify-between shrink-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
            <PackageSearch size={24} strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-extrabold tracking-tighter text-foreground leading-none">
              Inventory <span className="text-primary">Registry</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Official Asset Database Cluster | Ref:{" "}
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                DB_KNY_{new Date().getFullYear()}
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by Label or SKU identifier..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              className="h-11 w-80 bg-card border border-input rounded-lg pl-10 pr-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <Link href={`/terminal/${businessId}/inventory/manage/new`}>
            <button className="h-11 px-6 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-lg font-bold text-sm tracking-tight flex items-center gap-2 hover:bg-foreground/90 dark:hover:bg-primary/90 shadow-sm active:scale-98 transition-all">
              <Plus size={16} /> Register Asset
            </button>
          </Link>
        </div>
      </header>

      {/* Main Database Layer */}
      <div className="flex-1 p-8 min-h-0 overflow-hidden flex flex-col">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Scrollable Viewport Wrapper */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
              <thead className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <TableHeaderCell className="min-w-[300px]">
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[180px] text-right">
                    Selling Price
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[200px]">
                    Inventory Health
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[140px] text-right">
                    Actions
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <SkeletonRows />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-24 text-center text-muted-foreground"
                    >
                      <PackageSearch size={48} className="mx-auto mb-6 opacity-30 text-primary" strokeWidth={1} />
                      <p className="text-base font-semibold tracking-tight">
                        No Database Records Found
                      </p>
                      <p className="text-sm font-medium text-muted-foreground/80 mt-1.5">
                        Adjust your search parameters or register a new asset.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((product) => (
                    // Injected high-performance presentation component mapping response schemas cleanly
                    <ProductSmartRow
                      key={product.id}
                      product={product}
                      onEdit={handleEditRedirect}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Database Footer: Control Interface */}
          <footer className="border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              Showing{" "}
              <span className="text-foreground">
                {paginatedItems.length}
              </span>{" "}
              of{" "}
              <span className="text-foreground">
                {filteredItems.length.toLocaleString()}
              </span>{" "}
              database records
            </span>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold tracking-tight text-foreground/80 tabular-nums">
                Page {currentPage} of {totalPages || 1}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1 || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={4} className="px-6 py-4 h-[68px] border-b border-border/70 align-middle">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-sm w-1/3" />
                <div className="h-3 bg-muted rounded-sm w-1/5" />
              </div>
              <div className="h-4 bg-muted rounded-sm w-[100px] mr-12" />
              <div className="h-6 bg-muted rounded-md w-[80px] mr-12" />
              <div className="flex gap-2">
                <div className="h-9 w-9 bg-muted rounded-xl" />
                <div className="h-9 w-9 bg-muted rounded-xl" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}