import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { CheckoutWorkspace } from "@/features/sales/components/CheckoutWorkspace";

interface PageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
  }>;
  searchParams: Promise<{
    sale_id?: string;
  }>;
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { organizationId, businessId } = resolvedParams;
  const saleId = resolvedSearchParams.sale_id;

  // Render error screen directly on the server if query params are completely missing
  if (!saleId) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans antialiased">
        <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Missing Sale Reference</h2>
          <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
            No active transaction context was provided. Please return to the terminal counter to try again.
          </p>
        </div>
        <Link
          href={`/org/${organizationId}/${businessId}/terminal`}
          className="px-4 h-11 bg-card border border-border/60 rounded-xl flex items-center justify-center text-xs font-bold uppercase hover:bg-surface transition-all tracking-wide"
        >
          Return to Counter
        </Link>
      </div>
    );
  }

  // Forward the parameters straight down to your client-side workspace component
  return (
    <CheckoutWorkspace 
      saleId={saleId}
      organizationId={organizationId}
      businessId={businessId}
    />
  );
}