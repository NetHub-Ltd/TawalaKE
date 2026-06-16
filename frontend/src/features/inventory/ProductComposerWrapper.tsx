// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";

// interface ProductComposerWrapperProps {
//   businessId: string;
//   productId: string;
// }

// export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
//   const router = useRouter();
//   const { updateProduct, isLoading, product } = useProducts(businessId, productId);


//   const handleUpdate = (values: AssetFormValues) => {
//     console.debug("updating from asset composer", values)
//     updateProduct.mutate({ id: productId, ...values }, {
//       onSuccess: () => router.push(`/terminal/${businessId}/inventory`)
//     });
//   };

//   // Guard clause blocks your form from rendering empty text inputs while loading
//   if (isLoading) {
//     return <div className="p-8 text-center font-medium">Loading asset data...</div>;
//   }

//   // Once past the guard clause, product is safely populated from the cache/network response
//   const formInitialValues: AssetFormValues = {
//     label: product?.label || "",
//     selling_price: product?.selling_price || 0,
//     stock: product?.stock || 0,
//     category: product?.category || "General",
//     attributes: {
//       unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
//       buying_price: product?.attributes?.buying_price || 0,
//       sku: product?.attributes?.sku || "",
//     },
//   };

//   return (
//     <div className="p-8 w-full mx-auto space-y-6">
//       <h1 className="text-2xl font-black text-foreground">Update Product Data</h1>
//       <AssetComposer
//         initialData={formInitialValues}
//         onSubmit={handleUpdate}
//         onCancel={() => router.back()}
//         isPending={updateProduct.isPending}
//         submitButtonText="Apply Modifications"
//       />
//     </div>
//   );
// }

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";
import { Loader2 } from "lucide-react";
import { useBusinessContext } from "../business/hooks/useBusiness";

interface ProductComposerWrapperProps {
  businessId: string;
  productId: string;
}

export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
  const {organizationId} = useBusinessContext()
  const router = useRouter();
  const { updateProduct, isLoading, product } = useProducts(businessId, productId);

  const handleUpdate = (values: AssetFormValues) => {
    console.debug("updating from asset composer", values);
    updateProduct.mutate({ id: productId, ...values }, {
      onSuccess: () => router.push(`/org/${organizationId}/${businessId}/inventory`)
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="font-bold uppercase tracking-widest text-muted">
          Retrieving asset specifications...
        </p>
      </div>
    );
  }

  const formInitialValues: AssetFormValues = {
    label: product?.label || "",
    selling_price: product?.selling_price || 0,
    stock: product?.stock || 0,
    category: product?.category || "General",
    attributes: {
      unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
      buying_price: product?.attributes?.buying_price || 0,
      sku: product?.attributes?.sku || "",
    },
  };

  return (
    // Canvas Separation Frame over global layout gradient
    <div className="w-full mx-auto p-6 md:p-8 rounded-2xl border border-border/20 backdrop-blur-xs space-y-8">
      
      {/* Informative & Intentional Header */}
      <header className="flex flex-col gap-2 max-w-2xl">
        <h2 className="uppercase tracking-tight font-black text-foreground">
          Modify Product Profile
        </h2>
        <p className="font-medium text-muted">
          Update core operational data, parameters, stock defaults, and financial identifiers for this asset. 
          Any saved modifications reflect immediately across active catalog checkouts, reporting dashboards, and live ledger tracking structures.
        </p>
      </header>

      {/* Flat Grounded Card Component Block */}
      <div className="bg-card border border-border/60 rounded-xl p-6 md:p-8 shadow-sm">
        <AssetComposer
          initialData={formInitialValues}
          onSubmit={handleUpdate}
          onCancel={() => router.back()}
          isPending={updateProduct.isPending}
          submitButtonText="Save Specifications"
        />
      </div>
    </div>
  );
}