// "use client";

// import React, { useEffect, useState, useRef, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { 
//   Printer, 
//   ArrowLeft, 
//   RefreshCcw, 
//   CheckCircle2, 
//   FileText, 
//   Download,
//   Share2
// } from "lucide-react";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// export default function ReceiptClientView() {
//   const router = useRouter();
//   const printAreaRef = useRef<HTMLDivElement>(null);
//   const { businessId } = useBusinessContext();
//   const [isNavigating, startTransition] = useTransition();
  
//   const { cart, getFinancials, clearCart } = useCartStore();
//   const [mounted, setMounted] = useState(false);
//   const [orderId, setOrderId] = useState("");
//   const [currentTime, setCurrentTime] = useState("");
//   const [documentMode, setDocumentMode] = useState<"receipt" | "invoice">("receipt");

//   useEffect(() => {
//     setMounted(true);
    
//     const randomId = "TWL-" + Math.floor(100000 + Math.random() * 900000);
//     setOrderId(randomId);
    
//     const now = new Date();
//     setCurrentTime(now.toLocaleDateString("en-KE", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }) + " " + now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }));

//     if (typeof window !== "undefined") {
//       const searchParams = new URLSearchParams(window.location.search);
//       const method = searchParams.get("method");
//       if (method === "invoice") {
//         setDocumentMode("invoice");
//       } else {
//         setDocumentMode("receipt");
//       }
//     }
//   }, []);

//   if (!mounted) {
//     return (
//       <div className="h-screen w-full bg-background flex items-center justify-center">
//         <RefreshCcw className="animate-spin text-brand-primary" size={24} aria-hidden="true" />
//       </div>
//     );
//   }

//   const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();

//   const handlePrintReceipt = () => {
//     if (typeof window !== "undefined") {
//       window.print();
//     }
//   };

//   const handleNewSaleCycle = () => {
//     // Wrap state updates and push actions inside a transition context to minimize main thread latency blocks (INP Optimization)
//     startTransition(() => {
//       clearCart();
//       if (businessId) {
//         router.push(`/terminal/${businessId}`);
//       } else {
//         router.push("/terminal");
//       }
//     });
//   };

//   return (
//     <main id="main-content" className="h-screen w-full bg-background text-foreground overflow-hidden relative flex flex-col p-6 lg:p-8 print:p-0 print:bg-white selection:bg-brand-primary/10">
      
//       {/* --- RECIPIENT ACTIONS CONTROLS BAR (HIDDEN ON RAW PRINT OVERLAYS) --- */}
//       <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10 print:hidden">
//         <div className="flex items-center gap-4">
//           <button
//             type="button"
//             onClick={() => router.back()}
//             disabled={isNavigating}
//             className="h-11 w-11 rounded-xl bg-card border border-border/40 flex items-center justify-center text-foreground hover:text-brand-primary transition-all active:scale-95 disabled:opacity-50"
//             title="Return to operational paths"
//             aria-label="Navigate back to previous transaction checkpoint"
//           >
//             <ArrowLeft size={16} aria-hidden="true" />
//           </button>
//           <div>
//             <span className="text-[9px] font-black tracking-wider uppercase text-brand-primary block">
//               {documentMode === "invoice" ? "Corporate Billing File" : "Settlement Document"}
//             </span>
//             <h1 className="text-base font-black text-foreground uppercase tracking-tight">
//               {documentMode === "invoice" ? "Tax Invoice Generated" : "Receipt Finalized Safely"}
//             </h1>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button 
//             type="button"
//             onClick={handlePrintReceipt}
//             className="h-11 px-4 bg-card border border-border/40 hover:border-brand-primary/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all text-foreground"
//           >
//             <Printer size={14} aria-hidden="true" />
//             <span>Print {documentMode === "invoice" ? "Invoice" : "Receipt"}</span>
//           </button>
          
//           <button 
//             type="button"
//             onClick={handleNewSaleCycle}
//             disabled={isNavigating}
//             className="h-11 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
//           >
//             {isNavigating ? (
//               <RefreshCcw size={13} className="animate-spin" aria-hidden="true" />
//             ) : (
//               <RefreshCcw size={13} aria-hidden="true" />
//             )}
//             <span>Initialize New Order</span>
//           </button>
//         </div>
//       </header>

//       {/* --- MAIN SPLIT INTERFACE FRAME --- */}
//       <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center min-h-0 py-6 relative z-10 print:p-0 print:block">
        
//         {/* LEFT COLUMN: COMPLETION ALERT CONSOLE INFOCARD (HIDDEN ON PRINT PLOTS) */}
//         <section className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left space-y-5 max-w-sm mx-auto print:hidden">
//           <div className="h-12 w-12 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center border border-brand-accent/20 mx-auto lg:mx-0 shadow-xs">
//             {documentMode === "invoice" ? (
//               <FileText size={20} className="text-brand-primary" aria-hidden="true" />
//             ) : (
//               <CheckCircle2 size={22} aria-hidden="true" />
//             )}
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
//               {documentMode === "invoice" ? "Invoice Dispatched" : "Biashara Record Written"}
//             </h2>
//             <p className="text-xs font-medium text-muted leading-relaxed">
//               This system snapshot uses live memory variables. Once you initialize a new order, terminal instances are wiped to preserve safe transaction tracking parameters.
//             </p>
//           </div>
          
//           <div className="flex items-center justify-center lg:justify-start gap-4 pt-2 text-muted">
//             <button 
//               type="button" 
//               className="p-3 bg-card border border-border/40 rounded-xl hover:text-brand-primary transition-colors shadow-xs" 
//               title="Export as PDF Document"
//               aria-label="Download document as PDF record"
//             >
//               <Download size={14} aria-hidden="true" />
//             </button>
//             <button 
//               type="button" 
//               className="p-3 bg-card border border-border/40 rounded-xl hover:text-brand-primary transition-colors shadow-xs" 
//               title="Forward Document to WhatsApp/Email"
//               aria-label="Share this transaction record"
//             >
//               <Share2 size={14} aria-hidden="true" />
//             </button>
//           </div>
//         </section>

//         {/* RIGHT COLUMN: REPLICATED PHYSICAL THERMAL LEDGER CONTAINER */}
//         <section className="lg:col-span-7 flex items-center justify-center h-full min-h-0 print:p-0 print:w-full">
//           <div 
//             ref={printAreaRef}
//             className="w-full max-w-[380px] bg-card border border-border/40 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[500px] relative font-mono text-xs text-foreground border-dashed print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full"
//           >
//             {/* Top Thermal Header Stack */}
//             <div className="text-center space-y-1 pb-4 border-b border-dashed border-border/60">
//               <h3 className="text-sm font-black uppercase tracking-wider text-foreground">TAWALA RETAIL LTD</h3>
//               <p className="text-[10px] text-muted font-medium">Mombasa Road, Nairobi, KE</p>
//               <p className="text-[10px] text-muted font-medium">PIN: P051234567Z</p>
//             </div>

//             {/* Metadata Reference Fields Matrix */}
//             <div className="py-4 space-y-1 text-[11px] border-b border-border/40">
//               <div className="flex justify-between">
//                 <span className="text-muted">DOCUMENT TYPE:</span>
//                 <span className="font-bold text-foreground uppercase">{documentMode}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted">{documentMode === "invoice" ? "INVOICE NO:" : "RECEIPT NO:"}</span>
//                 <span className="font-bold text-foreground">{orderId}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted">DATE & TIME:</span>
//                 <span className="font-bold text-foreground">{currentTime}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted">CLERK ID:</span>
//                 <span className="font-bold text-foreground">CSH-MAIN-01</span>
//               </div>
//             </div>

//             {/* Detailed Scanned Items Breakdowns Grid */}
//             <div className="py-4 flex-1 overflow-y-auto no-scrollbar space-y-3 my-2 border-b border-dashed border-border/60 min-h-[120px]">
//               <div className="flex justify-between font-bold text-[10px] text-muted uppercase tracking-wider">
//                 <span>Description Item</span>
//                 <span>Total Cost</span>
//               </div>

//               {cart.map((item) => (
//                 <div key={item.id} className="space-y-0.5">
//                   <div className="flex justify-between text-foreground font-medium">
//                     <span className="uppercase truncate max-w-[200px]">{item.name}</span>
//                     <span className="tabular-nums font-bold">{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                   </div>
//                   <div className="text-[10px] text-muted">
//                     {item.qty} units x KES {item.price.toLocaleString()}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Summarized Aggregations Balance */}
//             <div className="pt-2 space-y-1.5 text-[11px]">
//               <div className="flex justify-between">
//                 <span className="text-muted">Gross Subtotal</span>
//                 <span className="font-bold text-foreground tabular-nums">KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted">VAT (16% Base Tax Included)</span>
//                 <span className="font-bold text-foreground tabular-nums">KES {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//               </div>
//               {discountApplied > 0 && (
//                 <div className="flex justify-between text-brand-accent">
//                   <span>Deduction Overrides</span>
//                   <span className="font-bold tabular-nums">-KES {discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                 </div>
//               )}
              
//               {/* Grand Final Payable Execution Inset */}
//               <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-border/60 mt-2 text-xs">
//                 <span className="font-black uppercase text-foreground">
//                   {documentMode === "invoice" ? "AMOUNT DUE" : "TOTAL PAID"}
//                 </span>
//                 <span className="text-sm font-black text-brand-primary tabular-nums">
//                   KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                 </span>
//               </div>
//             </div>

//             {/* Tiny Bottom Thermal Salutation Greeting */}
//             <div className="text-center pt-6 space-y-1 text-[10px] text-muted font-medium">
//               <p className="uppercase tracking-wider">
//                 {documentMode === "invoice" ? "Payment terms: Net 30" : "Thank you for your business!"}
//               </p>
//               <p>Powered cleanly by Tawala Cloud Platform</p>
//             </div>

//           </div>
//         </section>
//       </div>

//       {/* FOOTER BAR */}
//       <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[11px] z-10 text-center lg:text-left print:hidden">
//         Tawala Settlement Framework &copy; {new Date().getFullYear()}. Secure audit streams recorded locally.
//       </footer>

//     </main>
//   );
// }
"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Printer, 
  ArrowLeft, 
  RefreshCcw, 
  Download,
  Share2
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

export default function ReceiptClientView() {
  const router = useRouter();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const { businessId } = useBusinessContext();
  const [isNavigating, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { cart, getFinancials, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [documentMode, setDocumentMode] = useState<"receipt" | "invoice">("receipt");

  useEffect(() => {
    setMounted(true);
    
    const randomId = "TWL-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomId);
    
    const now = new Date();
    setCurrentTime(now.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }));

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const method = searchParams.get("method");
      if (method === "invoice") {
        setDocumentMode("invoice");
      } else {
        setDocumentMode("receipt");
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <RefreshCcw className="animate-spin text-brand-primary" size={24} aria-hidden="true" />
      </div>
    );
  }

  const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = printAreaRef.current;
      
      // Compute pixel ratios accurately for tight thermal dimensions
      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: null, // Retains rounded design container corners perfectly
        onclone: (clonedDoc) => {
          // HOTFIX: Capture the container element inside the virtual snapshot clone
          const target = clonedDoc.getElementById("receipt-capture-node");
          if (target) {
            // Read computed runtime variables
            const styles = window.getComputedStyle(printAreaRef.current!);
            const bgValue = styles.backgroundColor;
            const textColor = styles.color;

            // Fallback safety filter: if computed values rely on un-parsable oklab spaces, 
            // override them directly inside the snapshot engine with clean hex safe mappings
            target.style.backgroundColor = bgValue.includes("oklab") || bgValue.includes("oklch") ? "#ffffff" : bgValue;
            target.style.color = textColor.includes("oklab") || textColor.includes("oklch") ? "#000000" : textColor;
            
            // Clean out border function conflicts for inner elements safely
            const textMutedElements = target.querySelectorAll(".text-muted");
            textMutedElements.forEach((el) => {
              if (el instanceof HTMLElement) el.style.color = "#64748b";
            });
          }
        }
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // Standard 80mm thermal receipt width matrix conversion
      const pdfWidth = 80; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      // Flush boundaries completely to prevent arbitrary whitespace blocks or pages
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`${documentMode}_${orderId}.pdf`);
    } catch (error) {
      console.error("Critical breakdown during receipt image rasterization:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNewSaleCycle = () => {
    startTransition(() => {
      clearCart();
      if (businessId) {
        router.push(`/terminal/${businessId}`);
      } else {
        router.push("/terminal");
      }
    });
  };

  return (
    <main id="main-content" className="min-h-screen w-full bg-background text-foreground overflow-y-auto relative flex flex-col p-6 lg:p-8 print:p-0 print:bg-white selection:bg-brand-primary/10">
      
      {/* --- RECIPIENT ACTIONS CONTROLS BAR (HIDDEN ON RAW PRINT OVERLAYS) --- */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-border/40 shrink-0 relative z-10 print:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isNavigating}
            className="h-11 w-11 rounded-xl bg-card border border-border/40 flex items-center justify-center text-foreground hover:text-brand-primary transition-all active:scale-95 disabled:opacity-50"
            title="Return to operational paths"
            aria-label="Navigate back to previous transaction checkpoint"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-wider uppercase text-brand-primary block">
              {documentMode === "invoice" ? "Corporate Billing File" : "Settlement Document"}
            </span>
            <h1 className="text-base font-black text-foreground uppercase tracking-tight">
              {documentMode === "invoice" ? "Tax Invoice Generated" : "Receipt Finalized Safely"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handlePrintReceipt}
            className="h-11 px-4 bg-card border border-border/40 hover:border-brand-primary/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all text-foreground"
          >
            <Printer size={14} aria-hidden="true" />
            <span>Print {documentMode === "invoice" ? "Invoice" : "Receipt"}</span>
          </button>
          
          <button 
            type="button"
            onClick={handleNewSaleCycle}
            disabled={isNavigating}
            className="h-11 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isNavigating ? (
              <RefreshCcw size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw size={13} aria-hidden="true" />
            )}
            <span>Initialize New Order</span>
          </button>
        </div>
      </header>

      {/* --- INTERFACE FRAME: CENTERED SINGLE RECEPTACLE VIEW --- */}
      <div className="flex-1 w-full flex items-center justify-center py-12 relative z-10 print:p-0 print:block print:w-full">
        
        {/* DOM-TARGETED PHYSICAL THERMAL LEDGER CONTAINER */}
        <section className="w-full flex justify-center print:block print:w-full">
          <div 
            id="receipt-print-window"
            ref={printAreaRef}
            className="w-full max-w-[380px] bg-card border border-border/40 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col justify-between relative font-mono text-xs text-foreground border-dashed print:border-none print:shadow-none print:p-0 print:w-full"
          >
            {/* Inner Wrapper Layer with Explicit Unique ID for Safe html2canvas Hook Cloning Override */}
            <div id="receipt-capture-node" className="w-full flex flex-col justify-between bg-transparent text-foreground print:text-black">
              
              {/* Top Thermal Header Stack */}
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-border/60 print:border-black/40">
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground print:text-black">TAWALA RETAIL LTD</h2>
                <p className="text-[10px] text-muted font-medium print:text-black/70">Mombasa Road, Nairobi, KE</p>
                <p className="text-[10px] text-muted font-medium print:text-black/70">PIN: P051234567Z</p>
              </div>

              {/* Metadata Reference Fields Matrix */}
              <div className="py-4 space-y-1 text-[11px] border-b border-border/40 print:border-black/20">
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">DOCUMENT TYPE:</span>
                  <span className="font-bold text-foreground uppercase print:text-black">{documentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">{documentMode === "invoice" ? "INVOICE NO:" : "RECEIPT NO:"}</span>
                  <span className="font-bold text-foreground print:text-black">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">DATE & TIME:</span>
                  <span className="font-bold text-foreground print:text-black">{currentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">CLERK ID:</span>
                  <span className="font-bold text-foreground print:text-black">CSH-MAIN-01</span>
                </div>
              </div>

              {/* Detailed Scanned Items Breakdowns Grid */}
              <div className="py-4 space-y-3 my-2 border-b border-dashed border-border/60 print:border-black/40 min-h-[120px]">
                <div className="flex justify-between font-bold text-[10px] text-muted uppercase tracking-wider print:text-black/60">
                  <span>Description Item</span>
                  <span className="text-right">Total Cost</span>
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between text-foreground font-medium print:text-black">
                      <span className="uppercase truncate max-w-[200px] print:max-w-[160px]">{item.name}</span>
                      <span className="tabular-nums font-bold text-right">{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-[10px] text-muted print:text-black/60">
                      {item.qty} units x KES {item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summarized Aggregations Balance */}
              <div className="pt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">Gross Subtotal</span>
                  <span className="font-bold text-foreground print:text-black tabular-nums">KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted print:text-black/60">VAT (16% Base Tax Included)</span>
                  <span className="font-bold text-foreground print:text-black tabular-nums">KES {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-brand-accent print:text-black">
                    <span>Deduction Overrides</span>
                    <span className="font-bold tabular-nums">-KES {discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                {/* Grand Final Payable Execution Inset */}
                <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-border/60 mt-2 text-xs print:border-black/40">
                  <span className="font-black uppercase text-foreground print:text-black">
                    {documentMode === "invoice" ? "AMOUNT DUE" : "TOTAL PAID"}
                  </span>
                  <span className="text-sm font-black text-brand-primary print:text-black tabular-nums">
                    KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Tiny Bottom Thermal Salutation Greeting */}
              <div className="text-center pt-6 space-y-1 text-[10px] text-muted font-medium print:text-black/60">
                <p className="uppercase tracking-wider">
                  {documentMode === "invoice" ? "Payment terms: Net 30" : "Thank you for your business!"}
                </p>
                <p>Powered cleanly by Tawala Cloud Platform</p>
              </div>

              {/* ACTION TRIGGERS FLOATING ANCHOR (HIDDEN IN PRINT EXECUTION) */}
              <div className="flex items-center justify-center gap-4 pt-6 mt-4 border-t border-border/40 text-muted print:hidden">
                <button 
                  type="button" 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="p-3 bg-background border border-border/40 rounded-xl hover:text-brand-primary transition-colors shadow-sm disabled:opacity-50" 
                  title="Export as Native Thermal PDF"
                  aria-label="Download thermal receipt file"
                >
                  <Download size={14} className={isDownloading ? "animate-bounce" : ""} aria-hidden="true" />
                </button>
                <button 
                  type="button" 
                  className="p-3 bg-background border border-border/40 rounded-xl hover:text-brand-primary transition-colors shadow-sm" 
                  title="Forward Document Record"
                  aria-label="Share transaction details"
                >
                  <Share2 size={14} aria-hidden="true" />
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* FOOTER BAR */}
      <footer className="w-full pt-4 border-t border-border/40 shrink-0 text-muted font-medium text-[11px] z-10 text-center print:hidden">
        Tawala Settlement Framework &copy; {new Date().getFullYear()}. Secure audit streams recorded locally.
      </footer>

      {/* --- THERMAL HARDWARE PRINT-SPECIFIC OVERLAY STYLES --- */}
      <style jsx global>{`
        @media print {
          body, html, #main-content, main {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          body * {
            visibility: hidden !important;
          }

          #receipt-print-window,
          #receipt-print-window * {
            visibility: visible !important;
          }

          #receipt-print-window {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 72mm !important; /* Maps to 80mm roll media standards avoiding margin clip overrides */
            max-width: 72mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          
          .print\\:text-black {
            color: #000000 !important;
          }
          
          .print\\:border-black\\/40 {
            border-color: rgba(0, 0, 0, 0.4) !important;
          }
        }
      `}</style>

    </main>
  );
}