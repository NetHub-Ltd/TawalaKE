import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";

interface PageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
  }>;
  searchParams: Promise<{
    sale_id?: string;
  }>;
}

/**
 * CheckoutPage - Next.js App Router Server Component
 * Handles layout composition and forwards structural multi-tenant routing parameters.
 */
export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { organizationId, businessId } = resolvedParams;
  const saleId = resolvedSearchParams.sale_id;

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

  // Fallback structural mock data matching server schema formats
  // In your production build, execute a direct server fetch or database lookup right here
  const activeSale = {
    id: saleId,
    status: "PENDING_SETTLEMENT",
    subtotal: 42100.0,
    taxAmount: 6736.0,
    discount: 1500.0,
    grandTotal: 47336.0,
    itemCount: 5,
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden relative flex flex-col p-6 lg:p-8 select-none font-sans antialiased">
      
      {/* HEADER BAR */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <Link
            href={`/org/${organizationId}/${businessId}/terminal`}
            className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-foreground hover:text-brand-primary transition-all shadow-xs"
            aria-label="Return to counter dashboard"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-brand-primary block">Cashier Checkout</span>
            <h1 className="text-sm font-black text-foreground uppercase tracking-tight">Complete Payment</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent">
          <ShieldCheck size={12} aria-hidden="true" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Secure Channel</span>
        </div>
      </header>

      {/* CORE FRAMEWORK SUBGRID CONTAINING TRANSACTION DETAILS */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
        {/* LEFT CARD PANEL: FINANCIAL LEDGER SUMMARY RECAP */}
        <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[440px] bg-card border border-border/60 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border/40 pb-3 mb-4">
            Sale Invoice Summary
          </h2>
          
          <div className="flex-1 space-y-3.5 text-xs font-mono">
            <div className="flex justify-between text-muted">
              <span>Total Line Items</span>
              <span className="font-bold text-foreground">{activeSale.itemCount} Units</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-bold text-foreground">KES {activeSale.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT Taxes (16%)</span>
              <span className="font-bold text-foreground">KES {activeSale.taxAmount.toLocaleString()}</span>
            </div>
            {activeSale.discount > 0 && (
              <div className="flex justify-between text-brand-accent bg-brand-accent/5 p-2 border border-brand-accent/10 rounded-xl font-bold">
                <span>Deducted Discount</span>
                <span>-KES {activeSale.discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed border-border/60 mt-4 flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Total Payable</span>
            <span className="text-2xl font-black tracking-tight text-foreground font-mono">
              KES {activeSale.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        {/* RIGHT CARD PANEL: INTERACTIVE FORM LAYERS */}
        <section className="lg:col-span-7 flex flex-col justify-center h-full max-h-[440px] w-full max-w-xl mx-auto">
          <CheckoutForm 
            saleId={activeSale.id}
            grandTotal={activeSale.grandTotal}
            organizationId={organizationId}
            businessId={businessId}
          />
        </section>
      </div>

      <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[10px] z-10 text-center lg:text-left tracking-wide font-mono">
        Tawala Cloud Settlement System &copy; {new Date().getFullYear()}. Encrypted Terminal Stream Active.
      </footer>

    </div>
  );
}