// "use client";

// import React, { useTransition, useState, useMemo } from "react";
// import { useForm, FormProvider } from "react-hook-form";
// import { 
//   Loader2, 
//   AlertCircle, 
//   Inbox, 
//   Layers, 
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

// // =========================================================
// // Main Container Component
// // =========================================================
// export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
//   const { products = [], isLoading, isError, queryClient } = useProducts(businessId);
//   const [isPending, startTransition] = useTransition();

//   // Search & Pagination States
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

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

//   // Case-Insensitive Filter System
//   const filteredProducts = useMemo(() => {
//     if (!searchTerm.trim()) return products;
    
//     const normalizedQuery = searchTerm.toLowerCase().trim();
//     return products.filter((product) => {
//       const labelMatch = product.label?.toLowerCase().includes(normalizedQuery);
//       const skuMatch = product.attributes?.sku?.toLowerCase().includes(normalizedQuery);
//       const categoryMatch = product.category?.toLowerCase().includes(normalizedQuery);
//       return labelMatch || skuMatch || categoryMatch;
//     });
//   }, [products, searchTerm]);

//   // Pagination Calculations
//   const totalItems = filteredProducts.length;
//   const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
//   const activePage = currentPage > totalPages ? totalPages : currentPage;

//   const paginatedProducts = useMemo(() => {
//     const startIndex = (activePage - 1) * itemsPerPage;
//     return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
//   }, [filteredProducts, activePage, itemsPerPage]);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//   };

//   const onSubmit = async (data: FormValues) => {
//     await handleSaveStock(data.stocks);
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift animate-pulse">
//         <div className="p-4 bg-surface/40 border-b border-border/40 flex justify-between items-center">
//           <div className="h-4 bg-muted/30 rounded w-1/4" />
//           <div className="h-7 bg-muted/20 rounded-xl w-24" />
//         </div>
//         <table className="w-full border-collapse text-left">
//           <thead className="hidden lg:table-header-group">
//             <tr className="bg-surface/30 border-b border-border/40">
//               <th className="px-6 py-4 min-w-[280px]"><div className="h-3 bg-muted/40 rounded w-1/3" /></th>
//               <th className="px-6 py-4 w-32"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
//               <th className="px-6 py-4 w-36"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
//               <th className="px-6 py-4 w-36"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
//               <th className="px-6 py-4 w-32 text-right"><div className="h-3 bg-muted/40 rounded w-1/2 ml-auto" /></th>
//             </tr>
//           </thead>
//           <tbody>
//             {[1, 2].map((index) => (
//               <tr key={index} className="border-b border-border/30">
//                 <td colSpan={5} className="p-6 space-y-4">
//                   <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//                     <div className="flex-1 min-w-[280px] space-y-2">
//                       <div className="h-4 bg-muted/30 rounded w-2/3" />
//                       <div className="h-3 bg-muted/20 rounded w-1/3" />
//                     </div>
//                     <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
//                       <div className="w-full sm:w-28 h-10 bg-muted/20 rounded-lg" />
//                       <div className="w-full sm:w-32 h-10 bg-muted/20 rounded-lg" />
//                       <div className="w-full sm:w-32 h-10 bg-muted/20 rounded-lg" />
//                     </div>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-xs" role="alert">
//         <AlertCircle className="w-4 h-4 shrink-0" />
//         <span>Failed to pull active catalog sync nodes. Please inspect your connection parameters.</span>
//       </div>
//     );
//   }

//   if (products.length === 0) {
//     return (
//       <div className="bg-card border border-border/60 rounded-[1.5rem] p-12 text-center shadow-lift">
//         <Inbox className="w-8 h-8 text-muted/40 mx-auto mb-3" />
//         <p className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</p>
//         <p className="text-xs text-muted font-medium mt-1">Add items to your catalog registry to activate your stock-taking node lines.</p>
//       </div>
//     );
//   }

//   return (
//     <FormProvider {...methods}>
//       <form 
//         onSubmit={handleSubmit(onSubmit)} 
//         className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift transition-all duration-300 relative flex flex-col min-h-0"
//       >
//         {/* INTERFACE CONTROL BAR */}
//         <div className="p-4 bg-surface/40 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
//               <Layers className="w-4 h-4" />
//             </div>
//             <div>
//               <h3 className="text-xs font-black uppercase tracking-wider text-foreground m-0 p-0 leading-none">
//                 Stock Counter Ledger
//               </h3>
//               <p className="text-[10px] text-muted font-semibold mt-1">
//                 Batch updates for active node inventory lines ({filteredProducts.length} filtered).
//               </p>
//             </div>
//           </div>

//           {/* Interactive Case-Insensitive Filter Search Input */}
//           <div className="flex flex-1 sm:max-w-xs items-center gap-2.5 px-3 py-2 bg-background border border-border/60 rounded-xl focus-within:border-brand-primary/50 transition-all">
//             <Search className="w-4 h-4 text-muted shrink-0" />
//             <input
//               type="text"
//               placeholder="Search product, SKU or category..."
//               value={searchTerm}
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className="w-full bg-transparent text-xs text-foreground placeholder:text-muted/60 focus:outline-none"
//             />
//           </div>

//           <div className="flex items-center gap-3">
//             {isPending && (
//               <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded-lg border border-brand-secondary/20 uppercase tracking-widest animate-pulse">
//                 <Loader2 className="w-3 h-3 animate-spin" /> Syncing Registry
//               </div>
//             )}
//           </div>
//         </div>
        
//         {/* STRUCTURAL SEMANTIC TABLE CONTAINER GRID */}
//         <div className="flex-1 overflow-x-auto min-h-0">
//           {paginatedProducts.length === 0 ? (
//             <div className="py-12 text-center text-muted">
//               <Inbox className="w-6 h-6 mx-auto mb-2 text-muted/40" />
//               <p className="text-xs font-semibold uppercase tracking-wider">No matching results found</p>
//             </div>
//           ) : (
//             <table className="w-full border-collapse text-left min-w-[900px]">
//               <StockTableHeader />
//               <StockTableBody 
//                 products={paginatedProducts} 
//                 businessId={businessId} 
//                 onSaveSuccess={handleSaveStock} 
//               />
//             </table>
//           )}
//         </div>

//         {/* BOTTOM PAGINATION BAR */}
//         <div className="px-5 py-3.5 bg-surface/30 border-t border-border/40 flex items-center justify-between gap-4 shrink-0 select-none">
//           <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
//             Showing {Math.min(totalItems, (activePage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, activePage * itemsPerPage)} of {totalItems} entries
//           </span>

//           <div className="flex items-center gap-1.5">
//             <button
//               type="button"
//               onClick={() => handlePageChange(1)}
//               disabled={activePage === 1}
//               className="p-1.5 rounded-lg border border-border/50 text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted bg-card transition-all cursor-pointer"
//               title="First Page"
//             >
//               <ChevronsLeft className="w-3.5 h-3.5" />
//             </button>
//             <button
//               type="button"
//               onClick={() => handlePageChange(activePage - 1)}
//               disabled={activePage === 1}
//               className="p-1.5 rounded-lg border border-border/50 text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted bg-card transition-all cursor-pointer"
//               title="Previous Page"
//             >
//               <ChevronLeft className="w-3.5 h-3.5" />
//             </button>

//             <span className="text-[10px] font-black uppercase tracking-wider px-3 text-foreground">
//               Page {activePage} of {totalPages}
//             </span>

//             <button
//               type="button"
//               onClick={() => handlePageChange(activePage + 1)}
//               disabled={activePage === totalPages}
//               className="p-1.5 rounded-lg border border-border/50 text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted bg-card transition-all cursor-pointer"
//               title="Next Page"
//             >
//               <ChevronRight className="w-3.5 h-3.5" />
//             </button>
//             <button
//               type="button"
//               onClick={() => handlePageChange(totalPages)}
//               disabled={activePage === totalPages}
//               className="p-1.5 rounded-lg border border-border/50 text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted bg-card transition-all cursor-pointer"
//               title="Last Page"
//             >
//               <ChevronsRight className="w-3.5 h-3.5" />
//             </button>
//           </div>
//         </div>
//       </form>
//     </FormProvider>
//   );
// }

// // =========================================================
// // Sub-Component: Stock Table Header
// // =========================================================
// export function StockTableHeader() {
//   return (
//     <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-xs border-b border-border/40 text-[10px] font-black text-muted uppercase tracking-widest">
//       <tr>
//         <th className="px-6 py-4 font-black min-w-[320px]">Product Specifications</th>
//         <th className="px-6 py-4 font-black w-32">Physical Count</th>
//         <th className="px-6 py-4 font-black w-36">Cost Price</th>
//         <th className="px-6 py-4 font-black w-36">Retail Price</th>
//         <th className="px-6 py-4 font-black w-32 text-right">Actions</th>
//       </tr>
//     </thead>
//   );
// }

// // =========================================================
// // Sub-Component: Stock Table Body
// // =========================================================
// interface StockTableBodyProps {
//   products: ProductResponse[];
//   businessId: string;
//   onSaveSuccess: (payload: any) => Promise<void>;
// }

// export function StockTableBody({ products, businessId, onSaveSuccess }: StockTableBodyProps) {
//   return (
//     <tbody className="divide-y divide-border/30">
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

import React, { useTransition, useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { 
  Loader2, 
  AlertCircle, 
  Package, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
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

// =========================================================
// Main Container Component
// =========================================================
export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    products = [],
    pagination,
    isLoading,
    isError,
    queryClient,
  } = useProducts(businessId, undefined, currentPage, itemsPerPage);

  const [isPending, startTransition] = useTransition();

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

  // Filter current page products against search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const query = searchTerm.toLowerCase().trim();
    return products.filter((product: ProductResponse) => {
      const nameMatch = product.name?.toLowerCase().includes(query);
      const skuMatch = product.sku?.toLowerCase().includes(query);
      const barcodeMatch = product.barcode?.toLowerCase().includes(query);
      return nameMatch || skuMatch || barcodeMatch;
    });
  }, [products, searchTerm]);

  const totalRecords = pagination?.total ?? 0;
  const totalPages = pagination?.pages ?? 1;
  const activePage = pagination?.page ?? currentPage;

  const startRecord = totalRecords === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(activePage * itemsPerPage, totalRecords);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const onSubmit = async (data: FormValues) => {
    await handleSaveStock(data.stocks);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift animate-pulse">
        <div className="p-4 bg-surface/40 border-b border-border/40 flex justify-between items-center">
          <div className="h-4 bg-muted/30 rounded w-1/4" />
          <div className="h-7 bg-muted/20 rounded-xl w-24" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-12 bg-muted/20 rounded-xl w-full" />
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

  if (totalRecords === 0 && !searchTerm) {
    return (
      <div className="bg-card border border-border/60 rounded-[1.5rem] p-12 text-center shadow-lift flex flex-col items-center justify-center gap-2">
        <Package className="w-10 h-10 text-muted/40 mb-2" strokeWidth={1.25} />
        <p className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</p>
        <p className="text-xs text-muted font-medium max-w-sm">
          Add items to your catalog registry to activate your stock-taking node lines.
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden shadow-lift transition-all duration-300 relative flex flex-col min-h-[500px]"
      >
        {/* INTERFACE CONTROL BAR */}
        <div className="p-4 bg-surface/20 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex flex-1 sm:max-w-md items-center gap-2.5 px-3.5 h-9 bg-background border border-border/60 rounded-xl focus-within:border-brand-primary/60 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all">
            <Search className="w-4 h-4 text-muted/80 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by product name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-xs font-medium text-foreground placeholder:text-muted/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            {isPending && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded-lg border border-brand-secondary/20 uppercase tracking-widest animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing
              </div>
            )}

            <div className="flex items-center gap-2">
              <label htmlFor="rows-per-page" className="text-[11px] font-semibold text-muted whitespace-nowrap">
                Rows per page:
              </label>
              <select
                id="rows-per-page"
                value={itemsPerPage}
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
        
        {/* STRUCTURAL SEMANTIC TABLE CONTAINER GRID */}
        <div className="flex-1 overflow-x-auto min-h-[350px]">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-muted flex flex-col items-center justify-center gap-2">
              <Package className="w-8 h-8 text-muted/40" strokeWidth={1.25} />
              <p className="text-xs font-semibold uppercase tracking-wider">No matching products found on this page</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left min-w-[900px]">
              <StockTableHeader />
              <StockTableBody 
                products={filteredProducts} 
                businessId={businessId} 
                onSaveSuccess={handleSaveStock} 
              />
            </table>
          )}
        </div>

        {/* BOTTOM PAGINATION BAR */}
        <footer className="px-5 py-3.5 bg-surface/30 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 select-none">
          <div className="text-[11px] font-medium text-muted">
            Showing <span className="font-bold text-foreground">{startRecord}</span> to{" "}
            <span className="font-bold text-foreground">{endRecord}</span> of{" "}
            <span className="font-bold text-foreground">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted mr-2">
              Page {activePage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage >= totalPages}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={activePage >= totalPages}
              className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-surface transition-colors cursor-pointer"
              aria-label="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </form>
    </FormProvider>
  );
}

// =========================================================
// Sub-Component: Stock Table Header
// =========================================================
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

// =========================================================
// Sub-Component: Stock Table Body
// =========================================================
interface StockTableBodyProps {
  products: ProductResponse[];
  businessId: string;
  onSaveSuccess: (payload: unknown) => Promise<void>;
}

export function StockTableBody({ products, businessId, onSaveSuccess }: StockTableBodyProps) {
  return (
    <tbody className="divide-y divide-border/40 bg-card/10">
      {products.map((item: ProductResponse) => (
        <StockTakingTableRow 
          key={item.id}
          product={item} 
          businessId={businessId} 
          onSaveSuccess={onSaveSuccess} 
        />
      ))}
    </tbody>
  );
}