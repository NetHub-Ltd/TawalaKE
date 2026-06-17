// src/app/products/[id]/new/AssetFormWrapper.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer, AssetFormValues } from "@/features/inventory/AssetComposer";

interface AssetFormWrapperProps {
  businessId: string;
}

export function AssetFormWrapper({ businessId }: AssetFormWrapperProps) {
  const router = useRouter();
  const { createProduct } = useProducts(businessId);

  const handleCreate = (values: AssetFormValues, resetForm: () => void) => {
    // 1. Generate an informative SKU: First 6 chars of businessId + timestamp epoch sequence
    const computedSku = values.attributes.sku?.trim() !== "" 
      ? values.attributes.sku.trim() 
      : `${businessId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    const payload = {
      ...values,
      business_id: businessId,
      // track_stock: true,
      // active: true,
      stock: 0, 
      attributes: {
        ...values.attributes,
        sku: computedSku,
      }
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success(`Asset created successfully with SKU: ${computedSku}`);
        // 2. Clear the form state so the manager can register another item instantly
        resetForm();
      },
      onError: (error) => {
        toast.error("Failed to compile and persist asset registry profile");
      }
    });
  };

  return (
    <AssetComposer 
      onSubmit={handleCreate} 
      onCancel={() => router.push(`/terminal/${businessId}/inventory`)}
      isPending={createProduct.isPending}
      submitButtonText="Confirm & Create Product"
    />
  );
}