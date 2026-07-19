"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer } from "@/features/inventory/AssetComposer";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";

interface AssetFormWrapperProps {
  businessId: string;
}

export function AssetFormWrapper({ businessId }: AssetFormWrapperProps) {
  const router = useRouter();
  const { createProduct } = useProducts(businessId);

  const handleCreate = async (values: ProductCreate): Promise<void> => {
    try {
      await createProduct.mutateAsync(values);
      toast.success(`Asset "${values.label}" registered successfully`);
    } catch (error) {
      toast.error("Failed to compile and persist asset registry profile");
      throw error;
    }
  };

  return (
    <main id="main-content" className="w-full">
      <AssetComposer 
        initialData={null}
        onSubmit={handleCreate} 
        onCancel={() => router.push(`/terminal/${businessId}/inventory`)}
        isPending={createProduct.isPending}
        submitButtonText="Confirm & Create Product"
      />
    </main>
  );
}