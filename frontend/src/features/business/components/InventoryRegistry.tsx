
// "use client";
// import { RegistryRow } from "@/features/inventory/RegistryRow";
// import React, { useMemo, useState } from "react";
// import Link from "next/link";
// import {
//   Edit3,
//   Trash2,
//   Plus,
//   Search,
//   AlertTriangle,
//   CheckCircle2,
//   PackageSearch,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
// } from "lucide-react";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { cn } from "@/lib/utils";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Aesthetic: "Sheet-like" Data Grid. Minimal rounding, high-density contrast.
//  * Logic: Fixed property access mapping (name -> label, price -> selling_price).
//  * UX: Added pagination controls and row-hover elevation.
//  */

// export function InventoryRegistry() {
//   const { businessId } = useBusinessContext();
//   const { products, isLoading, updateProduct, deleteProduct } = useProducts(
//     businessId as string,
//   );

//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // Filter logic based on ProductResponse schema
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

//   const handleDelete = (id: string, name: string) => {
//     if (confirm(`DECOMMISSION ASSET: [${name}]? This action is logged.`)) {
//       deleteProduct.mutate(id);
//     }
//   };

//   const toggleStatus = (id: string, currentStatus: boolean) => {
//     updateProduct.mutate({ id, active: !currentStatus });
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
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="h-10 w-64 bg-muted/50 border border-border rounded-md px-10 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 outline-none transition-all"
//             />
//           </div>
//           <Link href={`/terminal/${businessId}/inventory/manage`}>
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
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">
//                     SKU / Identifier
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">
//                     Asset Description
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right">
//                     Unit Price (Ksh)
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right w-32">
//                     Inventory
//                   </th>
//                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center w-24">
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
//                     <tr
//                       key={product.id}
//                       className="hover:bg-muted/20 transition-colors group"
//                     >
//                       <td className="px-6 py-4">
//                         <button
//                           onClick={() =>
//                             toggleStatus(product.id, product.active)
//                           }
//                           className={cn(
//                             "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border transition-all",
//                             product.active
//                               ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
//                               : "bg-red-50 text-red-700 border-red-200",
//                           )}
//                         >
//                           {product.active ? "LIVE" : "ARCHIVED"}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4 font-mono text-[11px] text-secondary/60">
//                         {product.attributes?.sku || "NO_SKU"}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="text-xs font-bold text-foreground uppercase tracking-tight">
//                           {product.label}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-right tabular-nums text-xs font-black italic">
//                         {product.selling_price.toLocaleString(undefined, {
//                           minimumFractionDigits: 2,
//                         })}
//                       </td>
//                       <td className="px-6 py-4 text-right tabular-nums">
//                         <div className="flex flex-col items-end">
//                           <span
//                             className={cn(
//                               "text-xs font-black",
//                               product.stock <= 5
//                                 ? "text-red-500"
//                                 : "text-foreground",
//                             )}
//                           >
//                             {product.stock}
//                           </span>
//                           <span className="text-[8px] font-bold uppercase text-secondary/30">
//                             {product.attributes?.unit_of_measure || "pcs"}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <Link
//                             href={`/terminal/${businessId}/inventory/manage/${product.id}`}
//                           >
//                             <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all">
//                               <Edit3 size={14} />
//                             </button>
//                           </Link>
//                           <button
//                             onClick={() =>
//                               handleDelete(product.id, product.label)
//                             }
//                             className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200 transition-all"
//                           >
//                             <Trash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
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


"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RegistryRow } from "@/features/inventory/RegistryRow";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Architecture: Refactored to map over RegistryRow for inline editing capabilities.
 * Logic: Centralized update/delete handlers passed to atomic children.
 * Performance: Memoized pagination and filtering to handle registry scaling.
 */

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

  const handleUpdate = (id: string, data: Partial<ProductResponse>) => {
    updateProduct.mutate({ id, ...data });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`DECOMMISSION ASSET: [${name}]? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Precision Header */}
      <header className="border-b border-border bg-card px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/10">
            <PackageSearch size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none">
              Asset <span className="text-primary">Registry</span>
            </h1>
            <p className="text-[10px] font-mono text-secondary/40 uppercase tracking-[0.2em] mt-1">
              Ref: INVENTORY_DB_KNY_{new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Search SKU / Label..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              className="h-10 w-64 bg-muted/50 border border-border rounded-md px-10 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <Link href={`/terminal/${businessId}/inventory/new`}>
            <button className="h-10 px-5 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              <Plus size={14} strokeWidth={3} /> Register Asset
            </button>
          </Link>
        </div>
      </header>

      {/* Sheet Layout */}
      <div className="flex-1 p-8">
        <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 w-24">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 w-48">
                    SKU / Identifier
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50">
                    Asset Description
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right w-40">
                    Unit Price (Ksh)
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-right w-32">
                    Inventory
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary/50 text-center w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading ? (
                  <SkeletonRows />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-20 text-center opacity-20"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                        No records found
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((product) => (
                    <RegistryRow
                      key={product.id}
                      product={product}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sheet Footer: Pagination */}
          <footer className="border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-[0.2em]">
              Showing {paginatedItems.length} of {filteredItems.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-secondary/60 hover:text-primary disabled:opacity-30 transition-all"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 text-[10px] font-black tracking-widest text-foreground">
                PAGE {currentPage} / {totalPages || 1}
              </div>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center text-secondary/60 hover:text-primary disabled:opacity-30 transition-all"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
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
          <td colSpan={6} className="px-6 py-4 h-16 border-b border-border/10">
            <div className="h-4 bg-muted/40 rounded-sm w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}
