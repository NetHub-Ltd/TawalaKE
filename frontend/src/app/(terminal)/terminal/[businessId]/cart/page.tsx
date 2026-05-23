// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter, useParams } from "next/navigation";
// import {
//   ArrowLeft,
//   Trash2,
//   Minus,
//   Plus,
//   CreditCard,
//   Tag,
//   Receipt,
//   ShieldCheck,
// } from "lucide-react";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { cn } from "@/lib/utils";

// /**
//  * @Scribe_Audit
//  * Architecture: Full-page Focus Mode for high-detail checkout.
//  * UX: Maximized touch targets for tablet/touch-monitor environments.
//  * Logic: Syncs with same useCartStore used in the Sidebar Cockpit.
//  */

// export default function CheckoutPage() {
//   const router = useRouter();
//   const params = useParams();
//   const businessId = params.businessId as string;

//   const { cart, updateQty, clearCart, getTotal, discount, setDiscount } =
//     useCartStore();
//   const [mounted, setMounted] = useState(false);
//   const [isAddingDiscount, setIsAddingDiscount] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted)
//     return <div className="h-screen w-full bg-background animate-pulse" />;

//   const { subtotal, tax, total } = getTotal();

//   if (cart.length === 0) {
//     return (
//       <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-background">
//         <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-secondary/20">
//           <Receipt size={48} />
//         </div>
//         <div className="text-center space-y-2">
//           <h1 className="text-2xl font-black uppercase tracking-tighter italic">
//             Manifest Empty
//           </h1>
//           <p className="text-secondary/60 text-sm font-medium">
//             Add items in the cockpit to begin checkout.
//           </p>
//         </div>
//         <Link href={`/terminal/${businessId}`}>
//           <button className="flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
//             <ArrowLeft size={16} />
//             Back to Registry
//           </button>
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
//       {/* Top Navigation */}
//       <header className="px-10 py-8 border-b border-border/60 flex items-center justify-between bg-card/30 backdrop-blur-xl">
//         <div className="flex items-center gap-6">
//           <button
//             onClick={() => router.back()}
//             className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
//           >
//             <ArrowLeft size={20} />
//           </button>
//           <div>
//             <h1 className="text-2xl font-black uppercase tracking-tighter italic leading-none">
//               Order Review
//             </h1>
//             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
//               <ShieldCheck size={12} /> Secure Transaction Terminal
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={clearCart}
//           className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all font-black uppercase text-[10px] tracking-widest"
//         >
//           <Trash2 size={16} /> Clear Order
//         </button>
//       </header>

//       {/* Main Content Split */}
//       <main className="flex-1 flex overflow-hidden">
//         {/* Detailed Item List */}
//         <section className="flex-1 overflow-y-auto p-10 custom-scrollbar">
//           <div className="max-w-4xl mx-auto space-y-6">
//             {cart.map((item) => (
//               <div
//                 key={item.id}
//                 className="group flex items-center justify-between p-8 bg-card border border-border/40 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
//               >
//                 <div className="space-y-1">
//                   <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
//                     {item.category}
//                   </span>
//                   <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">
//                     {item.name}
//                   </h3>
//                   <p className="text-sm font-medium text-secondary/60 tabular-nums">
//                     Ksh {item.price.toLocaleString()} / unit
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-8">
//                   <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-2xl border border-border/10">
//                     <button
//                       onClick={() => updateQty(item.id, -1)}
//                       className="h-12 w-12 flex items-center justify-center bg-card rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
//                     >
//                       <Minus size={18} strokeWidth={3} />
//                     </button>
//                     <span className="text-lg font-black w-10 text-center tabular-nums">
//                       {item.qty}
//                     </span>
//                     <button
//                       onClick={() => updateQty(item.id, 1)}
//                       className="h-12 w-12 flex items-center justify-center bg-card rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
//                     >
//                       <Plus size={18} strokeWidth={3} />
//                     </button>
//                   </div>

//                   <div className="w-40 text-right">
//                     <p className="text-2xl font-black italic text-foreground tabular-nums">
//                       Ksh {(item.price * item.qty).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* Financial Summary Sidebar (Internal to Full Page) */}
//         <section className="w-[500px] bg-card border-l border-border/60 p-12 flex flex-col justify-between shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
//           <div className="space-y-10">
//             <h2 className="text-sm font-black uppercase tracking-[0.4em] text-secondary/40 border-b border-border pb-4">
//               Financial Breakdown
//             </h2>

//             <div className="space-y-6">
//               <div className="flex justify-between text-lg font-bold text-secondary/60">
//                 <span>Subtotal</span>
//                 <span className="text-foreground tabular-nums font-black">
//                   Ksh {subtotal.toLocaleString()}
//                 </span>
//               </div>

//               <div className="flex justify-between text-lg font-bold text-secondary/60">
//                 <span>Service Tax (8%)</span>
//                 <span className="text-foreground tabular-nums font-black">
//                   Ksh {tax.toLocaleString()}
//                 </span>
//               </div>

//               {/* Enhanced Discount Block */}
//               <div className="pt-6 border-t border-dashed border-border/60">
//                 {isAddingDiscount ? (
//                   <div className="relative animate-in slide-in-from-right-4">
//                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary">
//                       KSH
//                     </span>
//                     <input
//                       autoFocus
//                       type="number"
//                       className="w-full h-16 bg-muted rounded-2xl pl-14 pr-6 text-xl font-black focus:ring-4 focus:ring-primary/10 border-none transition-all"
//                       placeholder="0.00"
//                       value={discount || ""}
//                       onChange={(e) => setDiscount(Number(e.target.value))}
//                       onBlur={() => setIsAddingDiscount(false)}
//                     />
//                   </div>
//                 ) : (
//                   <button
//                     onClick={() => setIsAddingDiscount(true)}
//                     className="w-full h-16 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl flex items-center justify-center gap-3 transition-all text-primary/60 hover:text-primary"
//                   >
//                     <Tag size={20} />
//                     <span className="text-xs font-black uppercase tracking-widest">
//                       {discount > 0
//                         ? `Manual Discount: Ksh ${discount}`
//                         : "Add Discount Override"}
//                     </span>
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="space-y-8">
//             <div className="flex flex-col gap-2">
//               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
//                 Amount Payable
//               </span>
//               <div className="flex items-baseline gap-2">
//                 <span className="text-xl font-bold text-secondary/40">KSH</span>
//                 <span className="text-7xl font-black tracking-tighter italic text-foreground tabular-nums leading-none">
//                   {total.toLocaleString(undefined, {
//                     minimumFractionDigits: 2,
//                   })}
//                 </span>
//               </div>
//             </div>

//             <button className="w-full py-8 bg-foreground text-background rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-foreground/20">
//               <CreditCard size={24} />
//               Finalize & Print Receipt
//             </button>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Tag,
  Receipt,
  ShieldCheck,
  X,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";

/**
 * @Scribe_Audit
 * Architecture: Full-page Focus Mode optimized for dedicated POS touch monitors and tablets.
 * UX: Generous, distraction-free touch targets with sub-pixel spacing alignment.
 * Alignment: Syncs with parametrized financial models to enforce zero-negative pricing gates.
 */

export default function CartReviewPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;

  const { cart, updateQty, clearCart, getFinancials, discount, setDiscount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center space-y-3 animate-pulse">
          <div className="h-10 w-10 bg-slate-200 rounded-full mx-auto" />
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Synchronizing Tray Data...</p>
        </div>
      </div>
    );
  }

  // Extract financial data calculated downstream by your parameters
  const { subtotal, taxRate, taxAmount, discountApplied, grandTotal } = getFinancials();

  // Calm, human fallback when no items exist on the counter
  if (cart.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#fafbfc] p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-100 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="space-y-6 text-center max-w-sm relative z-10">
          <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-100 shadow-soft flex items-center justify-center text-slate-300 mx-auto">
            <Receipt size={32} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#1e2229] uppercase tracking-tight">
              Tray is empty
            </h1>
            <p className="text-[#5c6479] text-xs font-medium leading-relaxed">
              There are currently no items added for review. Return to the registry to fill your workspace tray.
            </p>
          </div>
          <Link href={`/terminal/${businessId || ""}`} className="block">
            <button className="inline-flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm active:scale-98">
              <ArrowLeft size={14} />
              Return to Registry
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#fafbfc] text-[#2d3142] flex flex-col overflow-hidden relative selection:bg-primary/10">
      
      {/* Decorative calm atmosphere background blur anchors */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#f0f3ff] rounded-full blur-[100px] pointer-events-none" />

      {/* --- TOP RETICULAR HEADER ZONE --- */}
      <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#2d3142] hover:text-primary hover:bg-white transition-all active:scale-95"
            title="Go back to workspace"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-primary block mb-0.5">Focus Mode Terminal</span>
            <h1 className="text-base font-black text-[#1e2229] uppercase tracking-tight">
              Tray Overview Review
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600">
            <ShieldCheck size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Secure Ledger</span>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all font-bold uppercase text-[10px] tracking-wider border border-transparent hover:border-rose-100"
          >
            <Trash2 size={13} /> Clear Order
          </button>
        </div>
      </header>

      {/* --- MAIN OPERATIONAL DIVIDER FRAME --- */}
      <main className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        
        {/* LEFT COLUMN: SCROLLABLE RETAILED ITEMS COMPARTMENT */}
        <section className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar min-h-0">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {cart.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-soft hover:border-primary/20 transition-all duration-200"
              >
                {/* Identification Details */}
                <div className="space-y-1.5 min-w-0 flex-1 pr-6">
                  <div className="inline-flex items-center bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                    <span className="text-[9px] font-black text-[#7d859a] uppercase tracking-wider">
                      {item.category || "General"}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-[#1e2229] uppercase tracking-tight truncate">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-bold text-[#7d859a]">
                    KES {item.price.toLocaleString()} per unit
                  </p>
                </div>

                {/* Counter Control Block */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200/60 rounded-lg text-slate-600 hover:text-primary shadow-soft hover:scale-105 active:scale-95 transition-all"
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-black w-8 text-center text-[#1e2229] tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200/60 rounded-lg text-slate-600 hover:text-primary shadow-soft hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Calculated Line Metric */}
                  <div className="w-28 text-right">
                    <p className="text-sm font-black text-[#1e2229] tabular-nums">
                      {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
          </div>
        </section>

        {/* RIGHT COLUMN: PROFESSIONAL FINANCIAL CALCULATOR PANEL */}
        <section className="w-[420px] bg-white border-l border-slate-100 p-8 flex flex-col justify-between shrink-0 min-h-0 bg-gradient-to-b from-white to-[#fafbfc]/50">
          
          {/* Top Calculations Stack */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7d859a] border-b border-slate-100 pb-3">
              Financial Breakdown
            </h2>

            <div className="space-y-3.5">
              <div className="flex justify-between text-xs font-bold text-[#5c6479]">
                <span>Subtotal</span>
                <span className="text-[#1e2229] tabular-nums font-black">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold text-[#5c6479]">
                <span>Estimated VAT ({taxRate * 100}%)</span>
                <span className="text-[#1e2229] tabular-nums font-black">
                  KES {taxAmount.toLocaleString()}
                </span>
              </div>

              {discountApplied > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Discount Override Applied</span>
                  <span className="tabular-nums font-black">
                    -KES {discountApplied.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Seamless Inline Discount Override Field */}
              <div className="pt-4 border-t border-dashed border-slate-100">
                {isAddingDiscount ? (
                  <div className="relative animate-in fade-in duration-200">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">
                      KES
                    </span>
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-10 text-xs font-black focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                      placeholder="Enter flat deduction amount"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      onBlur={() => !discount && setIsAddingDiscount(false)}
                      onKeyDown={(e) => e.key === "Enter" && setIsAddingDiscount(false)}
                    />
                    {discount > 0 && (
                      <button
                        onClick={() => { setDiscount(0); setIsAddingDiscount(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                        title="Remove deduction"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingDiscount(true)}
                    className="w-full h-12 border border-dashed border-slate-200 hover:border-primary/30 hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2 transition-all text-slate-400 hover:text-primary group"
                  >
                    <Tag size={13} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {discountApplied > 0
                        ? `Discount Override: KES ${discountApplied.toLocaleString()}`
                        : "Apply Discount Override"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Execution Stack */}
          <div className="space-y-5 pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7d859a]">
                Net Amount Payable
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-slate-400">KES</span>
                <span className="text-4xl font-black tracking-tight text-primary tabular-nums leading-none">
                  {grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button className="w-full h-14 bg-[#1e2229] hover:bg-[#2d3142] text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-98">
              <CreditCard size={15} strokeWidth={2} />
              Finalize & Print Invoice
            </button>
          </div>
          
        </section>
      </main>
    </div>
  );
}