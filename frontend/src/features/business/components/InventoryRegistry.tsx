// "use client";

// import React, { useMemo, useState, useEffect } from "react";
// import Link from "next/link";
// import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
// import { Button } from "@/lib/components/ui/Button";
// import {
//   Plus,
//   PackageSearch,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   X,
// } from "lucide-react";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { cn } from "@/lib/utils";

// const TableHeaderCell = ({
//   children,
//   className,
// }: {
//   children: React.ReactNode;
//   className?: string;
// }) => (
//   <th
//     className={cn(
//       "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted select-none whitespace-nowrap align-middle",
//       className,
//     )}
//   >
//     {children}
//   </th>
// );

// export function InventoryRegistry() {
//   const { businessId, organizationId } = useBusinessContext();

//   // Local State Matrix for UI Controls
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // Computed Pagination Offsets
//   const currentSkip = (currentPage - 1) * itemsPerPage;

//   // Wired Paginated Hook parameters seamlessly mapped to backend inputs
//   const { products, isLoading, deleteProduct } = useProducts(
//     businessId as string,
//     undefined,
//     currentSkip,
//     itemsPerPage
//   );

//   // Reset page indicator to origin when criteria matches local boundaries
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchQuery, itemsPerPage]);

//   // Memory-isolated client data filters
//   const filteredItems = useMemo(() => {
//     if (!products) return [];
//     return products.filter(
//       (p) =>
//         p.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [products, searchQuery]);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

//   const handleEditRedirect = (id: string) => {
//     window.location.href = `/org/${organizationId}/${businessId}/inventory/${id}`;
//   };

//   const handleDelete = (id: string) => {
//     const targetProduct = products?.find((p) => p.id === id);
//     const productName = targetProduct ? targetProduct.label : "Unknown Asset";

//     if (confirm(`Delete Product: ${productName}? This action is logged.`)) {
//       deleteProduct.mutate(id);
//     }
//   };

//   return (
//     <main className="flex-1 flex flex-col h-full font-sans overflow-hidden bg-background">
      
//       {/* Upper Isolated Action Bar */}
//       <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
//         <div className="flex flex-col gap-0.5">
//           <h1 className="text-base font-black uppercase tracking-wider text-foreground">
//             Inventory Registry
//           </h1>
//           <p className="text-xs text-muted font-medium">Distribution node counts & stock monitoring.</p>
//         </div>
//         <Link href={`/org/${organizationId}/${businessId}/inventory/new`} passHref legacyBehavior>
//           <button className="inline-flex min-h-[40px] items-center gap-2 px-4 bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap">
//             <Plus size={14} strokeWidth={3} className="shrink-0" />
//             <span>Add New Product</span>
//           </button>
//         </Link>
//       </div>

//       {/* Main Database Layer */}
//       <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
//         <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
          
//           {/* Integrated Filter Control Strip inside Table Frame */}
//           <div className="bg-background/50 border-b border-border/80 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-xs">
//             {/* Accessible Integrated Search Field */}
//             <div className="relative w-full sm:w-[280px]">
//               <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
//                 <Search size={14} />
//               </span>
//               <input
//                 type="text"
//                 placeholder="Filter by product or SKU..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 aria-label="Filter database items"
//                 className="w-full h-9 pl-9 pr-8 bg-card border border-border rounded-lg text-xs font-medium text-foreground placeholder-muted/60 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary transition-all"
//               />
//               {searchQuery && (
//                 <button
//                   onClick={() => setSearchQuery("")}
//                   aria-label="Clear filter search field"
//                   className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted hover:text-foreground transition-colors cursor-pointer"
//                 >
//                   <X size={14} />
//                 </button>
//               )}
//             </div>

//             {/* Rows Window Capacity Adjuster */}
//             <div className="flex items-center gap-2 self-end sm:self-auto">
//               <label htmlFor="inventory-limit-select" className="text-[11px] font-bold uppercase tracking-wider text-muted whitespace-nowrap">
//                 Show:
//               </label>
//               <select
//                 id="inventory-limit-select"
//                 value={itemsPerPage}
//                 onChange={(e) => setItemsPerPage(Number(e.target.value))}
//                 className="h-8 rounded-md border border-border bg-card py-1 px-2 text-xs font-semibold text-foreground shadow-2xs focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary cursor-pointer"
//               >
//                 {[10, 25, 50, 100].map((size) => (
//                   <option key={size} value={size}>
//                     {size} rows
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Scrollable Viewport Content Area */}
//           <div className="flex-1 overflow-y-auto scroll-smooth min-h-0">
//             <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
//               <thead className="bg-background/20 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
//                 <tr>
//                   <TableHeaderCell className="min-w-[300px]">
//                     Product Details
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[180px] text-right">
//                     Selling Price
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[200px]">
//                     Stock Status
//                   </TableHeaderCell>
//                   <TableHeaderCell className="w-[140px] text-right">
//                     Actions
//                   </TableHeaderCell>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/40">
//                 {isLoading ? (
//                   <SkeletonRows />
//                 ) : filteredItems.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={4}
//                       className="px-6 py-20 text-center text-muted"
//                     >
//                       <PackageSearch size={40} className="mx-auto mb-3 opacity-30 text-brand-primary" strokeWidth={1.5} />
//                       <h3 className="uppercase tracking-wider text-xs text-foreground font-bold">
//                         No Assets Match Criteria
//                       </h3>
//                       <p className="text-muted mt-1 text-[11px]">
//                         Modify filters or append a new asset catalog token above.
//                       </p>
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredItems.map((product) => (
//                     <ProductSmartRow
//                       key={product.id}
//                       product={product}
//                       onEdit={handleEditRedirect}
//                       onDelete={handleDelete}
//                     />
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Table Footer Navigation Panel */}
//           <footer className="border-t border-border/80 bg-background/30 px-6 py-3.5 flex items-center justify-between shrink-0">
//             <span className="text-xs font-medium text-muted tabular-nums">
//               Showing{" "}
//               <span className="text-foreground font-bold">
//                 {filteredItems.length}
//               </span>{" "}
//               of{" "}
//               <span className="text-foreground font-bold">
//                 {products?.length || 0}
//               </span>{" "}
//               records
//             </span>
            
//             <div className="flex items-center gap-4">
//               <div className="text-xs font-bold tracking-tight text-foreground tabular-nums">
//                 Page {currentPage} of {totalPages || 1}
//               </div>
              
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === 1 || totalPages === 0}
//                   onClick={() => setCurrentPage((p) => p - 1)}
//                   className="w-9 h-9 !px-0"
//                   aria-label="Previous Page"
//                 >
//                   <ChevronLeft size={15} />
//                 </Button>
                
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   disabled={currentPage === totalPages || totalPages === 0}
//                   onClick={() => setCurrentPage((p) => p + 1)}
//                   className="w-9 h-9 !px-0"
//                   aria-label="Next Page"
//                 >
//                   <ChevronRight size={15} />
//                 </Button>
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
//       {[...Array(6)].map((_, i) => (
//         <tr key={i} className="animate-pulse">
//           <td colSpan={4} className="px-6 py-4 h-[64px] border-b border-border/40 align-middle">
//             <div className="flex items-center justify-between">
//               <div className="flex-1 space-y-2">
//                 <div className="h-3.5 bg-muted/20 rounded-sm w-1/4" />
//                 <div className="h-2.5 bg-muted/15 rounded-sm w-1/6" />
//               </div>
//               <div className="h-3.5 bg-muted/20 rounded-sm w-[80px] mr-16" />
//               <div className="h-5 bg-muted/20 rounded-sm w-[90px] mr-16" />
//               <div className="flex gap-2">
//                 <div className="h-8 w-8 bg-muted/20 rounded-md" />
//                 <div className="h-8 w-8 bg-muted/20 rounded-md" />
//               </div>
//             </div>
//           </td>
//         </tr>
//       ))}
//     </>
//   );
// }

"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
import { Button } from "@/lib/components/ui/Button";
import {
  Plus,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { cn } from "@/lib/utils";

interface SortState {
  column: string | null;
  direction: "asc" | "desc";
}

const TableHeaderCell = ({
  children,
  className,
  sortKey,
  currentSort,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortKey?: string;
  currentSort?: SortState;
  onSort?: (key: string) => void;
}) => {
  const isSortable = !!sortKey && !!onSort && !!currentSort;
  const isActive = isSortable && currentSort.column === sortKey;

  return (
    <th
      onClick={() => isSortable && onSort(sortKey)}
      className={cn(
        "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted select-none whitespace-nowrap align-middle",
        isSortable && "cursor-pointer hover:text-foreground transition-colors",
        className
      )}
    >
      <div className={cn("flex items-center gap-1.5", className?.includes("text-right") && "justify-end")}>
        {children}
        {isSortable && (
          <span className="text-muted/50 group-hover:text-muted transition-colors">
            {!isActive && <ArrowUpDown size={12} />}
            {isActive && currentSort.direction === "asc" && <ArrowUp size={12} className="text-brand-primary" />}
            {isActive && currentSort.direction === "desc" && <ArrowDown size={12} className="text-brand-primary" />}
          </span>
        )}
      </div>
    </th>
  );
};

export function InventoryRegistry() {
  const { businessId, organizationId } = useBusinessContext();

  // Local State Matrix for UI Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<SortState>({ column: "created_at", direction: "desc" });

  // Wired true server-paginated hook parameters matching backend envelope metrics
  const { products, pagination, isLoading, deleteProduct } = useProducts(
    businessId as string,
    undefined,
    currentPage,
    itemsPerPage,
    sort.column || undefined,
    sort.direction
  );

  // Reset page indicator to origin when row count configuration switches
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Server pagination data variables mapped cleanly from query state metadata
  const totalRecords = pagination?.total || 0;
  const totalPages = pagination?.pages || 1;

  // Handles client-side header sorting toggles forwarding directly down hook pipelines
  const handleSort = (columnKey: string) => {
    setSort((prev) => {
      if (prev.column === columnKey) {
        return {
          column: columnKey,
          direction: prev.direction === "desc" ? "asc" : "desc",
        };
      }
      return { column: columnKey, direction: "desc" };
    });
    setCurrentPage(1);
  };

  // Memory-isolated client side filtering overlay for immediate view typing layout responses
  const filteredItems = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    return products.filter(
      (p) =>
        p.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleEditRedirect = (id: string) => {
    window.location.href = `/org/${organizationId}/${businessId}/inventory/${id}`;
  };

  const handleDelete = (id: string) => {
    const targetProduct = products?.find((p) => p.id === id);
    const productName = targetProduct ? targetProduct.label : "Unknown Asset";

    if (confirm(`Delete Product: ${productName}? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full font-sans overflow-hidden bg-background">
      
      {/* Upper Isolated Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-black uppercase tracking-wider text-foreground">
            Inventory Registry
          </h1>
          <p className="text-xs text-muted font-medium">Distribution node counts & stock monitoring.</p>
        </div>
        <Link href={`/org/${organizationId}/${businessId}/inventory/new`} passHref legacyBehavior>
          <button className="inline-flex min-h-[40px] items-center gap-2 px-4 bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap">
            <Plus size={14} strokeWidth={3} className="shrink-0" />
            <span>Add New Product</span>
          </button>
        </Link>
      </div>

      {/* Main Database Layer */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Integrated Filter Control Strip inside Table Frame */}
          <div className="bg-background/50 border-b border-border/80 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-xs">
            {/* Accessible Integrated Search Field */}
            <div className="relative w-full sm:w-[280px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Filter by product or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter database items"
                className="w-full h-9 pl-9 pr-8 bg-card border border-border rounded-lg text-xs font-medium text-foreground placeholder-muted/60 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear filter search field"
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Rows Window Capacity Adjuster */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="inventory-limit-select" className="text-[11px] font-bold uppercase tracking-wider text-muted whitespace-nowrap">
                Show:
              </label>
              <select
                id="inventory-limit-select"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 rounded-md border border-border bg-card py-1 px-2 text-xs font-semibold text-foreground shadow-2xs focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary cursor-pointer"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} rows
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Viewport Content Area */}
          <div className="flex-1 overflow-y-auto scroll-smooth min-h-0">
            <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
              <thead className="bg-background/20 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <TableHeaderCell 
                    className="min-w-[300px]"
                    sortKey="label"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell 
                    className="w-[180px] text-right"
                    sortKey="selling_price"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Selling Price
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[200px]">
                    Stock Status
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[140px] text-right">
                    Actions
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <SkeletonRows />
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-20 text-center text-muted"
                    >
                      <PackageSearch size={40} className="mx-auto mb-3 opacity-30 text-brand-primary" strokeWidth={1.5} />
                      <h3 className="uppercase tracking-wider text-xs text-foreground font-bold">
                        No Assets Match Criteria
                      </h3>
                      <p className="text-muted mt-1 text-[11px]">
                        Modify filters or append a new asset catalog token above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((product) => (
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

          {/* Table Footer Navigation Panel */}
          <footer className="border-t border-border/80 bg-background/30 px-6 py-3.5 flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-muted tabular-nums">
              Showing{" "}
              <span className="text-foreground font-bold">
                {filteredItems.length}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-bold">
                {totalRecords}
              </span>{" "}
              records
            </span>
            
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold tracking-tight text-foreground tabular-nums">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-9 h-9 !px-0"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={15} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="w-9 h-9 !px-0"
                  aria-label="Next Page"
                >
                  <ChevronRight size={15} />
                </Button>
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
      {[...Array(6)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={4} className="px-6 py-4 h-[64px] border-b border-border/40 align-middle">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted/20 rounded-sm w-1/4" />
                <div className="h-2.5 bg-muted/15 rounded-sm w-1/6" />
              </div>
              <div className="h-3.5 bg-muted/20 rounded-sm w-[80px] mr-16" />
              <div className="h-5 bg-muted/20 rounded-sm w-[90px] mr-16" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted/20 rounded-md" />
                <div className="h-8 w-8 bg-muted/20 rounded-md" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}