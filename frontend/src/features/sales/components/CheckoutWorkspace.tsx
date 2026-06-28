// "use client";

// import React from "react";
// import Link from "next/link";
// import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
// import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
// import {useSales} from "@/features/sales/hooks/useSales"; // Adjust this import path to your actual hook

// interface CheckoutWorkspaceProps {
//   saleId: string;
//   organizationId: string;
//   businessId: string;
// }

// export function CheckoutWorkspace({ saleId, organizationId, businessId }: CheckoutWorkspaceProps) {
//   // 1. Call your existing hook to fetch the actual sale data
//   const { sale: activeSale, isLoading, error } = useSales(saleId);

//   // 2. Handle standard loading and error states within the client workspace
//   if (isLoading) {
//     return (
//       <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
//         <div className="text-xs font-bold uppercase tracking-wider text-muted animate-pulse">
//           Loading actual sale details...
//         </div>
//       </div>
//     );
//   }

//   if (error || !activeSale) {
//     return (
//       <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans antialiased">
//         <div className="h-12 w-12 bg-destructive/10 border border-destructive/20 text-destructive rounded-full flex items-center justify-center">
//           <AlertCircle size={20} />
//         </div>
//         <div>
//           <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Failed to Load Sale</h2>
//           <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
//             The transaction context could not be retrieved. Please try again or contact support.
//           </p>
//         </div>
//         <Link
//           href={`/org/${organizationId}/${businessId}/terminal`}
//           className="px-4 h-11 bg-card border border-border/60 rounded-xl flex items-center justify-center text-xs font-bold uppercase hover:bg-surface transition-all tracking-wide"
//         >
//           Return to Counter
//         </Link>
//       </div>
//     );
//   }

//   // 3. Fallbacks matching your schema properties in case fields are missing from backend
//   const subtotal = activeSale.subtotal ?? 0;
//   const taxAmount = activeSale.taxAmount ?? 0;
//   const discount = activeSale.discount ?? 0;
//   const grandTotal = activeSale.grandTotal ?? 0;
//   const itemCount = activeSale.itemCount ?? 0;

//   return (
//     <div className="h-screen w-full bg-background text-foreground overflow-hidden relative flex flex-col p-6 lg:p-8 select-none font-sans antialiased">
      
//       {/* HEADER BAR */}
//       <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10">
//         <div className="flex items-center gap-4">
//           <Link
//             href={`/org/${organizationId}/${businessId}/terminal`}
//             className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-foreground hover:text-brand-primary transition-all shadow-xs"
//             aria-label="Return to counter dashboard"
//           >
//             <ArrowLeft size={16} aria-hidden="true" />
//           </Link>
//           <div>
//             <span className="text-[10px] font-bold tracking-wider uppercase text-brand-primary block">Cashier Checkout</span>
//             <h1 className="text-sm font-black text-foreground uppercase tracking-tight">Complete Payment</h1>
//           </div>
//         </div>
        
//         <div className="flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent">
//           <ShieldCheck size={12} aria-hidden="true" />
//           <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
//             {activeSale.status || "Secure Channel"}
//           </span>
//         </div>
//       </header>

//       {/* CORE FRAMEWORK SUBGRID CONTAINING TRANSACTION DETAILS */}
//       <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
//         {/* LEFT CARD PANEL: FINANCIAL LEDGER SUMMARY RECAP */}
//         <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[440px] bg-card border border-border/60 rounded-[2rem] p-6 shadow-sm">
//           <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border/40 pb-3 mb-4">
//             Sale Invoice Summary
//           </h2>
          
//           <div className="flex-1 space-y-3.5 text-xs font-mono">
//             <div className="flex justify-between text-muted">
//               <span>Total Line Items</span>
//               <span className="font-bold text-foreground">{itemCount} Units</span>
//             </div>
//             <div className="flex justify-between text-muted">
//               <span>Subtotal</span>
//               <span className="font-bold text-foreground">KES {subtotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between text-muted">
//               <span>VAT Taxes</span>
//               <span className="font-bold text-foreground">KES {taxAmount.toLocaleString()}</span>
//             </div>
//             {discount > 0 && (
//               <div className="flex justify-between text-brand-accent bg-brand-accent/5 p-2 border border-brand-accent/10 rounded-xl font-bold">
//                 <span>Deducted Discount</span>
//                 <span>-KES {discount.toLocaleString()}</span>
//               </div>
//             )}
//           </div>

//           <div className="pt-4 border-t border-dashed border-border/60 mt-4 flex justify-between items-baseline">
//             <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Total Payable</span>
//             <span className="text-2xl font-black tracking-tight text-foreground font-mono">
//               KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
//         </section>

//         {/* RIGHT CARD PANEL: INTERACTIVE FORM LAYERS */}
//         <section className="lg:col-span-7 flex flex-col justify-center h-full max-h-[440px] w-full max-w-xl mx-auto">
//           <CheckoutForm 
//             saleId={activeSale.id}
//             grandTotal={grandTotal}
//             organizationId={organizationId}
//             businessId={businessId}
//           />
//         </section>
//       </div>

//       <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[10px] z-10 text-center lg:text-left tracking-wide font-mono">
//         Tawala Cloud Settlement System &copy; {new Date().getFullYear()}. Encrypted Terminal Stream Active.
//       </footer>

//     </div>
//   );
// }

"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { CheckoutForm } from "@/features/sales/components/CheckoutForm";
import {useSales} from "@/features/sales/hooks/useSales";

interface CheckoutWorkspaceProps {
  saleId: string;
  organizationId: string;
  businessId: string;
}

export function CheckoutWorkspace({ saleId, organizationId, businessId }: CheckoutWorkspaceProps) {
  // 1. Invoked precisely against your parameter object signature
  const { sales, isLoading, error } = useSales({ businessId, saleId });

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="text-xs font-bold uppercase tracking-wider text-muted animate-pulse">
          Loading sale session details...
        </div>
      </div>
    );
  }

  // 2. Unpack the single item out of the consistent array return structure
  const activeSale = sales[0];

  if (error || !activeSale) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans antialiased">
        <div className="h-12 w-12 bg-destructive/10 border border-destructive/20 text-destructive rounded-full flex items-center justify-center">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Failed to Load Sale</h2>
          <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
            {error?.message || "The transaction context could not be retrieved from the active register stream."}
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

  // 3. Mapping variables cleanly against your exact SaleResponse snake_case schema keys
  const subtotal = activeSale.subtotal;
  const taxAmount = activeSale.tax_amount;
  const discount = activeSale.discount;
  const grandTotal = activeSale.total_amount;

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
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
            {activeSale.status}
          </span>
        </div>
      </header>

      {/* CORE SPLIT WORKSPACE GRID */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
        {/* LEFT CARD PANEL: FINANCIAL LEDGER SUMMARY RECAP */}
        <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[440px] bg-card border border-border/60 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border/40 pb-3 mb-4">
            Sale Invoice Summary (Ref: {activeSale.id.slice(0, 8)})
          </h2>
          
          <div className="flex-1 space-y-3.5 text-xs font-mono">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-bold text-foreground">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT Taxes</span>
              <span className="font-bold text-foreground">KES {taxAmount.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand-accent bg-brand-accent/5 p-2 border border-brand-accent/10 rounded-xl font-bold">
                <span>Deducted Discount</span>
                <span>-KES {discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed border-border/60 mt-4 flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Total Payable</span>
            <span className="text-2xl font-black tracking-tight text-foreground font-mono">
              KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        {/* RIGHT CARD PANEL: INTERACTIVE FORM LAYERS */}
        <section className="lg:col-span-7 flex flex-col justify-center h-full max-h-[440px] w-full max-w-xl mx-auto">
          <CheckoutForm 
            saleId={activeSale.id}
            grandTotal={grandTotal}
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