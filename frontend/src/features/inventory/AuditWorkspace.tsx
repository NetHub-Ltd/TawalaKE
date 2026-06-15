// // Path: features/inventory/AuditWorkspace.tsx
// "use client";

// import React from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { AuditTableRow } from "@/features/inventory/AuditTableRow";
// import { useProducts } from "@/lib/hooks/useProducts";
// import { Loader2, AlertCircle } from "lucide-react";

// interface AuditWorkspaceProps {
//   businessId: string;
// }

// interface ProductItem {
//   id: string;
//   label: string;
//   selling_price: number;
//   track_stock: boolean;
//   stock: number;
//   active: boolean;
//   category: string;
//   attributes?: {
//     unit_of_measure?: string;
//     buying_price?: number;
//     sku?: string;
//   };
// }

// export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
//   const queryClient = useQueryClient();
  
//   // 1. Read data straight from the TanStack query hook cache layer
//   const { data = [], isLoading, error } = useProducts(businessId);

//   console.log("products", data)

//   if(isLoading){
//     return (
//       <div>
//         <p>Sorry we are loading the juice..., give us a minute

//           {isLoading}

//         </p>
//       </div>
//     )
//   }

//    if(error){
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     return (
//       <div>
//         <p>Sorry we encountered an error tryin to pull up the juice for you: 

//           {errorMessage}

//         </p>
//       </div>
//     )
//   }

//   const handleRowSave = async (payload: any) => {
//     const res = await fetch('/api/v1/business/stock/audit', {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       const errorData = await res.json();
//       throw new Error(errorData?.detail || "Network response returned an execution error.");
//     }

//     const responseData = await res.json();
//     console.log("📋 [Backend Response] -> POST /api/v1/business/stock/audit", responseData);

//     // 2. 🔑 Direct TanStack Query Cache Mutation
//     // Replace `["products", businessId]` with whatever exact queryKey your useProducts hook internally uses
//     queryClient.setQueryData(["products", businessId], (oldData: ProductItem[] | undefined) => {
//       if (!oldData) return [];
//       return oldData.map((p) =>
//         p.id === payload.product_id ? { ...p, stock: payload.quantity } : p
//       );
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-3">
//         <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
//         <p className="text-sm font-medium text-slate-500">Retrieving business master product catalogs...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full max-w-xl mx-auto my-12 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
//         <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
//         <div>
//           <h3 className="text-sm font-bold text-rose-800">Failed to Load Workspace Catalog</h3>
//           <p className="text-xs text-rose-600 mt-1">
//             {(error as any)?.message || "Verify your enterprise network settings or user clearance permissions."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // 3. Filter out non-stock-tracked profiles inline during the map pass
//   // const physicalItemsOnly = (remoteProducts || []).filter((p: ProductItem) => p.track_stock !== false);

//   return (
//     <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
//       <header className="mb-6">
//         <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
//           Physical Stocktake Reconciliation
//         </h1>
//         <p className="text-sm text-slate-500 mt-1">
//           Perform real-time physical counts. System variances require immediate structural accountability codes.
//         </p>
//       </header>

//       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
//         <div className="hidden md:flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
//           <div className="flex-1 min-w-[250px]">Product Metrics</div>
//           <div className="w-28">Book Stock</div>
//           <div className="w-32">Physical Count</div>
//           <div className="w-36">Calculated Delta</div>
//           <div className="w-24 text-right">Commit</div>
//         </div>

//         <div className="divide-y divide-slate-100">
//           {physicalItemsOnly.length === 0 ? (
//             <div className="p-12 text-center text-sm text-slate-400 font-medium">
//               No product variants matching active stock-tracking constraints were discovered.
//             </div>
//           ) : (
//             data.map((product: ProductItem) => (
//               <AuditTableRow
//                 key={product.id}
//                 productId={product.id}
//                 businessId={businessId}
//                 label={product.label}
//                 category={product.category}
//                 sku={product.attributes?.sku || "N/A"}
//                 unitOfMeasure={product.attributes?.unit_of_measure || "Units"}
//                 bookStock={product.stock}
//                 costPrice={product.attributes?.buying_price || 0}
//                 sellingPrice={product.selling_price}
//                 onSaveSuccess={handleRowSave}
//               />
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };// Path: features/inventory/AuditWorkspace.tsx
"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuditTableRow } from "@/features/inventory/AuditTableRow";
import { useProducts } from "@/features/business/hooks/useProducts";
import { Loader2, AlertCircle, Package } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

interface AuditWorkspaceProps {
  businessId: string;
}

interface ProductItem {
  id: string;
  label: string;
  selling_price: number;
  track_stock: boolean;
  stock: number;
  active: boolean;
  category: string;
  attributes?: {
    unit_of_measure?: string;
    buying_price?: number;
    sku?: string;
  };
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ businessId }) => {
  const queryClient = useQueryClient();
  
  // 1. Destructure domain products collection matching your TanStack core custom hook definition
  const { products = [], isLoading, error } = useProducts(businessId);

  // 2. Direct mutation execution context for atomic row-level persistences
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
      throw new Error(errorData?.detail || "Network engine returned an error persisting stock audit updates.");
    }

    const responseData = await res.json();
    console.log("📋 [Backend Response] -> POST /api/v1/business/stock/audit", responseData);

    // 3. 🔑 Direct TanStack Query Cache Mutation Wrapper
    // Intercepts the working application context memory to update stock metrics instantly without page flashes
    queryClient.setQueryData(["products", businessId], (oldCacheData: any) => {
      // Safely check for standard structure variations depending on your hook's raw envelope
      if (!oldCacheData) return oldCacheData;

      const updateList = (items: ProductItem[]) =>
        items.map((p) =>
          p.id === payload.product_id ? { ...p, stock: payload.quantity } : p
        );

      // Handle cases where the cache stores an array directly or inside an object property wrapper
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

  // 4. Structural Loading View state representation
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin stroke-[2.5]" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Loading Workspace Ledger Juice...
        </p>
      </div>
    );
  }

  // 5. Boundary Error layout definitions
  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="w-full max-w-xl mx-auto my-12 p-6 bg-card rounded-[2rem] border border-border shadow-xl flex flex-col items-center text-center gap-4">
        <div className="h-14 w-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shadow-inner">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
            Data Load Execution Failure
          </h2>
          <p className="text-slate-500 text-xs font-medium max-w-sm">
            Failed to assemble the interactive audit worksheet framework context: {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  // 6. Filter matrix profiles to ensure virtual rows/services (track_stock = false) don't populate stocktake sheets
  const physicalItemsOnly = products.filter((product: ProductItem) => product.track_stock !== false);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-slate-900">
          Physical Stocktake Reconciliation
        </h1>
        <p className="text-xs md:text-sm font-medium text-slate-500">
          Perform real-time physical warehouse count overrides. System variances enforce strict compliance trail fields.
        </p>
      </header>

      {/* Advanced Spreadsheet Grid Ledger Block */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        
        {/* Table Column Identification Ribbon */}
        <div className="hidden md:flex items-center px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
          <div className="flex-1 min-w-[250px]">Product Specification Attributes</div>
          <div className="w-28">Book Stock</div>
          <div className="w-32">Physical Count</div>
          <div className="w-36">Calculated Delta</div>
          <div className="w-24 text-right">Commit</div>
        </div>

        {/* Core Loop Processing Area Layout */}
        <div className="divide-y divide-slate-100">
          {physicalItemsOnly.length === 0 ? (
            <div className="h-[40vh] flex flex-col items-center justify-center text-slate-300 rounded-[2rem] p-6">
              <Package size={48} strokeWidth={1.5} className="mb-3 text-slate-300" />
              <p className="font-black uppercase text-xs tracking-widest">
                No Tracked Items Available
              </p>
            </div>
          ) : (
            physicalItemsOnly.map((product: ProductResponse) => (
              <AuditTableRow
                key={product.id}
                productId={product.id}
                businessId={businessId}
                label={product.label}
                category={product.category}
                sku={product.attributes?.sku || "N/A"}
                unitOfMeasure={product.attributes?.unit_of_measure || "Units"}
                bookStock={product.stock}
                costPrice={product.attributes?.buying_price || 0}
                sellingPrice={product.selling_price}
                onSaveSuccess={handleRowSave}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};