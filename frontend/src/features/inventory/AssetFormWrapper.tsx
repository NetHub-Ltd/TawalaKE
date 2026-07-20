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
      toast.success(`Product "${values.label}" created successfully!`);
    } catch (error: any) {
      const message = error?.message || "Failed to create product";
      toast.error(message);
      throw error; // Let the form know it failed
    }
  };

  return (
    <main className="w-full">
      <AssetComposer 
        initialData={null}
        onSubmit={handleCreate} 
        onCancel={() => router.push(`/terminal/${businessId}/inventory`)}
        isPending={createProduct.isPending}
        // submitButtonText="Confirm & Create Product"
      />
    </main>
  );
}