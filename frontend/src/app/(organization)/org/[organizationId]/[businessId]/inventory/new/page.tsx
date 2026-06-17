// src/app/products/[id]/new/page.tsx
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// import { AssetFormWrapper } from "./AssetFormWrapper";
import { AssetFormWrapper } from "@/features/inventory/AssetFormWrapper";

interface PageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default async function NewProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const businessId = resolvedParams.businessId;

  return (
    <div className="p-8 w-full mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
            Register New Asset
          </h1>
          <p className="text-xs text-muted font-medium">Create and profile new retail catalog nodes.</p>
        </div>
        
        {/* Navigation Back Button */}
        <Link
          href={`/terminal/${businessId}/inventory`}
          className="inline-flex items-center gap-2 px-3 h-9 border border-border/60 rounded-lg text-[10px] font-black uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface/50 transition-all"
        >
          <ArrowLeft size={12} />
          Back to Inventory
        </Link>
      </div>

      <AssetFormWrapper businessId={businessId} />
    </div>
  );
}