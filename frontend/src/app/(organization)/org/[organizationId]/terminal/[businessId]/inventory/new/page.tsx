// "use client";

// import { useProducts } from "@/features/business/hooks/useProducts";
// import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";
// import { useRouter } from "next/navigation";

// export default function NewProductPage({ params }: { params: { businessId: string } }) {
//   const router = useRouter();
//   const { createProduct } = useProducts(params.businessId);

//   const handleCreate = (values: AssetFormValues) => {
//     // Parent handles custom auto-generation strategy if SKU is blank
//     const computedSku = values.attributes.sku?.trim() !== "" 
//       ? values.attributes.sku 
//       : `TWL-${Date.now().toString().slice(-6)}`;

//     const payload = {
//       ...values,
//       business_id: params.businessId,
//       attributes: {
//         ...values.attributes,
//         sku: computedSku,
//       }
//     };

//     createProduct.mutate(payload, {
//       onSuccess: (newProduct) => {
//         router.push(`/terminal/${params.businessId}/inventory/${newProduct.id}`);
//       }
//     });
//   };

//   return (
//     <div className="p-8 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-black mb-6">Register New Asset</h1>
//       <AssetComposer 
//         onSubmit={handleCreate} 
//         onCancel={() => router.back()}
//         isPending={createProduct.isPending}
//         submitButtonText="Confirm & Create Product"
//       />
//     </div>
//   );
// }

"use client";

import React from "react"; // 1. Import React to get access to use()
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default function NewProductPage({ params }: PageProps) {
  const router = useRouter();

  // 2. Safely unwrap the asynchronous params promise using React.use()
  const resolvedParams = React.use(params);
  const businessId = resolvedParams.businessId;

  // 3. Inject the cleanly extracted businessId parameter into your hook context
  const { createProduct } = useProducts(businessId);

  const handleCreate = (values: AssetFormValues) => {
    const computedSku = values.attributes.sku?.trim() !== "" 
      ? values.attributes.sku 
      : `TWL-${Date.now().toString().slice(-6)}`;

    const payload = {
      ...values,
      business_id: businessId,
      attributes: {
        ...values.attributes,
        sku: computedSku,
      }
    };

    createProduct.mutate(payload, {
      onSuccess: (newProduct) => {
        router.push(`/terminal/${businessId}/inventory`);
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Register New Asset</h1>
      <AssetComposer 
        onSubmit={handleCreate} 
        onCancel={() => router.back()}
        isPending={createProduct.isPending}
        submitButtonText="Confirm & Create Product"
      />
    </div>
  );
}