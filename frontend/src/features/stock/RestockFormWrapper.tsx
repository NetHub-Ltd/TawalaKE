// "use client";

// import React, { useState, useMemo, useEffect, useId, useTransition } from "react";
// import { useForm, FormProvider } from "react-hook-form";
// import { 
//   Loader2, 
//   AlertCircle, 
//   Package, 
//   Search, 
//   ChevronLeft, 
//   ChevronRight, 
//   ChevronsLeft, 
//   ChevronsRight 
// } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { StockTakingTableRow } from "@/features/stock/StockTakingTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";

// interface RestockFormWrapperProps {
//   businessId: string;
// }

// interface FormValues {
//   stocks: Record<
//     string,
//     {
//       physicalCount: number;
//       costPrice: number;
//       retailPrice: number;
//     }
//   >;
// }

// // Sub-component: Isolated Search Bar to preserve INP during rapid typing
// interface SearchInputProps {
//   onSearchChange: (val: string) => void;
//   isFetching?: boolean;
// }

// function DebouncedStockSearch({ onSearchChange, isFetching }: SearchInputProps) {
//   const [localQuery, setLocalQuery] = useState("");
//   const searchInputId = useId();

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       onSearchChange(localQuery);
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [localQuery, onSearchChange]);

//   return (
//     <div className="flex flex-1 sm:max-w-md items-center gap-2 px-3.5 min-h-[44px] bg-background border border-border/60 rounded-xl focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all">
//       <Search className="w-4 h-4 text-muted/80 shrink-0 pointer-events-none" aria-hidden="true" />
//       <label htmlFor={searchInputId} className="sr-only">
//         Filter catalog by product name, SKU, or barcode
//       </label>
//       <input
//         id={searchInputId}
//         type="search"
//         placeholder="Filter by product name, SKU, or barcode..."
//         value={localQuery}
//         onChange={(e) => setLocalQuery(e.target.value)}
//         className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted/50 focus:outline-hidden"
//       />
//       {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary shrink-0" />}
//     </div>
//   );
// }

// export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [itemsPerPage, setItemsPerPage] = useState<number>(10);
//   const [debouncedSearch, setDebouncedSearch] = useState<string>("");
//   const rowsPerPageId = useId();

//   // Reset pagination when search query or items per page change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [debouncedSearch, itemsPerPage]);

//   const {
//     products = [],
//     pagination,
//     isLoading,
//     isError,
//     isFetching,
//     queryClient,
//   } = useProducts(
//     businessId, 
//     undefined, 
//     currentPage, 
//     itemsPerPage, 
//     undefined, 
//     undefined, 
//     debouncedSearch
//   );

//   const [isPending, startTransition] = useTransition();

//   const methods = useForm<FormValues>({
//     defaultValues: {
//       stocks: {},
//     },
//     mode: "onChange",
//   });

//   const { handleSubmit } = methods;

//   const handleSaveStock = async (payload: unknown) => {
//     startTransition(async () => {
//       try {
//         const res = await fetch("/api/v1/business/stock/restock", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         if (!res.ok) {
//           throw new Error("Failed to save stock ledger transaction data");
//         }

//         if (queryClient) {
//           await queryClient.invalidateQueries({
//             queryKey: ["products", businessId],
//           });
//         }
//       } catch (error) {
//         console.error("Failed to persist stock taking mutation state", error);
//         throw error;
//       }
//     });
//   };

//   // Safe fallback filter in case server query doesn't handle inline text filtering
//   const filteredProducts = useMemo(() => {
//     if (!debouncedSearch.trim()) return products;
    
//     const query = debouncedSearch.toLowerCase().trim();
//     return products.filter((product: ProductResponse) => {
//       const nameMatch = product.label?.toLowerCase().includes(query);
//       const skuMatch = product.attributes?.sku?.toLowerCase().includes(query);
//       return nameMatch || skuMatch;
//     });
//   }, [products, debouncedSearch]);

//   const totalRecords = pagination?.total ?? 0;
//   const totalPages = pagination?.pages ?? 1;
//   const activePage = pagination?.page ?? currentPage;

//   const startRecord = totalRecords === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
//   const endRecord = Math.min(activePage * itemsPerPage, totalRecords);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//   };

//   const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const onSubmit = async (data: FormValues) => {
//     await handleSaveStock(data.stocks);
//   };

//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebApplication",
//     name: "NetHub Restock Ledger Management",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "All",
//     browserRequirements: "Requires HTML5 features",
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift animate-pulse p-4 space-y-4">
//         <div className="bg-surface/40 border-b border-border/40 p-4 flex justify-between items-center rounded-xl">
//           <div className="h-4 bg-muted/30 rounded w-1/4" />
//           <div className="h-7 bg-muted/20 rounded-xl w-24" />
//         </div>
//         <div className="space-y-3">
//           {[1, 2, 3, 4].map((index) => (
//             <div key={index} className="h-12 bg-muted/20 rounded-xl w-full" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div 
//         className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-xs" 
//         role="alert"
//       >
//         <AlertCircle className="w-4 h-4 shrink-0" />
//         <span>Failed to pull active catalog sync nodes. Please inspect your connection parameters.</span>
//       </div>
//     );
//   }

//   if (totalRecords === 0 && !debouncedSearch) {
//     return (
//       <div className="bg-card border border-border/60 rounded-[1.5rem] p-12 text-center shadow-lift flex flex-col items-center justify-center gap-2">
//         <Package className="w-10 h-10 text-muted/40 mb-2" strokeWidth={1.25} />
//         <h2 className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</h2>
//         <p className="text-xs text-muted font-medium max-w-sm">
//           Add items to your catalog registry to activate your stock-taking node lines.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <main id="main-content" className="w-full flex flex-col overflow-hidden font-sans antialiased">
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />

//       <FormProvider {...methods}>
//         <form 
//           onSubmit={handleSubmit(onSubmit)} 
//           className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift transition-all duration-300 relative flex flex-col min-h-[500px]"
//         >
//           {/* INTERFACE CONTROL BAR */}
//           <div className="p-4 bg-surface/20 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
//             <DebouncedStockSearch 
//               onSearchChange={setDebouncedSearch} 
//               isFetching={isFetching}
//             />

//             <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
//               {isPending && (
//                 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded-lg border border-brand-secondary/20 uppercase tracking-widest animate-pulse">
//                   <Loader2 className="w-3 h-3 animate-spin" /> Syncing
//                 </div>
//               )}

//               <div className="flex items-center gap-2">
//                 <label htmlFor={rowsPerPageId} className="text-[11px] font-semibold text-muted whitespace-nowrap">
//                   Rows per page:
//                 </label>
//                 <select
//                   id={rowsPerPageId}
//                   value={itemsPerPage}
//                   onChange={handlePageSizeChange}
//                   className="min-h-[44px] px-3 rounded-lg bg-background border border-border/60 text-xs font-bold text-foreground focus:outline-hidden focus:border-brand-primary/60 cursor-pointer"
//                 >
//                   <option value={10}>10</option>
//                   <option value={20}>20</option>
//                   <option value={50}>50</option>
//                   <option value={100}>100</option>
//                 </select>
//               </div>

//               <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0 bg-surface/60 px-3 py-2 rounded-lg border border-border/40">
//                 Showing <span className="text-brand-primary font-black">{filteredProducts.length}</span> of <span className="text-foreground font-black">{totalRecords}</span> Total
//               </div>
//             </div>
//           </div>
          
//           {/* STRUCTURAL SEMANTIC TABLE CONTAINER GRID */}
//           <div className="flex-1 overflow-x-auto min-h-[350px]">
//             {filteredProducts.length === 0 ? (
//               <div className="py-16 text-center text-muted flex flex-col items-center justify-center gap-2">
//                 <Package className="w-8 h-8 text-muted/40" strokeWidth={1.25} />
//                 <p className="text-xs font-semibold uppercase tracking-wider">No matching products found on this page</p>
//               </div>
//             ) : (
//               <table className="w-full border-separate border-spacing-y-2 text-left min-w-[900px]">
//                 <StockTableHeader />
//                 <StockTableBody 
//                   products={filteredProducts} 
//                   businessId={businessId} 
//                   onSaveSuccess={handleSaveStock} 
//                 />
//               </table>
//             )}
//           </div>

//           {/* BOTTOM PAGINATION BAR */}
//           <footer className="px-5 py-3 bg-surface/30 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 select-none">
//             <div className="text-[11px] font-medium text-muted tabular-nums">
//               Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
//               <span className="font-bold text-foreground">{endRecord}</span> of{" "}
//               <span className="font-bold text-foreground">{totalRecords}</span> records
//             </div>

//             <div className="flex items-center gap-1.5">
//               <span className="text-[11px] font-semibold text-muted mr-2 tabular-nums">
//                 Page {activePage} of {totalPages}
//               </span>

//               <button
//                 type="button"
//                 onClick={() => handlePageChange(1)}
//                 disabled={activePage === 1 || isFetching}
//                 className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
//                 aria-label="First page"
//               >
//                 <ChevronsLeft className="w-4 h-4" />
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handlePageChange(activePage - 1)}
//                 disabled={activePage === 1 || isFetching}
//                 className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
//                 aria-label="Previous page"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handlePageChange(activePage + 1)}
//                 disabled={activePage >= totalPages || isFetching}
//                 className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
//                 aria-label="Next page"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//               <button
//                 type="button"
//                 onClick={() => handlePageChange(totalPages)}
//                 disabled={activePage >= totalPages || isFetching}
//                 className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-primary"
//                 aria-label="Last page"
//               >
//                 <ChevronsRight className="w-4 h-4" />
//               </button>
//             </div>
//           </footer>
//         </form>
//       </FormProvider>
//     </main>
//   );
// }

// export function StockTableHeader() {
//   return (
//     <thead className="sticky top-0 z-20 bg-surface/50 backdrop-blur-xs border-b border-border/60 text-[9px] font-black text-muted uppercase tracking-widest select-none">
//       <tr>
//         <th scope="col" className="px-6 py-3.5 min-w-[320px]">Product Specifications</th>
//         <th scope="col" className="px-6 py-3.5 w-32">Physical Count</th>
//         <th scope="col" className="px-6 py-3.5 w-36">Cost Price</th>
//         <th scope="col" className="px-6 py-3.5 w-36">Retail Price</th>
//         <th scope="col" className="px-6 py-3.5 w-32 text-right">Actions</th>
//       </tr>
//     </thead>
//   );
// }

// interface StockTableBodyProps {
//   products: ProductResponse[];
//   businessId: string;
//   onSaveSuccess: (payload: unknown) => Promise<void>;
// }

// export function StockTableBody({ products, businessId, onSaveSuccess }: StockTableBodyProps) {
//   return (
//     <tbody className="divide-y divide-border/40 bg-card/10">
//       {products.map((item: ProductResponse) => (
//         <StockTakingTableRow 
//           key={item.id}
//           product={item} 
//           businessId={businessId} 
//           onSaveSuccess={onSaveSuccess} 
//         />
//       ))}
//     </tbody>
//   );
// }

"use client";

import React, {
  useState,
  useEffect,
  useId,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Loader2,
  AlertCircle,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { StockTakingTableRow } from "@/features/stock/StockTakingTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";

interface RestockFormWrapperProps {
  businessId: string;
}

interface FormValues {
  stocks: Record<
    string,
    {
      physicalCount: number;
      costPrice: number;
      retailPrice: number;
    }
  >;
}

interface SearchInputProps {
  onSearchChange: (val: string) => void;
  isFetching?: boolean;
}

/**
 * Isolated Search Input component to decouple keystrokes from parent re-renders.
 */
function DebouncedStockSearch({ onSearchChange, isFetching }: SearchInputProps) {
  const [localQuery, setLocalQuery] = useState<string>("");
  const searchInputId = useId();

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  return (
    <div className="flex flex-1 sm:max-w-md items-center gap-2 px-3.5 min-h-[44px] bg-background border border-border/60 rounded-xl focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
      <Search className="w-4 h-4 text-muted/80 shrink-0 pointer-events-none" aria-hidden="true" />
      <label htmlFor={searchInputId} className="sr-only">
        Filter catalog by product name, SKU, or barcode
      </label>
      <input
        id={searchInputId}
        type="search"
        placeholder="Filter by product name, SKU, or barcode..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted/50 focus:outline-none"
      />
      {isFetching && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary shrink-0" aria-label="Fetching products..." />
      )}
    </div>
  );
}

export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const rowsPerPageId = useId();

  // Reset pagination when search query or items per page shift
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, itemsPerPage]);

  // Handle incoming search query via non-blocking transition
  const handleSearchChange = useCallback((query: string) => {
    startTransition(() => {
      setDebouncedSearch(query);
    });
  }, []);

  const {
    products = [],
    pagination,
    isLoading,
    isError,
    isFetching,
    queryClient,
  } = useProducts(
    businessId,
    undefined,
    currentPage,
    itemsPerPage,
    undefined,
    undefined,
    debouncedSearch
  );

  const methods = useForm<FormValues>({
    defaultValues: {
      stocks: {},
    },
    mode: "onChange",
  });

  const { handleSubmit } = methods;

  const handleSaveStock = async (payload: unknown) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/business/stock/restock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed to save stock ledger transaction data");
        }

        if (queryClient) {
          await queryClient.invalidateQueries({
            queryKey: ["products", businessId],
          });
        }
      } catch (error) {
        console.error("Failed to persist stock taking mutation state", error);
        throw error;
      }
    });
  };

  const totalRecords = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.pages ?? Math.ceil(totalRecords / itemsPerPage));
  const activePage = Math.min(Math.max(1, pagination?.page ?? currentPage), totalPages);

  const startRecord = totalRecords === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(activePage * itemsPerPage, totalRecords);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === activePage) return;
    startTransition(() => {
      setCurrentPage(page);
    });
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    startTransition(() => {
      setItemsPerPage(newSize);
      setCurrentPage(1);
    });
  };

  const onSubmit = async (data: FormValues) => {
    await handleSaveStock(data.stocks);
  };

  const jsonLdSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "NetHub Restock Ledger Management",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires HTML5 features",
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-xs animate-pulse p-4 space-y-4">
        <div className="bg-surface/40 border-b border-border/40 p-4 flex justify-between items-center rounded-xl">
          <div className="h-4 bg-muted/30 rounded w-1/4" />
          <div className="h-7 bg-muted/20 rounded-xl w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((index) => (
            <div key={`skeleton-row-${index}`} className="h-12 bg-muted/20 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-xs"
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Failed to pull active catalog sync nodes. Please inspect your connection parameters.</span>
      </div>
    );
  }

  if (totalRecords === 0 && !debouncedSearch) {
    return (
      <div className="bg-card border border-border/60 rounded-[1.5rem] p-12 text-center shadow-xs flex flex-col items-center justify-center gap-2">
        <Package className="w-10 h-10 text-muted/40 mb-2" strokeWidth={1.25} />
        <h2 className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</h2>
        <p className="text-xs text-muted font-medium max-w-sm">
          Add items to your catalog registry to activate your stock-taking node lines.
        </p>
      </div>
    );
  }

  return (
    <main id="main-content" className="w-full flex flex-col overflow-hidden font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-xs transition-all duration-300 relative flex flex-col min-h-[500px]"
        >
          {/* INTERFACE CONTROL BAR */}
          <div className="p-4 bg-surface/20 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <DebouncedStockSearch
              onSearchChange={handleSearchChange}
              isFetching={isFetching || isPending}
            />

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {isPending && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded-lg border border-brand-secondary/20 uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing
                </div>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor={rowsPerPageId} className="text-[11px] font-semibold text-muted whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id={rowsPerPageId}
                  value={itemsPerPage}
                  onChange={handlePageSizeChange}
                  className="min-h-[44px] px-3 rounded-lg bg-background border border-border/60 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono shrink-0 bg-surface/60 px-3 py-2 rounded-lg border border-border/40">
                Showing <span className="text-brand-primary font-black">{products.length}</span> of{" "}
                <span className="text-foreground font-black">{totalRecords}</span> Total
              </div>
            </div>
          </div>

          {/* STRUCTURAL SEMANTIC TABLE CONTAINER GRID */}
          <div className="flex-1 overflow-x-auto min-h-[350px]">
            {products.length === 0 ? (
              <div className="py-16 text-center text-muted flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-muted/40" strokeWidth={1.25} />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {debouncedSearch
                    ? `No matching products found for "${debouncedSearch}"`
                    : "No products available on this page"}
                </p>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-y-2 text-left min-w-[900px]">
                <StockTableHeader />
                <StockTableBody
                  products={products}
                  businessId={businessId}
                  onSaveSuccess={handleSaveStock}
                />
              </table>
            )}
          </div>

          {/* BOTTOM PAGINATION BAR */}
          <footer className="px-5 py-3 bg-surface/30 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 select-none">
            <div className="text-[11px] font-medium text-muted tabular-nums">
              Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
              <span className="font-bold text-foreground">{endRecord}</span> of{" "}
              <span className="font-bold text-foreground">{totalRecords}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted mr-2 tabular-nums">
                Page {activePage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={activePage <= 1 || isFetching || isPending}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1 || isFetching || isPending}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage >= totalPages || isFetching || isPending}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={activePage >= totalPages || isFetching || isPending}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </form>
      </FormProvider>
    </main>
  );
}

export function StockTableHeader() {
  return (
    <thead className="sticky top-0 z-20 bg-surface/50 backdrop-blur-xs border-b border-border/60 text-[9px] font-black text-muted uppercase tracking-widest select-none">
      <tr>
        <th scope="col" className="px-6 py-3.5 min-w-[320px]">Product Specifications</th>
        <th scope="col" className="px-6 py-3.5 w-32">Physical Count</th>
        <th scope="col" className="px-6 py-3.5 w-36">Cost Price</th>
        <th scope="col" className="px-6 py-3.5 w-36">Retail Price</th>
        <th scope="col" className="px-6 py-3.5 w-32 text-right">Actions</th>
      </tr>
    </thead>
  );
}

interface StockTableBodyProps {
  products: ProductResponse[];
  businessId: string;
  onSaveSuccess: (payload: unknown) => Promise<void>;
}

export function StockTableBody({ products, businessId, onSaveSuccess }: StockTableBodyProps) {
  return (
    <tbody className="divide-y divide-border/40 bg-card/10">
      {products.map((item: ProductResponse, index: number) => {
        const keyId =
          item.id ||
          (item as unknown as { product_id?: string }).product_id ||
          `stock-row-${businessId}-${index}`;

        return (
          <StockTakingTableRow
            key={keyId}
            product={item}
            businessId={businessId}
            onSaveSuccess={onSaveSuccess}
          />
        );
      })}
    </tbody>
  );
}