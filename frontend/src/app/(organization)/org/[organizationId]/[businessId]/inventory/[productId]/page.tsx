import React from "react";
import { ProductComposerWrapper } from "@/features/inventory/ProductComposerWrapper";

interface PageProps {
  params: Promise<{
    businessId: string;
    productId: string;
  }>;
}

export default async function ProductComposerPage({ params }: PageProps) {
  const { businessId, productId } = await params;

  return (
    <ProductComposerWrapper 
      businessId={businessId} 
      productId={productId} 
    />
  );
}