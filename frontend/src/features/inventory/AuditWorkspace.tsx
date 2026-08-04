// "use client";

// import React, { useState, useEffect, useId, useTransition, useMemo, useCallback } from "react";
// import Link from "next/link";
// import { useQueryClient } from "@tanstack/react-query";
// import {
//   Loader2,
//   AlertCircle,
//   Package,
//   Plus,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
// } from "lucide-react";

// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { ProductSearchBar } from "@/features/store/products/components/ProductSearchBar";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
//   const { organizationId } = useBusinessContext();
//   const rowsPerPageSelectId = useId();
//   const [isPending, startTransition] = useTransition();

//   // State Management: Controlled search term vs. network debounced term
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [debouncedSearch, setDebouncedSearch] = useState<string>("");
//   const [page, setPage] = useState<number>(1);
//   const [limit, setLimit] = useState<number>(20);

//   // Debounce Engine: Delays network query by 350ms to prevent request thrashing
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       startTransition(() => {
//         setDebouncedSearch(searchTerm);
//         setPage(1); // Reset to page 1 on new search keyword
//       });
//     }, 350);

//     return () => clearTimeout(handler);
//   }, [searchTerm]);

//   // Reset pagination on limit modification
//   useEffect(() => {
//     startTransition(() => {
//       setPage(1);
//     });
//   }, [limit]);

//   // Server-paginated product query call
//   const {
//     products,
//     pagination,
//     isLoading,
//     isError,
//     isFetching,
//     refresh,
//   } = useProducts(
//     businessId,
//     undefined,
//     page,
//     limit,
//     undefined,
//     "desc",
//     debouncedSearch
//   );

//   // Direct array extraction with safe fallback to eliminate render black-holes
//   const productsList = useMemo<ProductResponse[]>(() => {
//     return Array.isArray(products) ? products : [];
//   }, [products]);

//   // Pagination telemetry bounds calculations
//   const totalRecords = pagination?.total ?? productsList.length;
//   const totalPages = pagination?.pages ?? Math.max(1, Math.ceil(totalRecords / limit));
//   const currentPage = pagination?.page ?? page;

//   const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
//   const endRecord = Math.min(currentPage * limit, totalRecords);

//   // Event Normalizer: Prevents [object Object] serialization when string/event is emitted
//   const handleSearchInput = useCallback((input: string | React.ChangeEvent<HTMLInputElement>) => {
//     const value = typeof input === "string" ? input : input.target.value;
//     setSearchTerm(value);
//   }, []);

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
//       const errorData = await res.json().catch(() => ({}));
//       throw new Error(errorData?.detail || "Failed to update stock records.");
//     }

//     await refresh();
//   };

//   const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newLimit = Number(e.target.value);
//     startTransition(() => {
//       setLimit(newLimit);
//     });
//   };

//   const handlePageChange = (newPage: number) => {
//     startTransition(() => {
//       setPage(newPage);
//     });
//   };

//   // Structured Data Schema for WebApp Inventory Workspace
//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     name: "NetHub Inventory Audit Workspace",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "All",
//     browserRequirements: "Requires HTML5 features",
//   };

//   return (
//     <main
//       id="main-content"
//       className="w-full flex flex-col overflow-hidden select-none font-sans antialiased"
//     >
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />

//       {/* Page Header */}
//       <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">
//         <div>
//           <h1 className="text-lg font-bold text-foreground tracking-tight">Stock Take Audit</h1>
//           <p className="text-xs text-muted font-medium">
//             Reconcile physical inventory counts against system balances.
//           </p>
//         </div>
//         <div className="shrink-0 flex items-center">
//           <Link
//             href={`/org/${organizationId}/${businessId}/stock/restock`}
//             className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] min-w-[44px] bg-brand-secondary text-background rounded-xl text-xs font-bold transition-all shadow-md hover:bg-brand-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-[0.98]"
//           >
//             <Plus size={14} strokeWidth={3} className="shrink-0" />
//             <span>Add New Stock</span>
//           </Link>
//         </div>
//       </header>

//       {/* Primary Audit Worksheet */}
//       <section
//         aria-label="Audit Worksheet Data"
//         aria-busy={isLoading || isFetching || isPending}
//         className="mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-lift flex flex-col overflow-hidden min-h-[500px]"
//       >
//         {/* Table Controls Bar */}
//         <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <ProductSearchBar
//             onSearch={handleSearchInput}
//             isFetching={isFetching || isPending}
//             placeholder="Filter catalog by name, SKU, or barcode..."
//           />

//           <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
//             <div className="flex items-center gap-2">
//               <label
//                 htmlFor={rowsPerPageSelectId}
//                 className="text-[11px] font-semibold text-muted whitespace-nowrap"
//               >
//                 Rows per page:
//               </label>
//               <select
//                 id={rowsPerPageSelectId}
//                 value={limit}
//                 onChange={handlePageSizeChange}
//                 className="min-h-[44px] px-3 rounded-lg bg-background border border-border/60 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
//               >
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>

//             <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0 bg-surface/60 px-3 py-2.5 rounded-lg border border-border/40">
//               Showing <span className="text-brand-primary font-black">{productsList.length}</span>{" "}
//               of <span className="text-foreground font-black">{totalRecords}</span> Total
//             </div>
//           </div>
//         </div>

//         {/* State Container: Loading / Error / Data */}
//         {isLoading ? (
//           <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 min-h-[350px]">
//             <Loader2
//               className="w-8 h-8 text-brand-primary animate-spin"
//               aria-label="Loading workspace data..."
//             />
//             <p className="font-bold uppercase tracking-wider text-muted text-xs">
//               Loading Stock Records...
//             </p>
//           </div>
//         ) : isError ? (
//           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[350px]">
//             <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
//               <AlertCircle size={24} />
//             </div>
//             <div className="space-y-1">
//               <h2 className="uppercase tracking-tight text-foreground font-bold text-sm">
//                 Failed to Load Stock Data
//               </h2>
//               <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
//                 Could not open the stock take sheet. Please check your network connection and try again.
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="flex-1 overflow-x-auto overflow-y-auto scroll-smooth min-h-[350px]">
//             <table className="w-full border-collapse text-left">
//               <thead>
//                 <tr className="h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted select-none">
//                   <th scope="col" className="px-6 font-black min-w-[200px] md:min-w-[250px]">
//                     Product Detail
//                   </th>
//                   <th scope="col" className="px-4 font-black w-24 md:w-32">
//                     System Count
//                   </th>
//                   <th scope="col" className="px-4 font-black w-32 md:w-40">
//                     Actual Count (On-Shelf)
//                   </th>
//                   <th scope="col" className="px-4 font-black w-24 md:w-36">
//                     Difference Delta
//                   </th>
//                   <th scope="col" className="px-6 font-black w-24 md:w-28 text-right">
//                     Commit
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/30 bg-card/10">
//                 {productsList.length === 0 ? (
//                   <tr>
//                     <td colSpan={5} className="py-16 text-center">
//                       <div className="flex flex-col items-center justify-center text-muted gap-3">
//                         <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
//                         <p className="font-bold text-[10px] uppercase tracking-widest text-muted/70">
//                           {debouncedSearch
//                             ? `No stock records matching "${debouncedSearch}"`
//                             : "No inventory products active"}
//                         </p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   productsList.map((product: ProductResponse, index: number) => {
//                     const keyId = product.id || (product as unknown as { product_id?: string }).product_id || `prod-${index}`;
//                     return (
//                       <AuditTableRow
//                         key={keyId}
//                         product={product}
//                         businessId={businessId}
//                         onSaveSuccess={handleRowSave}
//                       />
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Navigation Footer */}
//         <footer className="p-3 bg-surface/30 border-t border-border/40 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
//           <div className="text-[11px] font-medium text-muted tabular-nums">
//             Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
//             <span className="font-bold text-foreground">{endRecord}</span> of{" "}
//             <span className="font-bold text-foreground">{totalRecords}</span> records
//           </div>

//           <div className="flex items-center gap-1.5">
//             <span className="text-[11px] font-semibold text-muted mr-2 tabular-nums">
//               Page {currentPage} of {totalPages}
//             </span>

//             <button
//               type="button"
//               onClick={() => handlePageChange(1)}
//               disabled={currentPage === 1 || isFetching || isPending}
//               className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="First page"
//             >
//               <ChevronsLeft size={16} />
//             </button>

//             <button
//               type="button"
//               onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
//               disabled={currentPage === 1 || isFetching || isPending}
//               className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={16} />
//             </button>

//             <button
//               type="button"
//               onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
//               disabled={currentPage >= totalPages || isFetching || isPending}
//               className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="Next page"
//             >
//               <ChevronRight size={16} />
//             </button>

//             <button
//               type="button"
//               onClick={() => handlePageChange(totalPages)}
//               disabled={currentPage >= totalPages || isFetching || isPending}
//               className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="Last page"
//             >
//               <ChevronsRight size={16} />
//             </button>
//           </div>
//         </footer>
//       </section>
//     </main>
//   );
// };


"use client";

import React, {
  useState,
  useEffect,
  useId,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { AuditTableRow } from "@/features/inventory/AuditTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";
import { ProductSearchBar } from "@/features/store/products/components/ProductSearchBar";
import { ProductResponse } from "@/lib/api/generated/models";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

interface AuditWorkspaceProps {
  businessId: string;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
  const { organizationId } = useBusinessContext();
  const rowsPerPageSelectId = useId();
  const [isPending, startTransition] = useTransition();

  // Controlled UI search input state vs. network-query debounced search term
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Debounce Engine: Delays network query by 300ms to prevent request thrashing & optimize INP
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchTerm);
        setPage(1); // Reset pagination cursor on keyword shift
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Server-paginated product catalog hook
  const {
    products,
    pagination,
    isLoading,
    isError,
    isFetching,
    refresh,
  } = useProducts(
    businessId,
    undefined,
    page,
    limit,
    undefined,
    "desc",
    debouncedSearch
  );

  // Direct array extraction with strict fallback to eliminate rendering exceptions
  const productsList = useMemo<ProductResponse[]>(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  // Pagination telemetry bounds calculations
  const totalRecords = pagination?.total ?? productsList.length;
  const totalPages = Math.max(1, pagination?.pages ?? Math.ceil(totalRecords / limit));
  const currentPage = Math.min(Math.max(1, pagination?.page ?? page), totalPages);

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  // Event Normalizer: Prevents [object Object] stringification on input changes
  const handleSearchInput = useCallback((input: string | React.ChangeEvent<HTMLInputElement>) => {
    const value = typeof input === "string" ? input : input.target.value;
    setSearchTerm(value);
  }, []);

  // Row Mutation Committer with explicit async network boundary
  const handleRowSave = useCallback(
    async (payload: {
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
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to commit stock audit record.");
      }

      await refresh();
    },
    [refresh]
  );

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    startTransition(() => {
      setLimit(newLimit);
      setPage(1);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    startTransition(() => {
      setPage(newPage);
    });
  };

  // Structured Data Schema for WebApp Workspace SEO Context
  const jsonLdSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "NetHub Inventory Audit Workspace",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires HTML5 features",
    }),
    []
  );

  return (
    <main
      id="main-content"
      className="w-full flex flex-col overflow-hidden font-sans antialiased"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Workspace Header */}
      <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 shrink-0 border-b border-border/40">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Stock Take Audit</h1>
          <p className="text-xs text-muted font-medium">
            Reconcile physical inventory counts against system balances.
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <Link
            href={`/org/${organizationId}/${businessId}/stock/restock`}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] min-w-[44px] bg-brand-secondary text-background rounded-xl text-xs font-bold transition-all shadow-md hover:bg-brand-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-[0.98]"
          >
            <Plus size={14} strokeWidth={3} className="shrink-0" />
            <span>Add New Stock</span>
          </Link>
        </div>
      </header>

      {/* Primary Audit Worksheet */}
      <section
        aria-label="Audit Worksheet Data"
        aria-busy={isLoading || isFetching || isPending}
        className="mt-4 bg-card border border-border/60 rounded-[1.5rem] shadow-sm flex flex-col overflow-hidden min-h-[500px]"
      >
        {/* Worksheet Controls Bar */}
        <div className="p-4 bg-surface/20 border-b border-border/40 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <ProductSearchBar
            onSearch={handleSearchInput}
            isFetching={isFetching || isPending}
            placeholder="Filter catalog by name, SKU, or barcode..."
          />

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label
                htmlFor={rowsPerPageSelectId}
                className="text-[11px] font-semibold text-muted whitespace-nowrap"
              >
                Rows per page:
              </label>
              <select
                id={rowsPerPageSelectId}
                value={limit}
                onChange={handlePageSizeChange}
                className="min-h-[44px] px-3 rounded-lg bg-background border border-border/60 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0 bg-surface/60 px-3 py-2.5 rounded-lg border border-border/40">
              Showing <span className="text-brand-primary font-black">{productsList.length}</span>{" "}
              of <span className="text-foreground font-black">{totalRecords}</span> Total
            </div>
          </div>
        </div>

        {/* State Container: Loading / Error / Tabular Content */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 min-h-[350px]">
            <Loader2
              className="w-8 h-8 text-brand-primary animate-spin"
              aria-label="Loading workspace data..."
            />
            <p className="font-bold uppercase tracking-wider text-muted text-xs">
              Loading Stock Records...
            </p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[350px]">
            <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="uppercase tracking-tight text-foreground font-bold text-sm">
                Failed to Load Stock Data
              </h2>
              <p className="text-muted font-medium max-w-sm text-xs leading-relaxed">
                Could not open the stock take sheet. Please check your network connection and try again.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-auto scroll-smooth min-h-[350px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="h-11 bg-surface/40 border-b border-border/60 font-black uppercase tracking-widest text-[9px] text-muted select-none">
                  <th scope="col" className="px-6 font-black min-w-[200px] md:min-w-[250px]">
                    Product Detail
                  </th>
                  <th scope="col" className="px-4 font-black w-24 md:w-32">
                    System Count
                  </th>
                  <th scope="col" className="px-4 font-black w-32 md:w-40">
                    Actual Count (On-Shelf)
                  </th>
                  <th scope="col" className="px-4 font-black w-24 md:w-36">
                    Difference Delta
                  </th>
                  <th scope="col" className="px-6 font-black w-24 md:w-28 text-right">
                    Commit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-card/10">
                {productsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-muted gap-3">
                        <Package size={38} className="opacity-40 text-muted" strokeWidth={1.25} />
                        <p className="font-bold text-[10px] uppercase tracking-widest text-muted/70">
                          {debouncedSearch
                            ? `No stock records matching "${debouncedSearch}"`
                            : "No inventory products active"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productsList.map((product: ProductResponse, index: number) => {
                    const keyId =
                      product.id ||
                      (product as unknown as { product_id?: string }).product_id ||
                      `audit-row-${businessId}-${index}`;

                    return (
                      <AuditTableRow
                        key={keyId}
                        product={product}
                        businessId={businessId}
                        onSaveSuccess={handleRowSave}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls Footer */}
        <footer className="p-3 bg-surface/30 border-t border-border/40 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[11px] font-medium text-muted tabular-nums">
            Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
            <span className="font-bold text-foreground">{endRecord}</span> of{" "}
            <span className="font-bold text-foreground">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted mr-2 tabular-nums">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || isFetching || isPending}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isFetching || isPending}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isFetching || isPending}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || isFetching || isPending}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
};