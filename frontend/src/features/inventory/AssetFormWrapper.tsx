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
        const created = await createProduct.mutateAsync(values);
        toast.success(`Product "${values.label}" created successfully!`);
        const newId =
          created && typeof created === "object" && "id" in created
            ? String((created as { id: string }).id)
            : created && typeof created === "object" && "data" in created && (created as { data?: { id?: string } }).data?.id
              ? String((created as { data: { id: string } }).data.id)
              : null;
        if (newId) {
          router.push(`/org/${organizationId}/${businessId}/inventory/${newId}`);
        } else {
          router.push(`/org/${organizationId}/${businessId}/inventory`);
        }
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