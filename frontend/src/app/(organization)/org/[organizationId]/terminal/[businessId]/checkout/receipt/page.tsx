// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { 
//   Printer, 
//   ArrowLeft, 
//   RefreshCcw, 
//   CheckCircle2, 
//   FileText, 
//   Sparkles,
//   Download,
//   Share2
// } from "lucide-react";
// import { useCartStore } from "@/features/sales/stores/useCartStore";

// export default function ReceiptPage() {
//   const router = useRouter();
//   const printAreaRef = useRef<HTMLDivElement>(null);
  
//   // Local states to capture store snapshot before we clear it for the next order workflow
//   const { cart, getFinancials, clearCart } = useCartStore();
//   const [mounted, setMounted] = useState(false);
//   const [orderId, setOrderId] = useState("");
//   const [currentTime, setCurrentTime] = useState("");
//   const [paymentType, setPaymentType] = useState("CASH");

//   useEffect(() => {
//     setMounted(true);
    
//     // Generate static checkout constants upon initial component layout initialization
//     const randomId = "TWL-" + Math.floor(100000 + Math.random() * 900000);
//     setOrderId(randomId);
    
//     const now = new Date();
//     setCurrentTime(now.toLocaleDateString("en-KE", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }) + " " + now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }));

//     // Fallback detection logic to determine chosen checkout route parameters dynamically 
//     if (typeof window !== "undefined") {
//       const searchParams = new URLSearchParams(window.location.search);
//       const method = searchParams.get("method");
//       if (method) setPaymentType(method.toUpperCase());
//     }
//   }, []);

//   if (!mounted) {
//     return (
//       <div className="h-screen w-full bg-[#fafbfc] flex items-center justify-center">
//         <RefreshCcw className="animate-spin text-primary" size={20} />
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
//     clearCart(); // Safely wipe out current order arrays
//     router.push("/terminal"); // Return dashboard terminal view bounds
//   };

//   return (
//     <div className="h-screen w-full bg-[#fafbfc] text-[#2d3142] overflow-hidden relative flex flex-col p-6 lg:p-8 print:p-0 print:bg-white selection:bg-primary/10">
      
//       {/* Dynamic graphic ambient layer accents (Hidden entirely during raw system printing layouts) */}
//       <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#f0f3ff] rounded-full blur-[120px] pointer-events-none print:hidden" />

//       {/* --- RECIPIENT ACTIONS CONTROLS BAR (HIDDEN ON RAW PRINT OVERLAYS) --- */}
//       <header className="w-full flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 relative z-10 print:hidden">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => router.back()}
//             className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#2d3142] hover:text-primary transition-all active:scale-95"
//             title="Return to operational paths"
//           >
//             <ArrowLeft size={16} />
//           </button>
//           <div>
//             <span className="text-[9px] font-black tracking-wider uppercase text-primary block">Settlement Document</span>
//             <h1 className="text-base font-black text-[#1e2229] uppercase tracking-tight">Invoice Generated Safely</h1>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button 
//             onClick={handlePrintReceipt}
//             className="h-10 px-4 bg-white border border-slate-200/80 hover:border-primary/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-98 text-[#1e2229]"
//           >
//             <Printer size={14} />
//             <span>Print Invoice</span>
//           </button>
//           <button 
//             onClick={handleNewSaleCycle}
//             className="h-10 px-4 bg-[#1e2229] hover:bg-[#2d3142] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-98"
//           >
//             <RefreshCcw size={13} />
//             <span>Initialize New Order</span>
//           </button>
//         </div>
//       </header>

//       {/* --- MAIN SPLIT INTERFACE FRAME --- */}
//       <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center min-h-0 py-6 relative z-10 print:p-0 print:block">
        
//         {/* LEFT COLUMN: COMPLETION ALERT CONSOLE INFOCARD (HIDDEN ON PRINT PLOTS) */}
//         <section className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left space-y-5 max-w-sm mx-auto print:hidden">
//           <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mx-auto lg:mx-0 shadow-sm">
//             <CheckCircle2 size={22} />
//           </div>
//           <div className="space-y-2">
//             <h2 className="text-xl font-black text-[#1e2229] uppercase tracking-tight">Biashara Record Written</h2>
//             <p className="text-xs font-medium text-[#5c6479] leading-relaxed">
//               This system snapshot uses live memory variables. Once you initialize a new order, variables are updated to preserve processing speed.
//             </p>
//           </div>
          
//           <div className="flex items-center justify-center lg:justify-start gap-4 pt-2 text-[#7d859a]">
//             <button className="p-2.5 bg-white border border-slate-100 rounded-xl hover:text-primary transition-colors shadow-soft" title="Export as PDF Document">
//               <Download size={14} />
//             </button>
//             <button className="p-2.5 bg-white border border-slate-100 rounded-xl hover:text-primary transition-colors shadow-soft" title="Forward Invoice to WhatsApp/Email">
//               <Share2 size={14} />
//             </button>
//           </div>
//         </section>

//         {/* RIGHT COLUMN: REPLICATED PHYSICAL THERMAL LEDGER CONTAINER */}
//         <section className="lg:col-span-7 flex items-center justify-center h-full min-h-0 print:p-0 print:w-full">
//           <div 
//             ref={printAreaRef}
//             className="w-full max-w-[380px] bg-white border border-slate-200/60 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[500px] relative font-mono text-xs text-slate-800 border-dashed print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full"
//           >
            
//             {/* Top Thermal Header Stack */}
//             <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
//               <h3 className="text-sm font-black uppercase tracking-wider text-[#1e2229]">TAWALA RETAIL LTD</h3>
//               <p className="text-[10px] text-slate-500 font-medium">Mombasa Road, Nairobi, KE</p>
//               <p className="text-[10px] text-slate-500 font-medium">PIN: P051234567Z</p>
//             </div>

//             {/* Metadata Reference Fields Matrix */}
//             <div className="py-4 space-y-1 text-[11px] border-b border-slate-100">
//               <div className="flex justify-between">
//                 <span className="text-slate-400">INVOICE NO:</span>
//                 <span className="font-bold text-[#1e2229]">{orderId}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">DATE & TIME:</span>
//                 <span className="font-bold text-[#1e2229]">{currentTime}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">PAYMENT ROUTE:</span>
//                 <span className="font-bold text-primary">{paymentType}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">CLERK ID:</span>
//                 <span className="font-bold text-[#1e2229]">CSH-MAIN-01</span>
//               </div>
//             </div>

//             {/* Detailed Scanned Items Breakdowns Grid */}
//             <div className="py-4 flex-1 overflow-y-auto no-scrollbar space-y-3 my-2 border-b border-dashed border-slate-200 min-h-[120px]">
//               <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
//                 <span>Description Item</span>
//                 <span>Total Cost</span>
//               </div>

//               {cart.map((item) => (
//                 <div key={item.id} className="space-y-0.5">
//                   <div className="flex justify-between text-[#1e2229] font-medium">
//                     <span className="uppercase truncate max-w-[200px]">{item.name}</span>
//                     <span className="tabular-nums font-bold">{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                   </div>
//                   <div className="text-[10px] text-slate-400">
//                     {item.qty} units x KES {item.price.toLocaleString()}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Summarized Aggregations Balance */}
//             <div className="pt-2 space-y-1.5 text-[11px]">
//               <div className="flex justify-between">
//                 <span className="text-slate-400">Gross Subtotal</span>
//                 <span className="font-bold text-[#1e2229] tabular-nums">KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-400">VAT (16% Base Tax Included)</span>
//                 <span className="font-bold text-[#1e2229] tabular-nums">KES {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//               </div>
//               {discountApplied > 0 && (
//                 <div className="flex justify-between text-emerald-600">
//                   <span>Deduction Overrides</span>
//                   <span className="font-bold tabular-nums">-KES {discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
//                 </div>
//               )}
              
//               {/* Grand Final Payable Execution Inset */}
//               <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-200 mt-2 text-xs">
//                 <span className="font-black uppercase text-[#1e2229]">NET TOTAL DUE</span>
//                 <span className="text-sm font-black text-primary tabular-nums">
//                   KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                 </span>
//               </div>
//             </div>

//             {/* Tiny Bottom Thermal Salutation Greeting */}
//             <div className="text-center pt-6 space-y-1 text-[10px] text-slate-400 font-medium">
//               <p className="uppercase tracking-wider">Thank you for your business!</p>
//               <p>Powered cleanly by Tawala Cloud Platform</p>
//             </div>

//           </div>
//         </section>
//       </div>

//       {/* FOOTER BAR */}
//       <footer className="w-full pt-4 border-t border-slate-100 shrink-0 text-[#7d859a] font-medium text-[11px] z-10 text-center lg:text-left print:hidden">
//         Tawala Settlement Framework &copy; {new Date().getFullYear()}. Secure audit streams recorded locally.
//       </footer>

//     </div>
//   );
// }

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Printer, 
  ArrowLeft, 
  RefreshCcw, 
  CheckCircle2, 
  FileText, 
  Download,
  Share2
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

export default function ReceiptPage() {
  const router = useRouter();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const { businessId } = useBusinessContext();
  
  // Local states to capture store snapshot before we clear it for the next order workflow
  const { cart, getFinancials, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [documentMode, setDocumentMode] = useState<"receipt" | "invoice">("receipt");

  useEffect(() => {
    setMounted(true);
    
    // Generate static checkout constants upon initial component layout initialization
    const randomId = "TWL-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomId);
    
    const now = new Date();
    setCurrentTime(now.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }));

    // Read variant parameters directly from current browser URL location context
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
      <div className="h-screen w-full bg-[#fafbfc] flex items-center justify-center">
        <RefreshCcw className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleNewSaleCycle = () => {
    clearCart(); // Safely wipe out current checkout items from the memory layer
    
    // Fall back or redirect to active workspace terminal framework smoothly
    if (businessId) {
      router.push(`/terminal/${businessId}`);
    } else {
      router.push("/terminal");
    }
  };

  return (
    <div className="h-screen w-full bg-[#fafbfc] text-[#2d3142] overflow-hidden relative flex flex-col p-6 lg:p-8 print:p-0 print:bg-white selection:bg-primary/10">
      
      {/* Dynamic graphic ambient layer accents (Hidden entirely during raw system printing layouts) */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#f0f3ff] rounded-full blur-[120px] pointer-events-none print:hidden" />

      {/* --- RECIPIENT ACTIONS CONTROLS BAR (HIDDEN ON RAW PRINT OVERLAYS) --- */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 relative z-10 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#2d3142] hover:text-primary transition-all active:scale-95"
            title="Return to operational paths"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-wider uppercase text-primary block">
              {documentMode === "invoice" ? "Corporate Billing File" : "Settlement Document"}
            </span>
            <h1 className="text-base font-black text-[#1e2229] uppercase tracking-tight">
              {documentMode === "invoice" ? "Tax Invoice Generated" : "Receipt Finalized Safely"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrintReceipt}
            className="h-10 px-4 bg-white border border-slate-200/80 hover:border-primary/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-98 text-[#1e2229]"
          >
            <Printer size={14} />
            <span>Print {documentMode === "invoice" ? "Invoice" : "Receipt"}</span>
          </button>
          <button 
            onClick={handleNewSaleCycle}
            className="h-10 px-4 bg-[#1e2229] hover:bg-[#2d3142] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-98"
          >
            <RefreshCcw size={13} />
            <span>Initialize New Order</span>
          </button>
        </div>
      </header>

      {/* --- MAIN SPLIT INTERFACE FRAME --- */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center min-h-0 py-6 relative z-10 print:p-0 print:block">
        
        {/* LEFT COLUMN: COMPLETION ALERT CONSOLE INFOCARD (HIDDEN ON PRINT PLOTS) */}
        <section className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left space-y-5 max-w-sm mx-auto print:hidden">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mx-auto lg:mx-0 shadow-sm">
            {documentMode === "invoice" ? <FileText size={20} className="text-primary" /> : <CheckCircle2 size={22} />}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#1e2229] uppercase tracking-tight">
              {documentMode === "invoice" ? "Invoice Dispatched" : "Biashara Record Written"}
            </h2>
            <p className="text-xs font-medium text-[#5c6479] leading-relaxed">
              This system snapshot uses live memory variables. Once you initialize a new order, terminal instances are wiped to preserve safe transaction tracking parameters.
            </p>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-4 pt-2 text-[#7d859a]">
            <button className="p-2.5 bg-white border border-slate-100 rounded-xl hover:text-primary transition-colors shadow-soft" title="Export as PDF Document">
              <Download size={14} />
            </button>
            <button className="p-2.5 bg-white border border-slate-100 rounded-xl hover:text-primary transition-colors shadow-soft" title="Forward Document to WhatsApp/Email">
              <Share2 size={14} />
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: REPLICATED PHYSICAL THERMAL LEDGER CONTAINER */}
        <section className="lg:col-span-7 flex items-center justify-center h-full min-h-0 print:p-0 print:w-full">
          <div 
            ref={printAreaRef}
            className="w-full max-w-[380px] bg-white border border-slate-200/60 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[500px] relative font-mono text-xs text-slate-800 border-dashed print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full"
          >
            
            {/* Top Thermal Header Stack */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#1e2229]">TAWALA RETAIL LTD</h3>
              <p className="text-[10px] text-slate-500 font-medium">Mombasa Road, Nairobi, KE</p>
              <p className="text-[10px] text-slate-500 font-medium">PIN: P051234567Z</p>
            </div>

            {/* Metadata Reference Fields Matrix */}
            <div className="py-4 space-y-1 text-[11px] border-b border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">DOCUMENT TYPE:</span>
                <span className="font-bold text-[#1e2229] uppercase">{documentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{documentMode === "invoice" ? "INVOICE NO:" : "RECEIPT NO:"}</span>
                <span className="font-bold text-[#1e2229]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DATE & TIME:</span>
                <span className="font-bold text-[#1e2229]">{currentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CLERK ID:</span>
                <span className="font-bold text-[#1e2229]">CSH-MAIN-01</span>
              </div>
            </div>

            {/* Detailed Scanned Items Breakdowns Grid */}
            <div className="py-4 flex-1 overflow-y-auto no-scrollbar space-y-3 my-2 border-b border-dashed border-slate-200 min-h-[120px]">
              <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Description Item</span>
                <span>Total Cost</span>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="flex justify-between text-[#1e2229] font-medium">
                    <span className="uppercase truncate max-w-[200px]">{item.name}</span>
                    <span className="tabular-nums font-bold">{(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.qty} units x KES {item.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Summarized Aggregations Balance */}
            <div className="pt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Subtotal</span>
                <span className="font-bold text-[#1e2229] tabular-nums">KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VAT (16% Base Tax Included)</span>
                <span className="font-bold text-[#1e2229] tabular-nums">KES {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {discountApplied > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Deduction Overrides</span>
                  <span className="font-bold tabular-nums">-KES {discountApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {/* Grand Final Payable Execution Inset */}
              <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-200 mt-2 text-xs">
                <span className="font-black uppercase text-[#1e2229]">
                  {documentMode === "invoice" ? "AMOUNT DUE" : "TOTAL PAID"}
                </span>
                <span className="text-sm font-black text-primary tabular-nums">
                  KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Tiny Bottom Thermal Salutation Greeting */}
            <div className="text-center pt-6 space-y-1 text-[10px] text-slate-400 font-medium">
              <p className="uppercase tracking-wider">
                {documentMode === "invoice" ? "Payment terms: Net 30" : "Thank you for your business!"}
              </p>
              <p>Powered cleanly by Tawala Cloud Platform</p>
            </div>

          </div>
        </section>
      </div>

      {/* FOOTER BAR */}
      <footer className="w-full pt-4 border-t border-slate-100 shrink-0 text-[#7d859a] font-medium text-[11px] z-10 text-center lg:text-left print:hidden">
        Tawala Settlement Framework &copy; {new Date().getFullYear()}. Secure audit streams recorded locally.
      </footer>

    </div>
  );
}