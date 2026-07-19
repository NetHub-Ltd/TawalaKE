// src/app/products/[id]/new/page.tsx

import { AssetFormWrapper } from "@/features/inventory/AssetFormWrapper";

interface PageProps {
  params: Promise<{
    businessId: string;
    organizationId: string;
  }>;
}

export default async function NewProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const businessId = resolvedParams.businessId;

  return (
    <div className="w-full mx-auto ">
      <AssetFormWrapper businessId={businessId} />
    </div>
  );
}