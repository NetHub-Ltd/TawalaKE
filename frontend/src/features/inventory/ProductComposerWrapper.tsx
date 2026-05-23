"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";

interface ProductComposerWrapperProps {
  businessId: string;
  productId: string;
}

export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
  const router = useRouter();
  const { updateProduct, isLoading, product } = useProducts(businessId, productId);


  const handleUpdate = (values: AssetFormValues) => {
    console.debug("updating from asset composer", values)
    updateProduct.mutate({ id: productId, ...values }, {
      onSuccess: () => router.push(`/terminal/${businessId}/inventory`)
    });
  };

  // Guard clause blocks your form from rendering empty text inputs while loading
  if (isLoading) {
    return <div className="p-8 text-center font-medium">Loading asset data...</div>;
  }

  // Once past the guard clause, product is safely populated from the cache/network response
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
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-foreground">Modify System Asset</h1>
      <AssetComposer
        initialData={formInitialValues}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
        isPending={updateProduct.isPending}
        submitButtonText="Apply Modifications"
      />
    </div>
  );
}
