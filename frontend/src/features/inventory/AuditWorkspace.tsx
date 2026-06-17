// "use client";

// import React from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { Loader2, AlertCircle, Package } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import Link from "next/link";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
//   const {organizationId} = useBusinessContext()
  
//   const { products = [], isLoading, isError } = useProducts(businessId);

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
//       throw new Error(errorData?.detail || "Network engine returned an error persisting stock audit updates.");
//     }

//     const responseData = await res.json();
//     console.log("📋 [Backend Response] -> POST /api/v1/business/stock/audit", responseData);

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

//   if (isLoading) {
//     return (
//       <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
//         <p className="font-bold uppercase tracking-widest text-muted">
//           Loading Workspace Ledger Data...
//         </p>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="w-full max-w-xl mx-auto my-12 p-8 bg-card rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center gap-4">
//         <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
//           <AlertCircle size={24} />
//         </div>
//         <div className="space-y-2">
//           <h3 className="uppercase tracking-tight text-foreground font-bold">
//             Data Load Execution Failure
//           </h3>
//           <p className="text-muted font-medium max-w-sm">
//             Failed to assemble the interactive audit worksheet framework context.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const physicalItemsOnly = (products as ProductResponse[]).filter(
//     (product) => product.track_stock !== false
//   );

//   return (
//     // Canvas Frame: Structured wrapper establishes layout isolation over your body's gradient
//     <div className="w-full max-w-6xl mx-auto p-6 md:p-8 rounded-2xl bg-surface/30 border border-border/20 backdrop-blur-xs space-y-8">
      
//       {/* Guiding Action Header Block */}
//       <header className="flex flex-col gap-2 max-w-3xl">
//         <h2 className="uppercase tracking-tight font-black text-foreground">
//           Inventory Discrepancy & Stock Audit
//         </h2>
//         <p className="font-medium text-muted">
//           Compare actual physical shelf counts against system bookkeeping balances below. 
//           Updating a value corrects live catalog visibility instantly. Any count causing a status 
//           variance requires a clear compliance reason code and verification note before changes can be saved.
//         </p>

//         <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
//              <span>New Stock</span>
//           </Link>
//       </header>

//       {/* Main Grid Ledger Container - Grounded flat shadow structure */}
//       <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        
//         {/* Table Column Identification Ribbon Header */}
//         <div className="hidden md:flex items-center px-6 py-4 bg-background/60 border-b border-border/60 font-bold uppercase tracking-widest text-muted">
//           <div className="flex-1 md:min-w-[250px]">Tracked Asset Details</div>
//           <div className="md:w-32">Book Balance</div>
//           <div className="md:w-36">Physical Count</div>
//           <div className="md:w-36">Live Discrepancy</div>
//           <div className="md:w-28 text-right">Actions</div>
//         </div>

//         {/* Data Layer Iteration Processing View */}
//         <div className="divide-y divide-border/30 bg-card">
//           {physicalItemsOnly.length === 0 ? (
//             <div className="min-h-[30vh] flex flex-col items-center justify-center text-muted p-6 gap-3">
//               <Package size={36} className="opacity-30 text-muted" />
//               <p className="font-bold uppercase tracking-widest">
//                 No stock-tracked items found in this store registry
//               </p>
//             </div>
//           ) : (
//             physicalItemsOnly.map((product) => (
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
//     </div>
//   );
// };

"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuditTableRow } from "@/features/inventory/AuditTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";
import { Loader2, AlertCircle, Package, Plus } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import Link from "next/link";

interface AuditWorkspaceProps {
  businessId: string;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
  const queryClient = useQueryClient();
  const { organizationId } = useBusinessContext();
  
  const { products = [], isLoading, isError } = useProducts(businessId);

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

    const responseData = await res.json();
    console.log("📋 [Stock Adjusted] ->", responseData);

    queryClient.setQueryData(["products", businessId], (oldCacheData: any) => {
      if (!oldCacheData) return oldCacheData;

      const updateList = (items: ProductResponse[]) =>
        items.map((p) =>
          p.id === payload.product_id ? { ...p, stock: payload.quantity } : p
        );

      if (Array.isArray(oldCacheData)) {
        return updateList(oldCacheData);
      }
      if (oldCacheData && Array.isArray(oldCacheData.products)) {
        return {
          ...oldCacheData,
          products: updateList(oldCacheData.products),
        };
      }

      return oldCacheData;
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-background/50 gap-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="font-bold uppercase tracking-wider text-muted text-xs">
          Loading Stock Records...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-xl mx-auto  p-4 bg-card rounded-2xl border border-border/40 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center border border-brand-primary/20">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-tight text-foreground font-bold text-sm">
            Failed to Load Stock Data
          </h3>
          <p className="text-muted font-medium max-w-sm text-xs">
            Could not open the stock take sheet. Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  const physicalItemsOnly = (products as ProductResponse[]).filter(
    (product) => product.track_stock !== false
  );

  return (
    /* PARENT CONTAINER LOCK: Forces maximum page bounds, freezing header layout positions completely */
    <div className="w-full mx-auto px-4 p-4 flex flex-col h-screen max-h-screen overflow-hidden">
      
      {/* 1. Static Header Information Area */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 shrink-0 border-b border-border/40">
        <div className="space-y-1 max-w-3xl">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Stock Take & Adjustments
          </h2>
          <p className="text-muted leading-relaxed">
            Count what is physically on your shelves and match it with the system count below. 
            Saving a change updates your store stock numbers immediately. 
            If counts do not match, you must select a reason code before saving.
          </p>
        </div>

        {/* Highlighted, Business-Friendly Link Action Button */}
        <div className="shrink-0 flex items-center">
          <Link href={`/org/${organizationId}/${businessId}/stock/restock`} passHref legacyBehavior>
            <button className="inline-flex items-center gap-2 px-4 h-9 bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer">
              <Plus size={14} strokeWidth={3} className="shrink-0" />
              <span>Add New Stock</span>
            </button>
          </Link>
        </div>
      </header>

      {/* 2. Frozen Table Framework: Consumes exactly the rest of the window view area */}
      <div className="flex-1 min-h-0 my-6 bg-card border border-border/60 rounded-xl shadow-xs flex flex-col overflow-hidden">
        
        {/* 3. Static Column Ribbons: Never scrolls or shifts out of view */}
        <div className="flex items-center px-6 py-4 bg-background border-b border-border/60 font-bold uppercase tracking-widest text-[10px] text-muted shrink-0 select-none z-10">
          <div className="flex-1 md:min-w-[250px]">Product Details</div>
          <div className="md:w-32">System Count</div>
          <div className="md:w-36">Actual Count (On-Shelf)</div>
          <div className="md:w-36">Difference</div>
          <div className="md:w-28 text-right">Actions</div>
        </div>

        {/* 4. Mapped Row Node Feed Layer: The only fluid viewport context area permitted to scroll */}
        <div className="flex-1 overflow-y-auto scroll-smooth divide-y divide-border/30 bg-card">
          {physicalItemsOnly.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted p-6 gap-3">
              <Package size={36} className="opacity-30 text-muted" strokeWidth={1.5} />
              <p className="font-bold text-xs uppercase tracking-widest text-center">
                No stock-tracked products found in your store.
              </p>
            </div>
          ) : (
            physicalItemsOnly.map((product) => (
              <AuditTableRow
                key={product.id}
                product={product}
                businessId={businessId}
                onSaveSuccess={handleRowSave}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};