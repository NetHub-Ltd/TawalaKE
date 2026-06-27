// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useSales } from "@/features/sales/hooks/useSales";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { 
//   ArrowLeft, 
//   Smartphone, 
//   Coins, 
//   FileText, 
//   CheckCircle2, 
//   Loader2, 
//   X,
//   ShieldCheck,
//   AlertCircle
// } from "lucide-react";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// // import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Clean, system-token driven checkout workspace optimized for split ledger viewports.
//  * UX: Strict validation feedback tied directly to native layout alerts. Meets Fitts's Law touch targets.
//  * Architecture: Safely maps parameters via a central context boundary state layer.
//  */

// type CheckoutModalMode = "NONE" | "MPESA" | "CASH" | "INVOICE_SUCCESS";

// export default function CheckoutPage() {
//   const router = useRouter();
//   const { cart, getFinancials, getReceiptPayload } = useCartStore();
//   const { businessId } = useBusinessContext();
//   const [mounted, setMounted] = useState(false);
//   const [activeModal, setActiveModal] = useState<CheckoutModalMode>("NONE");
  
//   // Track final variant selected to forward explicitly as param route states
//   const [selectedMethodParam, setSelectedMethodParam] = useState<"receipt" | "invoice">("receipt");

//   // Modal interaction fields
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [cashAmount, setCashAmount] = useState("");
//   const [phoneError, setPhoneError] = useState("");
//   const [cashError, setCashError] = useState("");
//   const [isProcessing, setIsProcessing] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return (
//       <div className="h-screen w-full bg-background flex items-center justify-center">
//         <Loader2 className="animate-spin text-brand-primary" size={24} aria-hidden="true" />
//       </div>
//     );
//   }

//   // Enforce type safety for dynamic business ID parameters
//   const normalizedBusinessId = Array.isArray(businessId) 
//     ? businessId[0] 
//     : businessId || "BIZ-PRO-01";

//   const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();

//   // Business Logic Guard: Required cash amount equals grand total minus tax and discount
//   const targetCashRequired = subtotal;

//   // --- MPESA PHONE VALIDATION RULES ---
//   const handleMpesaSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setPhoneError("");

//     const cleaned = phoneNumber.replace(/\s+/g, "");
//     const kenyanPhoneRegex = /^(07|01)\d{8}$/;

//     if (!kenyanPhoneRegex.test(cleaned)) {
//       setPhoneError("Phone number must be exactly 10 digits and start with 07 or 01.");
//       return;
//     }

//     setIsProcessing(true);
//     setSelectedMethodParam("receipt");
    
//     setTimeout(() => {
//       const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "MPESA");
//       console.log("Mpesa STK Checkout Payload Persisted Safely:", payload);
      
//       setIsProcessing(false);
//       setActiveModal("INVOICE_SUCCESS");
//     }, 1200);
//   };

//   // --- CASH VALUATION GATES ---
//   const handleCashSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setCashError("");

//     const parsedCash = parseFloat(cashAmount);
//     if (isNaN(parsedCash) || Math.abs(parsedCash - targetCashRequired) > 0.01) {
//       setCashError(`Exactly KES ${targetCashRequired.toLocaleString()} is required. We cannot accept more or less.`);
//       return;
//     }

//     setIsProcessing(true);
//     setSelectedMethodParam("receipt");

//     setTimeout(() => {
//       const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "CASH");
//       console.log("Cash Checkout Payload Persisted Safely:", payload);
      
//       setIsProcessing(false);
//       setActiveModal("INVOICE_SUCCESS");
//     }, 1200);
//   };

//   // --- IMMEDIATE INVOICE SIMULATION ---
//   const handleGenerateInvoiceDirect = () => {
//     setIsProcessing(true);
//     setSelectedMethodParam("invoice");

//     setTimeout(() => {
//       const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "INVOICE");
//       console.log("Draft Invoice Generation State Logged:", payload);
      
//       setIsProcessing(false);
//       setActiveModal("INVOICE_SUCCESS");
//     }, 1000);
//   };

//   // --- REDIRECT Lifecycle Navigation ---
//   const handleCompleteOrderLifecycle = () => {
//     router.push(`/org/${businessId}/${normalizedBusinessId}/checkout/receipt?method=${selectedMethodParam}`);
//   };

//   return (
//     <div className="h-screen w-full bg-background text-foreground overflow-hidden relative flex flex-col p-6 lg:p-8 selection:bg-brand-primary/20">
      
//       {/* HEADER BAR */}
//       <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10">
//         <div className="flex items-center gap-4">
//           <button
//             type="button"
//             onClick={() => router.back()}
//             disabled={activeModal !== "NONE"}
//             className="h-10 w-10 rounded-xl bg-card border border-border/40 flex items-center justify-center text-foreground hover:text-brand-primary transition-all disabled:opacity-30 cursor-pointer"
//             aria-label="Return to previous screen"
//           >
//             <ArrowLeft size={16} aria-hidden="true" />
//           </button>
//           <div>
//             <span className="text-[9px] font-black tracking-wider uppercase text-brand-primary block">Checkout Stream</span>
//             <h1 className="text-sm font-black text-foreground uppercase tracking-tight">Select Payment Route</h1>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent">
//           <ShieldCheck size={12} aria-hidden="true" />
//           <span className="text-[10px] font-bold uppercase tracking-wider">Secure Settlement</span>
//         </div>
//       </header>

//       {/* CORE FRAMEWORK SPLIT */}
//       <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
//         {/* LEFT COLUMN: SUMMARY BRIEF RECEIPT SNAPSHOT */}
//         <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[460px] bg-card border border-border/40 rounded-[2rem] p-6 shadow-xs">
//           <h2 className="text-[10px] font-black uppercase tracking-wider text-muted border-b border-border/40 pb-3 mb-4">
//             Sale Summary Brief
//           </h2>
          
//           {/* Scrollless structural summary stream */}
//           <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs font-mono">
//             <div className="flex justify-between text-muted">
//               <span>Items Total Count</span>
//               <span className="font-bold text-foreground">{cart.reduce((acc, i) => acc + i.qty, 0)} units</span>
//             </div>
//             <div className="flex justify-between text-muted">
//               <span>Base Subtotal</span>
//               <span className="font-bold text-foreground">KES {subtotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between text-muted">
//               <span>Estimated Taxes</span>
//               <span className="font-bold text-foreground">KES {taxAmount.toLocaleString()}</span>
//             </div>
//             {discountApplied > 0 && (
//               <div className="flex justify-between text-brand-accent font-bold">
//                 <span>Discounts Applied</span>
//                 <span>-KES {discountApplied.toLocaleString()}</span>
//               </div>
//             )}
//           </div>

//           {/* Bold payable dynamic summary line */}
//           <div className="pt-4 border-t border-dashed border-border/60 mt-4 flex justify-between items-baseline">
//             <span className="text-xs font-black uppercase tracking-wider text-brand-primary">Net Payable</span>
//             <span className="text-2xl font-black tracking-tight text-foreground font-mono">
//               KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
//         </section>

//         {/* RIGHT COLUMN: INTERACTIVE PAY ROUTE GRID */}
//         <section className="lg:col-span-7 flex flex-col gap-4 justify-center h-full max-h-[460px] w-full max-w-xl mx-auto">
          
//           {/* route 1: mpesa trigger */}
//           <button
//             type="button"
//             onClick={() => { setActiveModal("MPESA"); setPhoneError(""); }}
//             className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left cursor-pointer"
//           >
//             <div className="flex items-center gap-4">
//               <div className="h-12 w-12 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl flex items-center justify-center shrink-0">
//                 <Smartphone size={20} aria-hidden="true" />
//               </div>
//               <div>
//                 <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Pay with M-Pesa STK</h3>
//                 <p className="text-[11px] font-medium text-muted">Triggers an automated customer SIM prompt query instantly.</p>
//               </div>
//             </div>
//           </button>

//           {/* route 2: cash trigger */}
//           <button
//             type="button"
//             onClick={() => { setActiveModal("CASH"); setCashError(""); setCashAmount(""); }}
//             className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left cursor-pointer"
//           >
//             <div className="flex items-center gap-4">
//               <div className="h-12 w-12 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-xl flex items-center justify-center shrink-0">
//                 <Coins size={20} aria-hidden="true" />
//               </div>
//               <div>
//                 <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Settle with Exact Cash</h3>
//                 <p className="text-[11px] font-medium text-muted">
//                   Process cash ledger updates requiring base totals: <span className="font-bold text-foreground font-mono">KES {targetCashRequired.toLocaleString()}</span>.
//                 </p>
//               </div>
//             </div>
//           </button>

//           {/* route 3: invoice trigger */}
//           <button
//             type="button"
//             onClick={handleGenerateInvoiceDirect}
//             disabled={isProcessing}
//             className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
//           >
//             <div className="flex items-center gap-4">
//               <div className="h-12 w-12 bg-surface border border-border/40 text-muted rounded-xl flex items-center justify-center shrink-0">
//                 {isProcessing && activeModal === "NONE" ? <Loader2 className="animate-spin text-brand-primary" size={18} /> : <FileText size={20} aria-hidden="true" />}
//               </div>
//               <div>
//                 <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Generate Corporate Invoice</h3>
//                 <p className="text-[11px] font-medium text-muted">Draft point-in-time invoices for payment tracking.</p>
//               </div>
//             </div>
//           </button>

//         </section>
//       </div>

//       {/* --- LAYERED DIALOG MODAL BACKDROP SYSTEMS --- */}
//       {activeModal !== "NONE" && (
//         <div className="fixed inset-0 bg-foreground/20 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
//           <div className="w-full max-w-md bg-card rounded-[2rem] border border-border/40 shadow-xl p-6 md:p-8 relative overflow-hidden animate-in zoom-in-95 duration-150">
            
//             {/* CLOSE ACTION BUTTON */}
//             {activeModal !== "INVOICE_SUCCESS" && (
//               <button
//                 type="button"
//                 onClick={() => setActiveModal("NONE")}
//                 className="absolute right-4 top-4 p-2 text-muted hover:text-brand-accent rounded-full transition-colors cursor-pointer"
//                 aria-label="Close form panel"
//               >
//                 <X size={16} aria-hidden="true" />
//               </button>
//             )}

//             {/* --- CASE A: MPESA POPUP OVERLAY --- */}
//             {activeModal === "MPESA" && (
//               <form onSubmit={handleMpesaSubmit} className="space-y-5">
//                 <div className="space-y-1">
//                   <div className="h-10 w-10 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl flex items-center justify-center mb-2">
//                     <Smartphone size={18} aria-hidden="true" />
//                   </div>
//                   <h3 className="text-base font-black text-foreground uppercase tracking-tight">Initiate M-Pesa Push</h3>
//                   <p className="text-[11px] font-medium text-muted">Enter the customer mobile contact line to stream STK triggers.</p>
//                 </div>

//                 <div className="space-y-1.5">
//                   <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-muted block">Mobile Phone Number</label>
//                   <input
//                     type="text"
//                     id="phone"
//                     required
//                     placeholder="e.g., 0712345678 or 0112345678"
//                     value={phoneNumber}
//                     onChange={(e) => setPhoneNumber(e.target.value)}
//                     disabled={isProcessing}
//                     className="w-full h-11 px-4 bg-background border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all font-mono"
//                   />
//                   {phoneError && (
//                     <div className="flex items-center gap-1.5 text-brand-accent text-[11px] font-bold pt-1">
//                       <AlertCircle size={12} aria-hidden="true" />
//                       <span>{phoneError}</span>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={isProcessing}
//                   className="w-full h-12 bg-brand-primary text-background text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
//                 >
//                   {isProcessing ? (
//                     <>
//                       <Loader2 size={13} className="animate-spin" />
//                       <span>Broadcasting STK Signal...</span>
//                     </>
//                   ) : (
//                     <span>Transmit Push Notification</span>
//                   )}
//                 </button>
//               </form>
//             )}

//             {/* --- CASE B: CASH VALUE ACCELERATOR OVERLAY --- */}
//             {activeModal === "CASH" && (
//               <form onSubmit={handleCashSubmit} className="space-y-5">
//                 <div className="space-y-1">
//                   <div className="h-10 w-10 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-xl flex items-center justify-center mb-2">
//                     <Coins size={18} aria-hidden="true" />
//                   </div>
//                   <h3 className="text-base font-black text-foreground uppercase tracking-tight">Confirm Cash Deposit</h3>
//                   <p className="text-[11px] font-medium text-muted">
//                     Input exactly <span className="font-bold text-foreground font-mono">KES {targetCashRequired.toLocaleString()}</span> (Base cost excluding tax and discount overrides).
//                   </p>
//                 </div>

//                 <div className="space-y-1.5">
//                   <label htmlFor="cash" className="text-[10px] font-black uppercase tracking-wider text-muted block">Exact Value Tendered</label>
//                   <div className="relative">
//                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted font-mono">KES</span>
//                     <input
//                       type="number"
//                       id="cash"
//                       step="any"
//                       required
//                       placeholder={targetCashRequired.toString()}
//                       value={cashAmount}
//                       onChange={(e) => setCashAmount(e.target.value)}
//                       disabled={isProcessing}
//                       className="w-full h-11 pl-12 pr-4 bg-background border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all font-mono"
//                     />
//                   </div>
//                   {cashError && (
//                     <div className="flex items-center gap-1.5 text-brand-accent text-[11px] font-bold pt-1">
//                       <AlertCircle size={12} aria-hidden="true" />
//                       <span>{cashError}</span>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={isProcessing}
//                   className="w-full h-12 bg-brand-primary text-background text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
//                 >
//                   {isProcessing ? (
//                     <>
//                       <Loader2 size={13} className="animate-spin" />
//                       <span>Logging Cash Vault Sync...</span>
//                     </>
//                   ) : (
//                     <span>Commit Cash Settle</span>
//                   )}
//                 </button>
//               </form>
//             )}

//             {/* --- CASE C: TRANSACTION LOG SUCCESS CONSOLE --- */}
//             {activeModal === "INVOICE_SUCCESS" && (
//               <div className="text-center space-y-4 py-4">
//                 <div className="h-12 w-12 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center border border-brand-accent/20 mx-auto shadow-xs">
//                   <CheckCircle2 size={22} aria-hidden="true" />
//                 </div>
//                 <div className="space-y-1.5">
//                   <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Transaction Logged Safely</h3>
//                   <p className="text-xs font-medium text-muted max-w-sm mx-auto leading-relaxed">
//                     The transaction records have been safely written to your secure audit ledger and thermal print pipeline streams.
//                   </p>
//                 </div>
//                 <div className="pt-2">
//                   <button
//                     type="button"
//                     onClick={handleCompleteOrderLifecycle}
//                     className="w-full h-11 bg-brand-primary text-background hover:bg-brand-primary/90 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
//                   >
//                     View Settlement Document
//                   </button>
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       )}

//       {/* FOOTER */}
//       <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[11px] z-10 text-center lg:text-left">
//         Tawala Cloud Core &copy; {new Date().getFullYear()}. Encrypted POS settlement portal active.
//       </footer>

//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSales } from "@/features/sales/hooks/useSales";
import { 
  ArrowLeft, 
  Smartphone, 
  Coins, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * @Scribe_Audit
 * Aesthetic: Clean, system-token driven checkout workspace optimized for split ledger viewports.
 * UX: Validation feedback derived directly from immutable server-state query streams.
 * Architecture: Safely extracts businessId via context boundaries and hydrates checkout metrics using TanStack memory spaces.
 */

type CheckoutModalMode = "NONE" | "MPESA" | "CASH" | "INVOICE_SUCCESS";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("sale_id") || undefined;

  const { cart, getReceiptPayload } = useCartStore();
  const { businessId } = useBusinessContext();
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<CheckoutModalMode>("NONE");
  
  // Track final variant selected to forward explicitly as param route states
  const [selectedMethodParam, setSelectedMethodParam] = useState<"receipt" | "invoice">("receipt");

  // Modal interaction fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cashError, setCashError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enforce structural safety for mandatory business context parameters
  const normalizedBusinessId = Array.isArray(businessId) 
    ? businessId[0] 
    : businessId || "";

  // Pull server-state data matching the active pending order
  const { sales, isLoading: isQueryLoading, error: queryError } = useSales({
    businessId: normalizedBusinessId,
    saleId: saleId,
  });

  // Extract the unique object entry from our array normalization logic layer
  const activeSale = sales[0];

  if (!mounted || isQueryLoading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={24} aria-hidden="true" />
      </div>
    );
  }

  // Fallback view state if no transaction context could be pulled safely
  if (queryError || !activeSale) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="text-brand-accent animate-pulse" size={40} />
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Ledger Sync Error</h2>
          <p className="text-xs text-muted max-w-sm mt-1">
            {queryError?.message || "Could not resolve a matching pending order balance parameter for this terminal."}
          </p>
        </div>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 border border-border text-xs font-bold uppercase rounded-xl hover:bg-surface"
        >
          Return to Terminal
        </button>
      </div>
    );
  }

  // Map exact keys retrieved directly from your backend payload object
  const { subtotal, tax_amount: taxAmount, discount, total_amount: grandTotal } = activeSale;

  // --- MPESA PHONE VALIDATION RULES ---
  const handleMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    const cleaned = phoneNumber.replace(/\s+/g, "");
    const kenyanPhoneRegex = /^(07|01)\d{8}$/;

    if (!kenyanPhoneRegex.test(cleaned)) {
      setPhoneError("Phone number must be exactly 10 digits and start with 07 or 01.");
      return;
    }

    setIsProcessing(true);
    setSelectedMethodParam("receipt");
    
    setTimeout(() => {
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "MPESA");
      console.log("Mpesa STK Checkout Payload Persisted Safely:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1200);
  };

  // --- CASH VALUATION GATES ---
  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCashError("");

    const parsedCash = parseFloat(cashAmount);
    // Strict match against exact backend ledger grand totals
    if (isNaN(parsedCash) || Math.abs(parsedCash - grandTotal) > 0.01) {
      setCashError(`Exactly KES ${grandTotal.toLocaleString()} is required. Change calculations must match.`);
      return;
    }

    setIsProcessing(true);
    setSelectedMethodParam("receipt");

    setTimeout(() => {
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "CASH");
      console.log("Cash Checkout Payload Persisted Safely:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1200);
  };

  // --- CORPORATE INVOICE SIMULATION ---
  const handleGenerateInvoiceDirect = () => {
    setIsProcessing(true);
    setSelectedMethodParam("invoice");

    setTimeout(() => {
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "INVOICE");
      console.log("Draft Invoice Generation State Logged:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1000);
  };

  // --- REDIRECT Lifecycle Navigation ---
  const handleCompleteOrderLifecycle = () => {
    router.push(`/org/${normalizedBusinessId}/${normalizedBusinessId}/checkout/receipt?method=${selectedMethodParam}&sale_id=${activeSale.id}`);
  };

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden relative flex flex-col p-6 lg:p-8 selection:bg-brand-primary/20">
      
      {/* HEADER BAR */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={activeModal !== "NONE"}
            className="h-10 w-10 rounded-xl bg-card border border-border/40 flex items-center justify-center text-foreground hover:text-brand-primary transition-all disabled:opacity-30 cursor-pointer"
            aria-label="Return to previous screen"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-wider uppercase text-brand-primary block">Checkout Stream</span>
            <h1 className="text-sm font-black text-foreground uppercase tracking-tight">Select Payment Route</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent">
          <ShieldCheck size={12} aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{activeSale.status}</span>
        </div>
      </header>

      {/* CORE FRAMEWORK SPLIT */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
        {/* LEFT COLUMN: SUMMARY BRIEF RECEIPT SNAPSHOT */}
        <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[460px] bg-card border border-border/40 rounded-[2rem] p-6 shadow-xs">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-muted border-b border-border/40 pb-3 mb-4">
            Sale Summary Brief (Ref: {activeSale.id.slice(0, 8)})
          </h2>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs font-mono">
            <div className="flex justify-between text-muted">
              <span>Items Total Count</span>
              <span className="font-bold text-foreground">{cart.reduce((acc, i) => acc + i.qty, 0)} units</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Base Subtotal</span>
              <span className="font-bold text-foreground">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Estimated Taxes</span>
              <span className="font-bold text-foreground">KES {taxAmount.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand-accent font-bold">
                <span>Discounts Applied</span>
                <span>-KES {discount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Bold payable dynamic summary line */}
          <div className="pt-4 border-t border-dashed border-border/60 mt-4 flex justify-between items-baseline">
            <span className="text-xs font-black uppercase tracking-wider text-brand-primary">Net Payable</span>
            <span className="text-2xl font-black tracking-tight text-foreground font-mono">
              KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE PAY ROUTE GRID */}
        <section className="lg:col-span-7 flex flex-col gap-4 justify-center h-full max-h-[460px] w-full max-w-xl mx-auto">
          
          {/* route 1: mpesa trigger */}
          <button
            type="button"
            onClick={() => { setActiveModal("MPESA"); setPhoneError(""); }}
            className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Pay with M-Pesa STK</h3>
                <p className="text-[11px] font-medium text-muted">Triggers an automated customer SIM prompt query instantly.</p>
              </div>
            </div>
          </button>

          {/* route 2: cash trigger */}
          <button
            type="button"
            onClick={() => { setActiveModal("CASH"); setCashError(""); setCashAmount(""); }}
            className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                <Coins size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Settle with Exact Cash</h3>
                <p className="text-[11px] font-medium text-muted">
                  Process cash ledger updates requiring base totals: <span className="font-bold text-foreground font-mono">KES {grandTotal.toLocaleString()}</span>.
                </p>
              </div>
            </div>
          </button>

          {/* route 3: invoice trigger */}
          <button
            type="button"
            onClick={handleGenerateInvoiceDirect}
            disabled={isProcessing}
            className="w-full p-5 bg-card border border-border/40 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/30 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-surface border border-border/40 text-muted rounded-xl flex items-center justify-center shrink-0">
                {isProcessing && activeModal === "NONE" ? <Loader2 className="animate-spin text-brand-primary" size={18} /> : <FileText size={20} aria-hidden="true" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Generate Corporate Invoice</h3>
                <p className="text-[11px] font-medium text-muted">Draft point-in-time invoices for payment tracking.</p>
              </div>
            </div>
          </button>

        </section>
      </div>

      {/* --- LAYERED DIALOG MODAL BACKDROP SYSTEMS --- */}
      {activeModal !== "NONE" && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card rounded-[2rem] border border-border/40 shadow-xl p-6 md:p-8 relative overflow-hidden animate-in zoom-in-95 duration-150">
            
            {activeModal !== "INVOICE_SUCCESS" && (
              <button
                type="button"
                onClick={() => setActiveModal("NONE")}
                className="absolute right-4 top-4 p-2 text-muted hover:text-brand-accent rounded-full transition-colors cursor-pointer"
                aria-label="Close form panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}

            {/* --- CASE A: MPESA POPUP OVERLAY --- */}
            {activeModal === "MPESA" && (
              <form onSubmit={handleMpesaSubmit} className="space-y-5">
                <div className="space-y-1">
                  <div className="h-10 w-10 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl flex items-center justify-center mb-2">
                    <Smartphone size={18} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Initiate M-Pesa Push</h3>
                  <p className="text-[11px] font-medium text-muted">Enter the customer mobile contact line to stream STK triggers.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-muted block">Mobile Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    required
                    placeholder="e.g., 0712345678 or 0112345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isProcessing}
                    className="w-full h-11 px-4 bg-background border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all font-mono"
                  />
                  {phoneError && (
                    <div className="flex items-center gap-1.5 text-brand-accent text-[11px] font-bold pt-1">
                      <AlertCircle size={12} aria-hidden="true" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-brand-primary text-background text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Broadcasting STK Signal...</span>
                    </>
                  ) : (
                    <span>Transmit Push Notification</span>
                  )}
                </button>
              </form>
            )}

            {/* --- CASE B: CASH VALUE OVERLAY --- */}
            {activeModal === "CASH" && (
              <form onSubmit={handleCashSubmit} className="space-y-5">
                <div className="space-y-1">
                  <div className="h-10 w-10 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-xl flex items-center justify-center mb-2">
                    <Coins size={18} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Confirm Cash Deposit</h3>
                  <p className="text-[11px] font-medium text-muted">
                    Input exactly <span className="font-bold text-foreground font-mono">KES {grandTotal.toLocaleString()}</span> matching your active settlement ledger parameters.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cash" className="text-[10px] font-black uppercase tracking-wider text-muted block">Exact Value Tendered</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted font-mono">KES</span>
                    <input
                      type="number"
                      id="cash"
                      step="any"
                      required
                      placeholder={grandTotal.toString()}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      disabled={isProcessing}
                      className="w-full h-11 pl-12 pr-4 bg-background border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all font-mono"
                    />
                  </div>
                  {cashError && (
                    <div className="flex items-center gap-1.5 text-brand-accent text-[11px] font-bold pt-1">
                      <AlertCircle size={12} aria-hidden="true" />
                      <span>{cashError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-brand-primary text-background text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Logging Cash Vault Sync...</span>
                    </>
                  ) : (
                    <span>Commit Cash Settle</span>
                  )}
                </button>
              </form>
            )}

            {/* --- CASE C: TRANSACTION LOG SUCCESS CONSOLE --- */}
            {activeModal === "INVOICE_SUCCESS" && (
              <div className="text-center space-y-4 py-4">
                <div className="h-12 w-12 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center border border-brand-accent/20 mx-auto shadow-xs">
                  <CheckCircle2 size={22} aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Transaction Logged Safely</h3>
                  <p className="text-xs font-medium text-muted max-w-sm mx-auto leading-relaxed">
                    The transaction records have been safely written to your secure audit ledger and thermal print pipeline streams.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCompleteOrderLifecycle}
                    className="w-full h-11 bg-brand-primary text-background hover:bg-brand-primary/90 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    View Settlement Document
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[11px] z-10 text-center lg:text-left">
        Tawala Cloud Core &copy; {new Date().getFullYear()}. Encrypted POS settlement portal active.
      </footer>

    </div>
  );
}