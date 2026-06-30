// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   ShoppingCart,
//   Trash2,
//   Minus,
//   Plus,
//   ReceiptText,
//   Maximize2,
//   Tag,
//   X,
//   ArrowRight,
//   Loader2,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner"; // Modern, context-clean notifications engine
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Minimalist high-throughput transactional side panel completely tracking global design tokens.
//  * UX: Meets Fitts's Law touch compliance targets (min 44px on primary interactions) for active fast-retail contexts.
//  * Architecture: Optimized Zustand state streaming backed by contextual multi-tenant routes.
//  */

// export const CartSidebar = ({ businessId }: { businessId?: string }) => {
//   const router = useRouter();
//   const { cart, updateQty, clearCart, getFinancials, discount, setDiscount } = useCartStore();
//   const { organizationId } = useBusinessContext();

//   const [mounted, setMounted] = useState(false);
//   const [isAddingDiscount, setIsAddingDiscount] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Structural skeleton loader leveraging internal card token constraints
//   if (!mounted) {
//     return (
//       <div 
//         className="w-full h-full bg-card animate-pulse border-l border-border/40" 
//         aria-hidden="true"
//       />
//     );
//   }

//   // Precision financial ledger extraction
//   const { subtotal, taxAmount, grandTotal } = getFinancials();

//   const handleExpand = () => {
//     if (businessId) {
//       router.push(`/org/${organizationId}/${businessId}/cart`);
//     }
//   };

//   const handleClearCartWithFeedback = () => {
//     clearCart();
//     toast.info("Cart Cleared", {
//       description: "All pending terminal line items have been removed.",
//     });
//   };

//   // Asynchronous operational pipeline communicating with create_pending_sale
//   const handleCheckoutRedirect = async () => {
//     if (cart.length === 0 || !businessId) return;

//     setIsSubmitting(true);
//     setSubmitError(null);

//     // Initial user lifecycle progress indicator
//     const toastId = toast.loading("Staging transaction...", {
//       description: "Reserving items and generating secure pending ledger lines.",
//     });

//     // Transform local Zustand cart definitions into backend's validation payload schema
//     const payload = {
//       business_id: businessId,
//       items: cart.map((item) => ({
//         product_id: item.id,
//         quantity: item.qty,
//       })),
//     };

//     try {
//       const response = await fetch(`/api/v1/org/stores/sales`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData?.detail || "Failed to establish pending database ledger reference.");
//       }

//       const pendingSaleData = await response.json();
      
//       // Update loading toast instance to explicit operational completion state
//       toast.success("Order staged successfully", {
//         id: toastId,
//         description: `Sale reference generated for KES ${grandTotal.toLocaleString()}`,
//       });

//       // Purge memory parameters of standard terminal arrays immediately prior to navigational dispatch
//       clearCart();

//       // Direct user down to the multi-tenant physical payment checkout node
//       router.push(`/org/${organizationId}/${businessId}/checkout?sale_id=${pendingSaleData.id}`);
      
//     } catch (error: any) {
//       console.error("Pending Checkout Submission Error:", error);
//       const fallbackMsg = error?.message || "An operational pipeline error occurred. Please try again.";
      
//       setSubmitError(fallbackMsg);
      
//       // Flash structural failure contextual details
//       toast.error("Checkout staging failed", {
//         id: toastId,
//         description: fallbackMsg,
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <aside 
//       className="w-full h-full bg-card border-l border-border/40 flex flex-col overflow-hidden relative"
//       aria-label="Active Checkout Tray Summary"
//     >
      
//       {/* --- CART HEADER ZONE --- */}
//       <div className="p-4 lg:p-6 pb-4 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/20">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
//             <ReceiptText size={18} strokeWidth={2} aria-hidden="true" />
//           </div>
//           <div className="truncate">
//             <h2 className="text-xs font-black uppercase tracking-wider text-foreground leading-none">
//               Current Sale
//             </h2>
//             <p className="text-[10px] text-muted font-bold uppercase tracking-wide mt-1 block">
//               {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
//             </p>
//           </div>
//         </div>

//         {/* Dynamic Context Tool Bar (Fitts's Law touch target tracking enabled) */}
//         <div className="flex items-center gap-0.5 shrink-0">
//           <button
//             type="button"
//             disabled={isSubmitting}
//             onClick={handleExpand}
//             title="Expand Tray View"
//             className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted hover:text-brand-primary hover:bg-surface/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30"
//           >
//             <Maximize2 size={15} aria-hidden="true" />
//           </button>
//           {cart.length > 0 && (
//             <button
//               type="button"
//               disabled={isSubmitting}
//               onClick={handleClearCartWithFeedback}
//               title="Clear Tray items"
//               className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer disabled:opacity-30"
//             >
//               <Trash2 size={15} aria-hidden="true" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* --- ITEM STREAM AREA --- */}
//       <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 flex flex-col gap-3 min-h-0 bg-surface/10">
//         {cart.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3">
//             <div className="h-12 w-12 bg-surface/60 border border-border/40 rounded-full flex items-center justify-center text-muted">
//               <ShoppingCart size={18} aria-hidden="true" />
//             </div>
//             <p className="font-bold uppercase text-[10px] tracking-widest text-muted">
//               Tray is empty
//             </p>
//           </div>
//         ) : (
//           cart.map((item) => (
//             <div
//               key={item.id}
//               className="group flex items-center justify-between p-4 bg-background border border-border/40 rounded-2xl shadow-xs hover:border-brand-primary/30 transition-all duration-200"
//             >
//               <div className="flex-1 min-w-0 pr-2">
//                 <p className="font-bold text-xs text-foreground truncate tracking-tight">
//                   {item.name}
//                 </p>
//                 <p className="text-[10px] font-bold text-muted mt-0.5 font-mono">
//                   KES {item.price.toLocaleString()}
//                 </p>
//               </div>

//               {/* Seamless Quantity Counter Actions */}
//               <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 mx-2 shrink-0">
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, -1)}
//                   className="h-7 w-7 flex items-center justify-center bg-background border border-border/20 text-muted hover:text-brand-primary rounded-md transition-all active:scale-90 cursor-pointer disabled:opacity-30"
//                 >
//                   <Minus size={10} strokeWidth={3} aria-hidden="true" />
//                 </button>
//                 <span className="text-[11px] font-bold w-7 text-center text-foreground tabular-nums font-mono">
//                   {item.qty}
//                 </span>
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, 1)}
//                   className="h-7 w-7 flex items-center justify-center bg-background border border-border/20 text-muted hover:text-brand-primary rounded-md transition-all active:scale-90 cursor-pointer disabled:opacity-30"
//                 >
//                   <Plus size={10} strokeWidth={3} aria-hidden="true" />
//                 </button>
//               </div>

//               <div className="text-right shrink-0 pl-1">
//                 <p className="font-black text-xs text-foreground tabular-nums font-mono">
//                   {(item.price * item.qty).toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* --- FINANCIAL DISCOUNTS & SUMMARY BALANCING --- */}
//       <div className="p-4 lg:p-6 border-t border-border/40 bg-card space-y-4 shrink-0 shadow-lg">
        
//         {/* Adaptive Discount Engine Wrapper */}
//         <div className="flex items-center justify-between min-h-[40px] bg-surface border border-border/40 rounded-xl px-3 py-1.5">
//           {isAddingDiscount ? (
//             <div className="relative w-full flex items-center animate-in fade-in slide-in-from-bottom-0.5 duration-200">
//               <Tag size={13} className="text-brand-primary absolute left-1" aria-hidden="true" />
//               <input
//                 autoFocus
//                 disabled={isSubmitting}
//                 type="number"
//                 min="0"
//                 className="w-full bg-transparent border-none py-0 pl-6 pr-6 text-xs font-bold text-foreground focus:outline-none focus:ring-0 placeholder-muted/50 font-mono disabled:opacity-50"
//                 placeholder="Enter KES amount"
//                 value={discount || ""}
//                 onChange={(e) => setDiscount(Number(e.target.value))}
//                 onBlur={() => !discount && setIsAddingDiscount(false)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     setIsAddingDiscount(false);
//                     if (discount > 0) {
//                       toast.success("Discount Registered", {
//                         description: `Deduction value of KES ${discount.toLocaleString()} applied to totals.`,
//                       });
//                     }
//                   }
//                 }}
//               />
//               {discount > 0 && !isSubmitting && (
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setDiscount(0);
//                     setIsAddingDiscount(false);
//                     toast.info("Discount Cancelled");
//                   }}
//                   className="absolute right-0 text-muted hover:text-brand-accent p-1 cursor-pointer"
//                   title="Remove Discount"
//                 >
//                   <X size={12} aria-hidden="true" />
//                 </button>
//               )}
//             </div>
//           ) : (
//             <button
//               type="button"
//               disabled={isSubmitting}
//               onClick={() => setIsAddingDiscount(true)}
//               className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[32px] disabled:opacity-40"
//             >
//               <Tag size={11} strokeWidth={2.5} aria-hidden="true" />
//               {discount > 0 ? `Discount Applied: -KES ${discount.toLocaleString()}` : "Add Discount"}
//             </button>
//           )}

//           {!isAddingDiscount && discount > 0 && !isSubmitting && (
//             <button 
//               type="button"
//               onClick={() => {
//                 setDiscount(0);
//                 toast.info("Discount Reset");
//               }}
//               className="text-[9px] font-bold text-brand-accent uppercase hover:underline cursor-pointer"
//             >
//               Reset
//             </button>
//           )}
//         </div>

//         {/* Financial Sub-Ledger Calculations */}
//         <div className="space-y-2.5 pt-1">
//           <div className="flex justify-between text-[11px] font-medium text-muted">
//             <span>Subtotal</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {subtotal.toLocaleString()}
//             </span>
//           </div>

//           <div className="flex justify-between text-[11px] font-medium text-muted">
//             <span>Estimated Tax</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {taxAmount.toLocaleString()}
//             </span>
//           </div>

//           {discount > 0 && (
//             <div className="flex justify-between text-[11px] font-bold text-brand-accent bg-brand-accent/5 p-1.5 rounded-md border border-brand-accent/10">
//               <span>Discount Deducted</span>
//               <span className="tabular-nums font-mono">
//                 -KES {discount.toLocaleString()}
//               </span>
//             </div>
//           )}

//           {/* Core Payable Grand Anchor */}
//           <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-border/60">
//             <span className="text-xs font-black uppercase tracking-wider text-foreground">
//               Total Payable
//             </span>
//             <div className="text-right">
//               <span className="text-lg font-black text-brand-primary tracking-tight tabular-nums font-mono">
//                 KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Runtime Exception Alert Box */}
//         {submitError && (
//           <div className="p-3 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent font-bold text-center animate-in fade-in zoom-in-95 duration-150">
//             {submitError}
//           </div>
//         )}

//         {/* --- CHECKOUT REDIRECT ROUTE BUTTON WITH INTERCEPT --- */}
//         <button
//           type="button"
//           disabled={cart.length === 0 || isSubmitting}
//           onClick={handleCheckoutRedirect}
//           className="group w-full h-12 rounded-xl bg-brand-primary text-background font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-md disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
//         >
//           {isSubmitting ? (
//             <>
//               <Loader2 size={14} className="animate-spin" aria-hidden="true" />
//               <span>Staging Pending Order...</span>
//             </>
//           ) : (
//             <>
//               <span>Proceed to Checkout</span>
//               <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
//             </>
//           )}
//         </button>
//       </div>
//     </aside>
//   );
// };

"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ReceiptText,
  Maximize2,
  Tag,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Modern, context-clean notifications engine
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * @Scribe_Audit
 * Aesthetic: Minimalist high-throughput transactional side panel completely tracking global design tokens.
 * UX: Meets Fitts's Law touch compliance targets (min 44px on primary interactions) for active fast-retail contexts.
 * Architecture: Optimized Zustand state streaming backed by contextual multi-tenant routes. Enhanced to support inline floating-point quantities.
 */

interface EditableQuantityProps {
  itemId: string;
  currentQty: number;
  updateQty: (id: string, delta: number) => void;
  disabled?: boolean;
}

/**
 * Isolated micro-interaction component for float quantity direct editing.
 * Prevents root re-renders on active keystrokes and encapsulates input validation gates.
 */
const EditableQuantity = ({ itemId, currentQty, updateQty, disabled }: EditableQuantityProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentQty.toString());

  // Keep internal input value synchronized with external state stream alterations (+/- adjustments)
  useEffect(() => {
    if (!isEditing) {
      setValue(currentQty.toString());
    }
  }, [currentQty, isEditing]);

  const handleCommit = () => {
    setIsEditing(false);
    const parsedValue = parseFloat(value);

    // Structural input validation gate
    if (isNaN(parsedValue) || parsedValue <= 0) {
      setValue(currentQty.toString());
      return;
    }

    // Bridge float parameters over the existing delta-based Zustand store pipeline
    const delta = parsedValue - currentQty;
    if (delta !== 0) {
      updateQty(itemId, delta);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        step="any"
        min="0.001"
        autoFocus
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => e.key === "Enter" && handleCommit()}
        className="w-14 h-7 text-center text-xs font-bold font-mono bg-background border border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none animate-in fade-in zoom-in-95 duration-100"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      title="Click to manually enter quantity"
      className="text-[11px] font-bold min-w-8 h-7 px-1 text-center text-foreground hover:text-brand-primary hover:bg-background/80 rounded tabular-nums font-mono transition-all border border-transparent hover:border-border/40 cursor-edit flex items-center justify-center select-none"
    >
      {currentQty}
    </button>
  );
};

export const CartSidebar = ({ businessId }: { businessId?: string }) => {
  const router = useRouter();
  const { cart, updateQty, clearCart, getFinancials, discount, setDiscount } = useCartStore();
  const { organizationId } = useBusinessContext();

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Structural skeleton loader leveraging internal card token constraints
  if (!mounted) {
    return (
      <div 
        className="w-full h-full bg-card animate-pulse border-l border-border/40" 
        aria-hidden="true"
      />
    );
  }

  // Precision financial ledger extraction
  const { subtotal, taxAmount, grandTotal } = getFinancials();

  const handleExpand = () => {
    if (businessId) {
      router.push(`/org/${organizationId}/${businessId}/cart`);
    }
  };

  const handleClearCartWithFeedback = () => {
    clearCart();
    toast.info("Cart Cleared", {
      description: "All pending terminal line items have been removed.",
    });
  };

  // Asynchronous operational pipeline communicating with create_pending_sale
  const handleCheckoutRedirect = async () => {
    if (cart.length === 0 || !businessId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Initial user lifecycle progress indicator
    const toastId = toast.loading("Staging transaction...", {
      description: "Reserving items and generating secure pending ledger lines.",
    });

    // Transform local Zustand cart definitions into backend's validation payload schema
    const payload = {
      business_id: businessId,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.qty, // Correctly forwards float parameters to downstream service pipelines
      })),
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Failed to establish pending database ledger reference.");
      }

      const pendingSaleData = await response.json();
      
      // Update loading toast instance to explicit operational completion state
      toast.success("Order staged successfully", {
        id: toastId,
        description: `Sale reference generated for KES ${grandTotal.toLocaleString()}`,
      });

      // Purge memory parameters of standard terminal arrays immediately prior to navigational dispatch
      clearCart();

      // Direct user down to the multi-tenant physical payment checkout node
      router.push(`/org/${organizationId}/${businessId}/checkout?sale_id=${pendingSaleData.id}`);
      
    } catch (error: any) {
      console.error("Pending Checkout Submission Error:", error);
      const fallbackMsg = error?.message || "An operational pipeline error occurred. Please try again.";
      
      setSubmitError(fallbackMsg);
      
      // Flash structural failure contextual details
      toast.error("Checkout staging failed", {
        id: toastId,
        description: fallbackMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside 
      className="w-full h-full bg-card border-l border-border/40 flex flex-col overflow-hidden relative"
      aria-label="Active Checkout Tray Summary"
    >
      
      {/* --- CART HEADER ZONE --- */}
      <div className="p-4 lg:p-6 pb-4 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
            <ReceiptText size={18} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground leading-none">
              Current Sale
            </h2>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wide mt-1 block">
              {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
            </p>
          </div>
        </div>

        {/* Dynamic Context Tool Bar (Fitts's Law touch target tracking enabled) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExpand}
            title="Expand Tray View"
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted hover:text-brand-primary hover:bg-surface/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30"
          >
            <Maximize2 size={15} aria-hidden="true" />
          </button>
          {cart.length > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClearCartWithFeedback}
              title="Clear Tray items"
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer disabled:opacity-30"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* --- ITEM STREAM AREA --- */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 flex flex-col gap-3 min-h-0 bg-surface/10">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="h-12 w-12 bg-surface/60 border border-border/40 rounded-full flex items-center justify-center text-muted">
              <ShoppingCart size={18} aria-hidden="true" />
            </div>
            <p className="font-bold uppercase text-[10px] tracking-widest text-muted">
              Tray is empty
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-4 bg-background border border-border/40 rounded-2xl shadow-xs hover:border-brand-primary/30 transition-all duration-200"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-xs text-foreground truncate tracking-tight">
                  {item.name}
                </p>
                <p className="text-[10px] font-bold text-muted mt-0.5 font-mono">
                  KES {item.price.toLocaleString()}
                </p>
              </div>

              {/* Seamless Quantity Counter Actions */}
              <div className="flex items-center bg-surface border border-border/40 rounded-lg p-0.5 mx-2 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateQty(item.id, -1)}
                  className="h-7 w-7 flex items-center justify-center bg-background border border-border/20 text-muted hover:text-brand-primary rounded-md transition-all active:scale-90 cursor-pointer disabled:opacity-30"
                >
                  <Minus size={10} strokeWidth={3} aria-hidden="true" />
                </button>
                
                {/* Embedded Direct Float Input Engine */}
                <EditableQuantity
                  itemId={item.id}
                  currentQty={item.qty}
                  updateQty={updateQty}
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateQty(item.id, 1)}
                  className="h-7 w-7 flex items-center justify-center bg-background border border-border/20 text-muted hover:text-brand-primary rounded-md transition-all active:scale-90 cursor-pointer disabled:opacity-30"
                >
                  <Plus size={10} strokeWidth={3} aria-hidden="true" />
                </button>
              </div>

              <div className="text-right shrink-0 pl-1">
                <p className="font-black text-xs text-foreground tabular-nums font-mono">
                  {(item.price * item.qty).toLocaleString(undefined, { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- FINANCIAL DISCOUNTS & SUMMARY BALANCING --- */}
      <div className="p-4 lg:p-6 border-t border-border/40 bg-card space-y-4 shrink-0 shadow-lg">
        
        {/* Adaptive Discount Engine Wrapper */}
        <div className="flex items-center justify-between min-h-[40px] bg-surface border border-border/40 rounded-xl px-3 py-1.5">
          {isAddingDiscount ? (
            <div className="relative w-full flex items-center animate-in fade-in slide-in-from-bottom-0.5 duration-200">
              <Tag size={13} className="text-brand-primary absolute left-1" aria-hidden="true" />
              <input
                autoFocus
                disabled={isSubmitting}
                type="number"
                min="0"
                className="w-full bg-transparent border-none py-0 pl-6 pr-6 text-xs font-bold text-foreground focus:outline-none focus:ring-0 placeholder-muted/50 font-mono disabled:opacity-50"
                placeholder="Enter KES amount"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                onBlur={() => !discount && setIsAddingDiscount(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsAddingDiscount(false);
                    if (discount > 0) {
                      toast.success("Discount Registered", {
                        description: `Deduction value of KES ${discount.toLocaleString()} applied to totals.`,
                      });
                    }
                  }
                }}
              />
              {discount > 0 && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscount(0);
                    setIsAddingDiscount(false);
                    toast.info("Discount Cancelled");
                  }}
                  className="absolute right-0 text-muted hover:text-brand-accent p-1 cursor-pointer"
                  title="Remove Discount"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddingDiscount(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[32px] disabled:opacity-40"
            >
              <Tag size={11} strokeWidth={2.5} aria-hidden="true" />
              {discount > 0 ? `Discount Applied: -KES ${discount.toLocaleString()}` : "Add Discount"}
            </button>
          )}

          {!isAddingDiscount && discount > 0 && !isSubmitting && (
            <button 
              type="button"
              onClick={() => {
                setDiscount(0);
                toast.info("Discount Reset");
              }}
              className="text-[9px] font-bold text-brand-accent uppercase hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Financial Sub-Ledger Calculations */}
        <div className="space-y-2.5 pt-1">
          <div className="flex justify-between text-[11px] font-medium text-muted">
            <span>Subtotal</span>
            <span className="text-foreground font-bold tabular-nums font-mono">
              KES {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-[11px] font-medium text-muted">
            <span>Estimated Tax</span>
            <span className="text-foreground font-bold tabular-nums font-mono">
              KES {taxAmount.toLocaleString()}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-[11px] font-bold text-brand-accent bg-brand-accent/5 p-1.5 rounded-md border border-brand-accent/10">
              <span>Discount Deducted</span>
              <span className="tabular-nums font-mono">
                -KES {discount.toLocaleString()}
              </span>
            </div>
          )}

          {/* Core Payable Grand Anchor */}
          <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-border/60">
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              Total Payable
            </span>
            <div className="text-right">
              <span className="text-lg font-black text-brand-primary tracking-tight tabular-nums font-mono">
                KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Exception Alert Box */}
        {submitError && (
          <div className="p-3 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent font-bold text-center animate-in fade-in zoom-in-95 duration-150">
            {submitError}
          </div>
        )}

        {/* --- CHECKOUT REDIRECT ROUTE BUTTON WITH INTERCEPT --- */}
        <button
          type="button"
          disabled={cart.length === 0 || isSubmitting}
          onClick={handleCheckoutRedirect}
          className="group w-full h-12 rounded-xl bg-brand-primary text-background font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all shadow-md disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>Staging Pending Order...</span>
            </>
          ) : (
            <>
              <span>Proceed to Checkout</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};