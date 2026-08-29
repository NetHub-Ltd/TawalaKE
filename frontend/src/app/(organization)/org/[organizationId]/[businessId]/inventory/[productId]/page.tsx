import React, { Suspense } from "react";
import { ProductWorkspace } from "@/features/inventory/ProductWorkspace";

interface PageProps {
  params: Promise<{
    businessId: string;
    productId: string;
  }>;
}

export default async function ProductWorkspacePage({ params }: PageProps) {
  const { businessId, productId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[240px] items-center justify-center text-sm text-muted">
          Loading workspace…
        </div>
      }
    >
      <ProductWorkspace businessId={businessId} productId={productId} />
    </Suspense>
  );
}
