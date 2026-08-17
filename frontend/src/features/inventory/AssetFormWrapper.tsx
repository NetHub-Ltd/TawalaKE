"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer } from "@/features/inventory/AssetComposer";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";

interface AssetFormWrapperProps {
  businessId: string;
  organizationId: string;
}

export function AssetFormWrapper({ businessId, organizationId }: AssetFormWrapperProps) {
  const router = useRouter();
  const { createProduct } = useProducts(businessId);

  const handleCancel = useCallback(() => {
    router.push(`/org/${organizationId}/${businessId}/inventory`);
  }, [router, organizationId, businessId]);

  const handleCreate = useCallback(
    async (values: ProductCreate): Promise<void> => {
      try {
        await createProduct.mutateAsync(values);
        toast.success(`Product "${values.label}" created successfully!`);
        router.push(`/org/${organizationId}/${businessId}/inventory`);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create product";
        toast.error(errorMessage);
        throw error;
      }
    },
    [createProduct, router, businessId]
  );

  return (
    <div className="w-full">
      <AssetComposer
        initialData={null}
        onSubmit={handleCreate}
        onCancel={handleCancel}
        isPending={createProduct.isPending}
      />
    </div>
  );
}