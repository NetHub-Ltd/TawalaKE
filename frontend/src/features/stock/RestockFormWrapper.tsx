// // src/app/products/[id]/restock/RestockFormWrapper.tsx
// "use client";

// import React, { useTransition } from "react";
// import { Loader2, AlertCircle, Inbox } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { StockTakingTableRow } from "@/features/stock/StockTakingTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";

// interface RestockFormWrapperProps {
//   businessId: string;
// }

// export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
//   const { products = [], isLoading, isError, queryClient } = useProducts(businessId);
//   const [isPending, startTransition] = useTransition();

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

//         // 1. Instantly clear TanStack Query caches to sync background inventory figures
//         if (queryClient) {
//           await queryClient.invalidateQueries({
//             queryKey: ["products", businessId],
//           });
//         }
        
//       } catch (error) {
//         console.error("Failed to persist stock taking mutation state", error);
//         // 2. CRITICAL: Re-throw error so child component forms can catch it and handle error states
//         throw error;
//       }
//     });
//   };

//   // Elegant Skeleton Loading Screen matching table density layout rules
//   if (isLoading) {
//     return (
//       <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm animate-pulse">
//         {/* Header Static Skeleton Track */}
//         <div className="hidden lg:flex items-center px-4 py-3 bg-surface/40 border-b border-border/40 gap-4">
//           <div className="flex-1 min-w-[220px] h-3 bg-muted/40 rounded" />
//           <div className="w-24 h-3 bg-muted/40 rounded" />
//           <div className="w-28 h-3 bg-muted/40 rounded" />
//           <div className="w-28 h-3 bg-muted/40 rounded" />
//           <div className="w-20 h-3 bg-muted/40 rounded" />
//         </div>
        
//         {/* Multiplying Row Mock Lines */}
//         {[1, 2, 3, 4].map((index) => (
//           <div key={index} className="p-4 border-b border-border/30 space-y-4">
//             <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//               <div className="flex-1 min-w-[220px] space-y-2">
//                 <div className="h-4 bg-muted/30 rounded w-2/3" />
//                 <div className="h-3 bg-muted/20 rounded w-1/3" />
//               </div>
//               <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
//                 <div className="w-full sm:w-24 h-8 bg-muted/20 rounded-lg" />
//                 <div className="w-full sm:w-28 h-8 bg-muted/20 rounded-lg" />
//                 <div className="w-full sm:w-28 h-8 bg-muted/20 rounded-lg" />
//               </div>
//               <div className="w-full lg:w-20 h-8 bg-muted/20 rounded-lg ml-auto" />
//             </div>
//             {/* Undershelf line details mimic */}
//             <div className="pt-2 border-t border-dashed border-border/20 grid grid-cols-1 md:grid-cols-3 gap-3">
//               <div className="h-4 bg-muted/10 rounded w-1/2" />
//               <div className="h-4 bg-muted/10 rounded w-2/3" />
//               <div className="h-4 bg-muted/10 rounded w-3/4" />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div 
//         className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wide"
//         role="alert"
//       >
//         <AlertCircle className="w-4 h-4 shrink-0" />
//         Failed to pull active catalog sync nodes. Please inspect your connection context parameters.
//       </div>
//     );
//   }

//   // Fallback check for blank ledger stores
//   if (products.length === 0) {
//     return (
//       <div className="bg-card border border-border/60 rounded-2xl p-12 text-center shadow-sm">
//         <Inbox className="w-8 h-8 text-muted/40 mx-auto mb-3" />
//         <p className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</p>
//         <p className="text-xs text-muted font-medium mt-1">Add items to your catalog registry to activate your stock-taking node lines.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 relative">
//       {/* Background save worker active mutation overlay */}
//       {isPending && (
//         <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20 uppercase tracking-widest">
//           <Loader2 className="w-3 h-3 animate-spin" /> Mutating Registry
//         </div>
//       )}
      
//       {/* Structural Table Layout Header (Visible only on larger viewports) */}
//       <div className="hidden lg:flex items-center px-4 py-3 bg-surface/50 border-b border-border/40 text-[10px] font-black text-muted uppercase tracking-widest gap-4">
//         <div className="flex-1 min-w-[220px]">Product Specifications</div>
//         <div className="w-24">Physical Count</div>
//         <div className="w-28">Cost Price</div>
//         <div className="w-28">Retail Price</div>
//         <div className="w-20 text-right">Actions</div>
//       </div>

//       {/* Clean mapping pipeline across synchronized backend nodes */}
//       <div className="divide-y divide-border/30">
//         {products.map((item: ProductResponse) => (
//           <StockTakingTableRow 
//             key={item.id}
//             product={item} 
//             businessId={businessId} 
//             onSaveSuccess={handleSaveStock} 
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useTransition } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { StockTakingTableRow } from "@/features/stock/StockTakingTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";

interface RestockFormWrapperProps {
  businessId: string;
}

export function RestockFormWrapper({ businessId }: RestockFormWrapperProps) {
  const { products = [], isLoading, isError, queryClient } = useProducts(businessId);
  const [isPending, startTransition] = useTransition();

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

        // 1. Instantly clear TanStack Query caches to sync background inventory figures
        if (queryClient) {
          await queryClient.invalidateQueries({
            queryKey: ["products", businessId],
          });
        }
        
      } catch (error) {
        console.error("Failed to persist stock taking mutation state", error);
        // 2. CRITICAL: Re-throw error so child component forms can catch it and handle error states
        throw error;
      }
    });
  };

  // Elegant Skeleton Loading Screen matching table density layout rules
  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm animate-pulse">
        <table className="w-full border-collapse text-left">
          <thead className="hidden lg:table-header-group">
            <tr className="bg-surface/40 border-b border-border/40">
              <th className="px-4 py-3 min-w-[220px]"><div className="h-3 bg-muted/40 rounded w-1/3" /></th>
              <th className="px-4 py-3 w-24"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
              <th className="px-4 py-3 w-28"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
              <th className="px-4 py-3 w-28"><div className="h-3 bg-muted/40 rounded w-1/2" /></th>
              <th className="px-4 py-3 w-24 text-right"><div className="h-3 bg-muted/40 rounded w-1/2 ml-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((index) => (
              <tr key={index} className="border-b border-border/30">
                <td colSpan={5} className="p-4 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-[220px] space-y-2">
                      <div className="h-4 bg-muted/30 rounded w-2/3" />
                      <div className="h-3 bg-muted/20 rounded w-1/3" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
                      <div className="w-full sm:w-24 h-8 bg-muted/20 rounded-lg" />
                      <div className="w-full sm:w-28 h-8 bg-muted/20 rounded-lg" />
                      <div className="w-full sm:w-28 h-8 bg-muted/20 rounded-lg" />
                    </div>
                    <div className="w-full lg:w-24 h-8 bg-muted/20 rounded-lg ml-auto" />
                  </div>
                  {/* Undershelf line details mimic */}
                  <div className="pt-2 border-t border-dashed border-border/20 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="h-4 bg-muted/10 rounded w-1/2" />
                    <div className="h-4 bg-muted/10 rounded w-2/3" />
                    <div className="h-4 bg-muted/10 rounded w-3/4" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (isError) {
    return (
      <div 
        className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wide"
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        Failed to pull active catalog sync nodes. Please inspect your connection context parameters.
      </div>
    );
  }

  // Fallback check for blank ledger stores
  if (products.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-12 text-center shadow-sm">
        <Inbox className="w-8 h-8 text-muted/40 mx-auto mb-3" />
        <p className="text-xs font-black uppercase tracking-wider text-foreground">No Products Detected</p>
        <p className="text-xs text-muted font-medium mt-1">Add items to your catalog registry to activate your stock-taking node lines.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 relative">
      {/* Background save worker active mutation overlay */}
      {isPending && (
        <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20 uppercase tracking-widest">
          <Loader2 className="w-3 h-3 animate-spin" /> Mutating Registry
        </div>
      )}
      
      {/* Structural Semantic Table Element Framework */}
      <table className="w-full border-collapse text-left">
        {/* Structural Table Layout Header (Visible only on larger viewports) */}
        <thead className="hidden lg:table-header-group">
          <tr className="bg-surface/50 border-b border-border/40 text-[10px] font-black text-muted uppercase tracking-widest">
            <th className="px-4 py-3 font-black flex-1 min-w-[220px]">Product Specifications</th>
            <th className="px-4 py-3 font-black w-24">Physical Count</th>
            <th className="px-4 py-3 font-black w-28">Cost Price</th>
            <th className="px-4 py-3 font-black w-28">Retail Price</th>
            <th className="px-4 py-3 font-black w-24 text-right">Actions</th>
          </tr>
        </thead>

        {/* Clean mapping pipeline across synchronized backend nodes */}
        <tbody className="divide-y divide-border/30">
          {products.map((item: ProductResponse) => (
            <StockTakingTableRow 
              key={item.id}
              product={item} 
              businessId={businessId} 
              onSaveSuccess={handleSaveStock} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}