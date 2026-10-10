"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/features/business/hooks/useProducts";
import { AssetComposer } from "@/features/inventory/AssetComposer";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";
import { Loader2, AlertCircle } from "lucide-react";
import { useBusinessContext } from "../business/hooks/useBusiness";

interface ProductComposerWrapperProps {
  businessId: string;
  productId: string;
}

export function ProductComposerWrapper({ businessId, productId }: ProductComposerWrapperProps) {
  const { organizationId } = useBusinessContext();
  const router = useRouter();

  // If your useProducts hook handles single fetching, ensure args match its signature.
  // If fetching from a list query, we locate the target product from the array.
  const { products = [], updateProduct, isLoading, isError, refresh } = useProducts(businessId);

  const product = products.find((item) => item.id === productId);

  const handleUpdate = async (values: ProductCreate): Promise<void> => {
    const safeCategory = values.category === null ? undefined : (values.category as string);
    // ProductResponse.track_stock is boolean; ProductCreate allows null — normalize for the mutation type.
    const trackStock =
      values.track_stock === null || values.track_stock === undefined
        ? values.item_type === "SERVICE"
          ? false
          : true
        : Boolean(values.track_stock);

    return new Promise((resolve, reject) => {
      updateProduct.mutate(
        {
          id: productId,
          label: values.label,
          selling_price: values.selling_price,
          stock: values.stock,
          category: safeCategory,
          attributes: values.attributes,
          item_type: values.item_type === "SERVICE" ? "SERVICE" : "PRODUCT",
          track_stock: trackStock,
          cost_price: values.cost_price ?? undefined,
          materials: values.materials ?? undefined,
        },
        {
          onSuccess: () => {
            router.push(`/org/${organizationId}/${businessId}/inventory`);
            resolve();
            refresh();
          },
          onError: (error) => {
            reject(error);
          },
        }
      );
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

  if (isError || (!isLoading && !product)) {
    return (
      <div 
        className="p-4 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-md flex items-center gap-3 text-xs font-bold uppercase tracking-wide shadow-xs" 
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Product record not found or failed to load.</span>
      </div>
    );
  }

  const formInitialValues: Partial<ProductCreate> = {
    label: product?.label || "",
    selling_price: product?.selling_price || 0,
    stock: product?.stock || 0,
    category: product?.category || "other",
    item_type: product?.item_type === "SERVICE" ? "SERVICE" : "PRODUCT",
    track_stock: product?.item_type === "SERVICE" ? false : Boolean(product?.track_stock ?? true),
    materials: product?.materials || [],
    attributes: {
      unit_of_measure: product?.attributes?.unit_of_measure || "pcs",
      buying_price: product?.attributes?.buying_price || 0,
      sku: product?.attributes?.sku || "",
    },
  };

  return (
    <div className="w-full mx-auto p-6 md:p-8 rounded-md space-y-8">
      <AssetComposer
        initialData={formInitialValues}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
        isPending={updateProduct.isPending}
      />
    </div>
  );
}