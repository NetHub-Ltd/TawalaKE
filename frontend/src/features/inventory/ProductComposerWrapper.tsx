// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { AssetComposer } from "@/features/inventory/AssetComposer";
// import { ProductCreate } from "@/lib/api/generated/models/productCreate";
// import { Loader2 } from "lucide-react";
// import { useBusinessContext } from "../business/hooks/useBusiness";

// interface ProductComposerWrapperProps {
//   businessId: string;
//   productId: string;
// }

// export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
//   const { organizationId } = useBusinessContext();
//   const router = useRouter();
//   const { updateProduct, isLoading, product } = useProducts(businessId, productId);

//   const handleUpdate = (values: ProductCreate) => {
//     console.debug("Updating product", values);
//     updateProduct.mutate({ id: productId, ...values }, {
//       onSuccess: () => router.push(`/org/${organizationId}/${businessId}/inventory`)
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
//         <p className="font-bold uppercase tracking-widest text-muted">
//           Retrieving asset specifications...
//         </p>
//       </div>
//     );
//   }

//   const formInitialValues: Partial<ProductCreate> = {
//     label: product?.label || "",
//     selling_price: product?.selling_price || 0,
//     stock: product?.stock || 0,
//     category: product?.category || "general_inventory",
//     attributes: {
//       unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
//       buying_price: product?.attributes?.buying_price || 0,
//       sku: product?.attributes?.sku || "",
//     },
//   };

//   return (
//     <div className="w-full mx-auto p-6 md:p-8 rounded-2xl space-y-8">
//         <AssetComposer
//           initialData={formInitialValues}
//           onSubmit={handleUpdate}
//           onCancel={() => router.back()}
//           isPending={updateProduct.isPending}
//           submitButtonText="Save Specifications"
//         />
//     </div>
//   );
// }

// "use client";

// import React from "react";
// import { useRouter } from "next/navigation";
// import { useProducts } from "@/features/business/hooks/useProducts";
// import { AssetComposer } from "@/features/inventory/AssetComposer";
// import { ProductCreate } from "@/lib/api/generated/models/productCreate";
// import { Loader2 } from "lucide-react";
// import { useBusinessContext } from "../business/hooks/useBusiness";

// interface ProductComposerWrapperProps {
//   businessId: string;
//   productId: string;
// }

// export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
//   const { organizationId } = useBusinessContext();
//   const router = useRouter();
//   const { updateProduct, isLoading, product } = useProducts(businessId, productId);

//   const handleUpdate = (values: ProductCreate) => {
//     console.debug("Updating product", values);
    
//     // Explicitly handle and safely extract nullable fields to conform with the strict Partial<ProductResponse> signature
//     const safeCategory = values.category === null ? undefined : (values.category as string);

//     updateProduct.mutate({ 
//       id: productId, 
//       ...values,
//       category: safeCategory
//     }, {
//       onSuccess: () => router.push(`/org/${organizationId}/${businessId}/inventory`)
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4" role="status" aria-live="polite">
//         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" aria-hidden="true" />
//         <p className="font-bold uppercase tracking-widest text-muted text-sm">
//           Retrieving asset specifications...
//         </p>
//       </div>
//     );
//   }

//   const formInitialValues: Partial<ProductCreate> = {
//     label: product?.label || "",
//     selling_price: product?.selling_price || 0,
//     stock: product?.stock || 0,
//     category: product?.category || "other",
//     attributes: {
//       unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
//       buying_price: product?.attributes?.buying_price || 0,
//       sku: product?.attributes?.sku || "",
//     },
//   };

//   return (
//     <div className="w-full mx-auto p-6 md:p-8 rounded-2xl space-y-8">
//       <AssetComposer
//         initialData={formInitialValues}
//         onSubmit={handleUpdate}
//         onCancel={() => router.back()}
//         isPending={updateProduct.isPending}
//         submitButtonText="Save Specifications"
//       />
//     </div>
//   );
// }

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer } from "@/features/inventory/AssetComposer";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";
import { Loader2 } from "lucide-react";
import { useBusinessContext } from "../business/hooks/useBusiness";

interface ProductComposerWrapperProps {
  businessId: string;
  productId: string;
}

export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
  const { organizationId } = useBusinessContext();
  const router = useRouter();
  const { updateProduct, isLoading, product } = useProducts(businessId, productId);

  // Marked as async to satisfy the Promise<void> signature expected by AssetComposer
  const handleUpdate = async (values: ProductCreate): Promise<void> => {
    console.debug("Updating product", values);
    
    const safeCategory = values.category === null ? undefined : (values.category as string);

    // Wrapping mutation execution in a Promise context
    return new Promise((resolve, reject) => {
      updateProduct.mutate({ 
        id: productId, 
        ...values,
        category: safeCategory
      }, {
        onSuccess: () => {
          router.push(`/org/${organizationId}/${businessId}/inventory`);
          resolve();
        },
        onError: (error) => {
          reject(error);
        }
      });
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[400px] gap-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" aria-hidden="true" />
        <p className="font-bold uppercase tracking-widest text-muted text-sm">
          Retrieving asset specifications...
        </p>
      </div>
    );
  }

  const formInitialValues: Partial<ProductCreate> = {
    label: product?.label || "",
    selling_price: product?.selling_price || 0,
    stock: product?.stock || 0,
    category: product?.category || "other",
    attributes: {
      unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
      buying_price: product?.attributes?.buying_price || 0,
      sku: product?.attributes?.sku || "",
    },
  };

  return (
    <div className="w-full mx-auto p-6 md:p-8 rounded-2xl space-y-8">
      <AssetComposer
        initialData={formInitialValues}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
        isPending={updateProduct.isPending}
        submitButtonText="Save Specifications"
      />
    </div>
  );
}