// "use client";

// import React, { useEffect, useState, useCallback, useId } from "react";
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
//   AlertCircle,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { toast } from "sonner";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// /**
//  * @Scribe_Audit
//  * Architecture: Tenant-scoped React Client Component with session-based isolation verification.
//  * Accessibility: WCAG AA compliant with keyboard-accessible controls and screen reader live regions.
//  * Performance: Tabular numeric layout preventing cumulative layout shifts (CLS) on rapid price streams.
//  */

// interface EditableQuantityProps {
//   itemId: string;
//   currentQty: number;
//   updateQty: (id: string, delta: number) => void;
//   disabled?: boolean;
// }

// const EditableQuantity = ({ itemId, currentQty, updateQty, disabled }: EditableQuantityProps) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [value, setValue] = useState(currentQty.toString());
//   const inputId = useId();

//   useEffect(() => {
//     if (!isEditing) {
//       setValue(currentQty.toString());
//     }
//   }, [currentQty, isEditing]);

//   const handleCommit = useCallback(() => {
//     setIsEditing(false);
//     const parsedValue = parseFloat(value);

//     if (isNaN(parsedValue) || parsedValue <= 0) {
//       setValue(currentQty.toString());
//       return;
//     }

//     const delta = parsedValue - currentQty;
//     if (delta !== 0) {
//       updateQty(itemId, delta);
//     }
//   }, [value, currentQty, itemId, updateQty]);

//   if (isEditing) {
//     return (
//       <div className="relative flex items-center">
//         <label htmlFor={inputId} className="sr-only">Edit item quantity</label>
//         <input
//           id={inputId}
//           type="number"
//           step="any"
//           min="0.001"
//           autoFocus
//           disabled={disabled}
//           value={value}
//           onChange={(e) => setValue(e.target.value)}
//           onBlur={handleCommit}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleCommit();
//             if (e.key === "Escape") {
//               setValue(currentQty.toString());
//               setIsEditing(false);
//             }
//           }}
//           className="w-16 h-8 text-center text-xs font-bold font-mono bg-background border-2 border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none animate-in fade-in zoom-in-95 duration-100"
//         />
//       </div>
//     );
//   }

//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={() => setIsEditing(true)}
//       title="Click to enter explicit item quantity"
//       aria-label={`Current quantity ${currentQty}. Click to enter manual quantity.`}
//       className="text-xs font-bold min-w-[36px] h-8 px-1 text-center text-foreground hover:text-brand-primary hover:bg-background/80 rounded tabular-nums font-mono transition-all border border-transparent hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 flex items-center justify-center select-none cursor-pointer disabled:opacity-50"
//     >
//       {currentQty}
//     </button>
//   );
// };

// export const CartSidebar = ({ businessId: explicitBusinessId }: { businessId?: string }) => {
//   const router = useRouter();
//   const { data: session } = useSession();
//   const { organizationId, businessId: contextBusinessId } = useBusinessContext();

//   // Extract string safe identifiers for multi-tenant scope guards
//   const resolvedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;
//   const resolvedBusinessId = explicitBusinessId || (Array.isArray(contextBusinessId) ? contextBusinessId[0] : contextBusinessId);
//   const userId = session?.user?.id;

//   const {
//     cart,
//     updateQty,
//     removeFromCart,
//     clearCart,
//     getFinancials,
//     discount,
//     setDiscount,
//     validateAndSetScope,
//   } = useCartStore();

//   const [mounted, setMounted] = useState(false);
//   const [isAddingDiscount, setIsAddingDiscount] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Multi-Tenant Isolation Enforcement: Auto-purges cross-user state mismatch
//   useEffect(() => {
//     if (mounted && resolvedBusinessId && userId) {
//       validateAndSetScope(resolvedBusinessId, userId);
//     }
//   }, [mounted, resolvedBusinessId, userId, validateAndSetScope]);

//   if (!mounted) {
//     return (
//       <aside 
//         className="w-full h-full bg-card animate-pulse border-l border-border/40" 
//         aria-hidden="true"
//       />
//     );
//   }

//   const { subtotal, taxAmount, grandTotal } = getFinancials();

//   const handleExpand = () => {
//     if (resolvedBusinessId && resolvedOrgId) {
//       router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/cart`);
//     }
//   };

//   const handleClearCartWithFeedback = () => {
//     clearCart();
//     toast.info("Cart Reset", {
//       description: "All pending terminal items have been cleared.",
//     });
//   };

//   const handleCheckoutRedirect = async () => {
//     if (cart.length === 0 || !resolvedBusinessId) return;

//     setIsSubmitting(true);
//     setSubmitError(null);

//     const toastId = toast.loading("Staging transaction...", {
//       description: "Reserving stock allocations and generating database entry.",
//     });

//     const payload = {
//       business_id: resolvedBusinessId,
//       user_id: userId,
//       items: cart.map((item) => ({
//         product_id: item.id,
//         quantity: item.qty,
//       })),
//     };

//     try {
//       const response = await fetch(`/api/v1/org/stores/sales`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData?.detail || "Failed to establish pending order entry.");
//       }

//       const pendingSaleData = await response.json();

//       toast.success("Order staged successfully", {
//         id: toastId,
//         description: `Sale ID: ${pendingSaleData.id.slice(0, 8)} • Total KES ${grandTotal.toLocaleString()}`,
//       });

//       clearCart();
//       router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/checkout?sale_id=${pendingSaleData.id}`);
//     } catch (error: unknown) {
//       console.error("Checkout Submission Error:", error);
//       const fallbackMsg =
//         (error instanceof Error ? error.message : null) ||
//         "Operational pipeline error. Please try again.";
//       setSubmitError(fallbackMsg);

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
//       className="w-full h-full bg-card border-l border-border/40 flex flex-col overflow-hidden relative select-none"
//       aria-label="Active Checkout Tray Summary"
//     >
//       {/* CART HEADER */}
//       <header className="p-2 lg:p-5 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/20">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
//             <ReceiptText size={18} strokeWidth={2} aria-hidden="true" />
//           </div>
//           <div className="truncate">
//             <h2 className="text-xs font-black uppercase tracking-wider text-foreground leading-none">
//               Current Sale
//             </h2>
//             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1 block">
//               {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-1 shrink-0">
//           <button
//             type="button"
//             disabled={isSubmitting}
//             onClick={handleExpand}
//             title="Expand Tray View"
//             aria-label="Expand Cart View"
//             className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-primary hover:bg-surface/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//           >
//             <Maximize2 size={16} aria-hidden="true" />
//           </button>
//           {cart.length > 0 && (
//             <button
//               type="button"
//               disabled={isSubmitting}
//               onClick={handleClearCartWithFeedback}
//               title="Clear Tray items"
//               aria-label="Clear All Cart Items"
//               className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
//             >
//               <Trash2 size={16} aria-hidden="true" />
//             </button>
//           )}
//         </div>
//       </header>

//       {/* ITEM STREAM AREA */}
//       <div 
//         className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 flex flex-col gap-3 min-h-0 bg-surface/10"
//         aria-live="polite"
//         aria-atomic="false"
//       >
//         {cart.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
//             <div className="h-14 w-14 bg-surface/60 border border-border/40 rounded-2xl flex items-center justify-center text-muted-foreground shadow-xs">
//               <ShoppingCart size={22} aria-hidden="true" />
//             </div>
//             <div className="space-y-1">
//               <p className="font-black uppercase text-xs tracking-widest text-foreground">
//                 Tray is empty
//               </p>
//               <p className="text-[11px] text-muted-foreground max-w-[180px]">
//                 Select products from the catalog to build a transaction.
//               </p>
//             </div>
//           </div>
//         ) : (
//           cart.map((item) => (
//             <div
//               key={item.id}
//               className="group flex items-center justify-between p-3.5 bg-background border border-border/40 rounded-2xl shadow-xs hover:border-brand-primary/30 transition-all duration-200"
//             >
//               <div className="flex-1 min-w-0 pr-2">
//                 <p className="font-bold text-xs text-foreground truncate tracking-tight">
//                   {item.name}
//                 </p>
//                 <p className="text-[10px] font-bold text-muted-foreground mt-0.5 font-mono tabular-nums">
//                   KES {item.price.toLocaleString()}
//                 </p>
//               </div>

//               <div className="flex items-center bg-surface border border-border/40 rounded-xl p-1 mx-1.5 shrink-0">
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, -1)}
//                   aria-label={`Decrease quantity for ${item.name}`}
//                   className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//                 >
//                   <Minus size={12} strokeWidth={2.5} aria-hidden="true" />
//                 </button>

//                 <EditableQuantity
//                   itemId={item.id}
//                   currentQty={item.qty}
//                   updateQty={updateQty}
//                   disabled={isSubmitting}
//                 />

//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, 1)}
//                   aria-label={`Increase quantity for ${item.name}`}
//                   className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//                 >
//                   <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
//                 </button>
//               </div>

//               <div className="flex items-center gap-1.5 shrink-0 pl-1 text-right">
//                 <p className="font-black text-xs text-foreground tabular-nums font-mono">
//                   {(item.price * item.qty).toLocaleString(undefined, {
//                     minimumFractionDigits: 0,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => removeFromCart(item.id)}
//                   title="Remove Item"
//                   aria-label={`Remove ${item.name} from cart`}
//                   className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-brand-accent transition-opacity cursor-pointer disabled:opacity-0"
//                 >
//                   <X size={13} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* FINANCIAL SUMMARY & ACTIONS */}
//       <footer className="p-4 lg:p-5 border-t border-border/40 bg-card space-y-3.5 shrink-0 shadow-lg">
//         <div className="flex items-center justify-between min-h-[44px] bg-surface border border-border/40 rounded-xl px-3 py-1.5">
//           {isAddingDiscount ? (
//             <div className="relative w-full flex items-center animate-in fade-in slide-in-from-bottom-0.5 duration-200">
//               <Tag size={14} className="text-brand-primary absolute left-2" aria-hidden="true" />
//               <input
//                 autoFocus
//                 disabled={isSubmitting}
//                 type="number"
//                 min="0"
//                 className="w-full bg-transparent border-none py-1 pl-7 pr-7 text-xs font-bold text-foreground focus:outline-none focus:ring-0 placeholder-muted-foreground font-mono disabled:opacity-50"
//                 placeholder="Discount amount"
//                 value={discount || ""}
//                 onChange={(e) => setDiscount(Number(e.target.value))}
//                 onBlur={() => !discount && setIsAddingDiscount(false)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     setIsAddingDiscount(false);
//                     if (discount > 0) {
//                       toast.success("Discount Applied", {
//                         description: `Deducted KES ${discount.toLocaleString()} from grand total.`,
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
//                     toast.info("Discount Removed");
//                   }}
//                   className="absolute right-1 text-muted-foreground hover:text-brand-accent p-1.5 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
//                   title="Remove Discount"
//                   aria-label="Remove Discount"
//                 >
//                   <X size={14} aria-hidden="true" />
//                 </button>
//               )}
//             </div>
//           ) : (
//             <button
//               type="button"
//               disabled={isSubmitting}
//               onClick={() => setIsAddingDiscount(true)}
//               className="text-[11px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[44px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg px-1"
//             >
//               <Tag size={13} strokeWidth={2.5} aria-hidden="true" />
//               {discount > 0 ? `Discount: -KES ${discount.toLocaleString()}` : "Add Discount"}
//             </button>
//           )}

//           {!isAddingDiscount && discount > 0 && !isSubmitting && (
//             <button
//               type="button"
//               onClick={() => {
//                 setDiscount(0);
//                 toast.info("Discount Reset");
//               }}
//               className="text-[10px] font-bold text-brand-accent uppercase hover:underline cursor-pointer min-h-[32px] px-2 flex items-center"
//             >
//               Reset
//             </button>
//           )}
//         </div>

//         <div className="space-y-2 pt-0.5">
//           <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
//             <span>Subtotal</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {subtotal.toLocaleString()}
//             </span>
//           </div>

//           <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
//             <span>Estimated Tax</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {taxAmount.toLocaleString()}
//             </span>
//           </div>

//           {discount > 0 && (
//             <div className="flex justify-between text-[11px] font-bold text-brand-accent bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20">
//               <span>Discount Deducted</span>
//               <span className="tabular-nums font-mono">
//                 -KES {discount.toLocaleString()}
//               </span>
//             </div>
//           )}

//           <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-border/60">
//             <span className="text-xs font-black uppercase tracking-wider text-foreground">
//               Total Payable
//             </span>
//             <span className="text-lg font-black text-brand-primary tracking-tight tabular-nums font-mono">
//               KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
//         </div>

//         {submitError && (
//           <div className="p-3 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent font-bold text-center animate-in fade-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
//             <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
//             <span>{submitError}</span>
//           </div>
//         )}

//         <button
//           type="button"
//           disabled={cart.length === 0 || isSubmitting}
//           onClick={handleCheckoutRedirect}
//           className="group w-full min-h-[48px] rounded-xl bg-brand-primary text-background font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 active:scale-[0.99] transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
//         >
//           {isSubmitting ? (
//             <>
//               <Loader2 size={16} className="animate-spin" aria-hidden="true" />
//               <span>Staging Order...</span>
//             </>
//           ) : (
//             <>
//               <span>Proceed to Checkout</span>
//               <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
//             </>
//           )}
//         </button>
//       </footer>
//     </aside>
//   );
// };


// "use client";

// import React, { useEffect, useState, useCallback, useId } from "react";
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
//   AlertCircle,
//   Wrench,
//   Check,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { toast } from "sonner";
// import { useCartStore } from "@/features/sales/stores/useCartStore";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// interface EditableQuantityProps {
//   itemId: string;
//   currentQty: number;
//   updateQty: (id: string, delta: number) => void;
//   disabled?: boolean;
// }

// const EditableQuantity = ({ itemId, currentQty, updateQty, disabled }: EditableQuantityProps) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [value, setValue] = useState(currentQty.toString());
//   const inputId = useId();

//   useEffect(() => {
//     if (!isEditing) {
//       setValue(currentQty.toString());
//     }
//   }, [currentQty, isEditing]);

//   const handleCommit = useCallback(() => {
//     setIsEditing(false);
//     const parsedValue = parseFloat(value);

//     if (isNaN(parsedValue) || parsedValue <= 0) {
//       setValue(currentQty.toString());
//       return;
//     }

//     const delta = parsedValue - currentQty;
//     if (delta !== 0) {
//       updateQty(itemId, delta);
//     }
//   }, [value, currentQty, itemId, updateQty]);

//   if (isEditing) {
//     return (
//       <div className="relative flex items-center">
//         <label htmlFor={inputId} className="sr-only">Edit item quantity</label>
//         <input
//           id={inputId}
//           type="number"
//           step="any"
//           min="0.001"
//           autoFocus
//           disabled={disabled}
//           value={value}
//           onChange={(e) => setValue(e.target.value)}
//           onBlur={handleCommit}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleCommit();
//             if (e.key === "Escape") {
//               setValue(currentQty.toString());
//               setIsEditing(false);
//             }
//           }}
//           className="w-16 h-8 text-center text-xs font-bold font-mono bg-background border-2 border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none animate-in fade-in zoom-in-95 duration-100"
//         />
//       </div>
//     );
//   }

//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={() => setIsEditing(true)}
//       title="Click to enter explicit item quantity"
//       aria-label={`Current quantity ${currentQty}. Click to enter manual quantity.`}
//       className="text-xs font-bold min-w-[36px] h-8 px-1 text-center text-foreground hover:text-brand-primary hover:bg-background/80 rounded tabular-nums font-mono transition-all border border-transparent hover:border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 flex items-center justify-center select-none cursor-pointer disabled:opacity-50"
//     >
//       {currentQty}
//     </button>
//   );
// };

// export const CartSidebar = ({ businessId: explicitBusinessId }: { businessId?: string }) => {
//   const router = useRouter();
//   const { data: session } = useSession();
//   const { organizationId, businessId: contextBusinessId } = useBusinessContext();

//   const resolvedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;
//   const resolvedBusinessId =
//     explicitBusinessId || (Array.isArray(contextBusinessId) ? contextBusinessId[0] : contextBusinessId);
//   const userId = session?.user?.id;

//   const {
//     cart,
//     updateQty,
//     removeFromCart,
//     clearCart,
//     getFinancials,
//     discount,
//     setDiscount,
//     validateAndSetScope,
//   } = useCartStore();

//   const [mounted, setMounted] = useState(false);
//   const [isAddingDiscount, setIsAddingDiscount] = useState(false);
//   const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
//   const [service, setService] = useState<{ amount: number; description: string } | null>(null);
//   const [serviceAmountInput, setServiceAmountInput] = useState("");
//   const [serviceDescInput, setServiceDescInput] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const amountInputId = useId();
//   const descInputId = useId();

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (mounted && resolvedBusinessId && userId) {
//       validateAndSetScope(resolvedBusinessId, userId);
//     }
//   }, [mounted, resolvedBusinessId, userId, validateAndSetScope]);

//   if (!mounted) {
//     return (
//       <aside
//         className="w-full h-full bg-card animate-pulse border-l border-border/40"
//         aria-hidden="true"
//       />
//     );
//   }

//   const { subtotal, taxAmount, grandTotal } = getFinancials();
//   const payableGrandTotal = Math.max(0, grandTotal + (service?.amount || 0));

//   const handleExpand = () => {
//     if (resolvedBusinessId && resolvedOrgId) {
//       router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/cart`);
//     }
//   };

//   const handleClearCartWithFeedback = () => {
//     clearCart();
//     setService(null);
//     toast.info("Cart Reset", {
//       description: "All pending terminal items, discounts, and service fees cleared.",
//     });
//   };

//   const handleApplyServiceFee = (e: React.FormEvent) => {
//     e.preventDefault();
//     const parsedAmount = parseFloat(serviceAmountInput);
//     const cleanDesc = serviceDescInput.trim();

//     if (isNaN(parsedAmount) || parsedAmount <= 0) {
//       toast.error("Invalid Service Amount", {
//         description: "Please enter a valid numeric service fee greater than 0.",
//       });
//       return;
//     }

//     if (!cleanDesc) {
//       toast.error("Description Required", {
//         description: "Please specify what this service fee covers (e.g., Photocopy, Express Delivery).",
//       });
//       return;
//     }

//     setService({
//       amount: parsedAmount,
//       description: cleanDesc,
//     });
//     setIsServiceModalOpen(false);
//     toast.success("Service Fee Applied", {
//       description: `Added KES ${parsedAmount.toLocaleString()} for "${cleanDesc}".`,
//     });
//   };

//   const handleCheckoutRedirect = async () => {
//     if (cart.length === 0 || !resolvedBusinessId) return;

//     setIsSubmitting(true);
//     setSubmitError(null);

//     const toastId = toast.loading("Staging transaction...", {
//       description: "Reserving stock allocations and generating database entry.",
//     });

//     const payload = {
//       business_id: resolvedBusinessId,
//       user_id: userId,
//       items: cart.map((item) => ({
//         product_id: item.id,
//         quantity: item.qty,
//       })),
//       discount: discount || 0,
//       service: service
//         ? {
//             amount: service.amount,
//             description: service.description,
//           }
//         : null,
//     };

//     try {
//       const response = await fetch(`/api/v1/org/stores/sales`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData?.detail || "Failed to establish pending order entry.");
//       }

//       const pendingSaleData = await response.json();

//       toast.success("Order staged successfully", {
//         id: toastId,
//         description: `Sale ID: ${pendingSaleData.id.slice(0, 8)} • Total KES ${payableGrandTotal.toLocaleString()}`,
//       });

//       clearCart();
//       setService(null);
//       router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/checkout?sale_id=${pendingSaleData.id}`);
//     } catch (error: unknown) {
//       console.error("Checkout Submission Error:", error);
//       const fallbackMsg =
//         (error instanceof Error ? error.message : null) ||
//         "Operational pipeline error. Please try again.";
//       setSubmitError(fallbackMsg);

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
//       className="w-full h-full bg-card border-l border-border/40 flex flex-col overflow-hidden relative select-none"
//       aria-label="Active Checkout Tray Summary"
//     >
//       {/* CART HEADER */}
//       <header className="p-2 lg:p-5 flex items-center justify-between shrink-0 border-b border-border/40 bg-surface/20">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
//             <ReceiptText size={18} strokeWidth={2} aria-hidden="true" />
//           </div>
//           <div className="truncate">
//             <h2 className="text-xs font-black uppercase tracking-wider text-foreground leading-none">
//               Current Sale
//             </h2>
//             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1 block">
//               {cart.length === 1 ? "1 item added" : `${cart.length} items added`}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-1 shrink-0">
//           <button
//             type="button"
//             disabled={isSubmitting}
//             onClick={handleExpand}
//             title="Expand Tray View"
//             aria-label="Expand Cart View"
//             className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-primary hover:bg-surface/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//           >
//             <Maximize2 size={16} aria-hidden="true" />
//           </button>
//           {(cart.length > 0 || service || discount > 0) && (
//             <button
//               type="button"
//               disabled={isSubmitting}
//               onClick={handleClearCartWithFeedback}
//               title="Clear Tray items"
//               aria-label="Clear All Cart Items"
//               className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
//             >
//               <Trash2 size={16} aria-hidden="true" />
//             </button>
//           )}
//         </div>
//       </header>

//       {/* ITEM STREAM AREA */}
//       <div
//         className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 flex flex-col gap-3 min-h-0 bg-surface/10"
//         aria-live="polite"
//         aria-atomic="false"
//       >
//         {cart.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
//             <div className="h-14 w-14 bg-surface/60 border border-border/40 rounded-2xl flex items-center justify-center text-muted-foreground shadow-xs">
//               <ShoppingCart size={22} aria-hidden="true" />
//             </div>
//             <div className="space-y-1">
//               <p className="font-black uppercase text-xs tracking-widest text-foreground">
//                 Tray is empty
//               </p>
//               <p className="text-[11px] text-muted-foreground max-w-[180px]">
//                 Select products from the catalog to build a transaction.
//               </p>
//             </div>
//           </div>
//         ) : (
//           cart.map((item) => (
//             <div
//               key={item.id}
//               className="group flex items-center justify-between p-3.5 bg-background border border-border/40 rounded-2xl shadow-xs hover:border-brand-primary/30 transition-all duration-200"
//             >
//               <div className="flex-1 min-w-0 pr-2">
//                 <p className="font-bold text-xs text-foreground truncate tracking-tight">
//                   {item.name}
//                 </p>
//                 <p className="text-[10px] font-bold text-muted-foreground mt-0.5 font-mono tabular-nums">
//                   KES {item.price.toLocaleString()}
//                 </p>
//               </div>

//               <div className="flex items-center bg-surface border border-border/40 rounded-xl p-1 mx-1.5 shrink-0">
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, -1)}
//                   aria-label={`Decrease quantity for ${item.name}`}
//                   className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//                 >
//                   <Minus size={12} strokeWidth={2.5} aria-hidden="true" />
//                 </button>

//                 <EditableQuantity
//                   itemId={item.id}
//                   currentQty={item.qty}
//                   updateQty={updateQty}
//                   disabled={isSubmitting}
//                 />

//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => updateQty(item.id, 1)}
//                   aria-label={`Increase quantity for ${item.name}`}
//                   className="h-8 w-8 flex items-center justify-center bg-background border border-border/20 text-muted-foreground hover:text-brand-primary rounded-lg transition-all active:scale-90 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//                 >
//                   <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
//                 </button>
//               </div>

//               <div className="flex items-center gap-1.5 shrink-0 pl-1 text-right">
//                 <p className="font-black text-xs text-foreground tabular-nums font-mono">
//                   {(item.price * item.qty).toLocaleString(undefined, {
//                     minimumFractionDigits: 0,
//                     maximumFractionDigits: 2,
//                   })}
//                 </p>
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => removeFromCart(item.id)}
//                   title="Remove Item"
//                   aria-label={`Remove ${item.name} from cart`}
//                   className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-brand-accent transition-opacity cursor-pointer disabled:opacity-0"
//                 >
//                   <X size={13} aria-hidden="true" />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* FINANCIAL SUMMARY & ACTIONS */}
//       <footer className="p-4 lg:p-5 border-t border-border/40 bg-card space-y-3.5 shrink-0 shadow-lg">
//         {/* SIDE-BY-SIDE DISCOUNT & SERVICE FEE ADAPTER */}
//         <div className="grid grid-cols-2 gap-2">
//           {/* DISCOUNT CONTROL CELL */}
//           <div className="min-h-[44px] bg-surface border border-border/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
//             {isAddingDiscount ? (
//               <div className="relative w-full flex items-center animate-in fade-in zoom-in-95 duration-150">
//                 <Tag size={13} className="text-brand-primary absolute left-1.5" aria-hidden="true" />
//                 <input
//                   autoFocus
//                   disabled={isSubmitting}
//                   type="number"
//                   min="0"
//                   className="w-full bg-transparent border-none py-1 pl-6 pr-5 text-xs font-bold text-foreground focus:outline-none focus:ring-0 placeholder-muted-foreground font-mono disabled:opacity-50"
//                   placeholder="Discount"
//                   value={discount || ""}
//                   onChange={(e) => setDiscount(Number(e.target.value))}
//                   onBlur={() => !discount && setIsAddingDiscount(false)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       setIsAddingDiscount(false);
//                       if (discount > 0) {
//                         toast.success("Discount Applied", {
//                           description: `Deducted KES ${discount.toLocaleString()} from grand total.`,
//                         });
//                       }
//                     }
//                   }}
//                 />
//                 {discount > 0 && !isSubmitting && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setDiscount(0);
//                       setIsAddingDiscount(false);
//                       toast.info("Discount Removed");
//                     }}
//                     className="absolute right-0 text-muted-foreground hover:text-brand-accent p-1 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
//                     title="Remove Discount"
//                     aria-label="Remove Discount"
//                   >
//                     <X size={13} aria-hidden="true" />
//                   </button>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center justify-between w-full">
//                 <button
//                   type="button"
//                   disabled={isSubmitting}
//                   onClick={() => setIsAddingDiscount(true)}
//                   className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[44px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg truncate"
//                 >
//                   <Tag size={12} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
//                   <span className="truncate">
//                     {discount > 0 ? `-KES ${discount.toLocaleString()}` : "Discount"}
//                   </span>
//                 </button>
//                 {discount > 0 && !isSubmitting && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setDiscount(0);
//                       toast.info("Discount Reset");
//                     }}
//                     className="text-muted-foreground hover:text-brand-accent cursor-pointer min-h-[32px] px-1 flex items-center shrink-0"
//                     title="Reset Discount"
//                     aria-label="Reset Discount"
//                   >
//                     <X size={12} aria-hidden="true" />
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* SERVICE FEE CONTROL CELL */}
//           <div className="min-h-[44px] bg-surface border border-border/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
//             <div className="flex items-center justify-between w-full">
//               <button
//                 type="button"
//                 disabled={isSubmitting}
//                 onClick={() => {
//                   if (service) {
//                     setServiceAmountInput(service.amount.toString());
//                     setServiceDescInput(service.description);
//                   } else {
//                     setServiceAmountInput("");
//                     setServiceDescInput("");
//                   }
//                   setIsServiceModalOpen(true);
//                 }}
//                 className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5 hover:text-brand-primary/80 transition-all cursor-pointer min-h-[44px] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded-lg truncate"
//               >
//                 <Wrench size={12} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
//                 <span className="truncate">
//                   {service ? `+KES ${service.amount.toLocaleString()}` : "Add Service"}
//                 </span>
//               </button>
//               {service && !isSubmitting && (
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setService(null);
//                     toast.info("Service Fee Removed");
//                   }}
//                   className="text-muted-foreground hover:text-brand-accent cursor-pointer min-h-[32px] px-1 flex items-center shrink-0"
//                   title="Remove Service Fee"
//                   aria-label="Remove Service Fee"
//                 >
//                   <X size={12} aria-hidden="true" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* BREAKDOWN LEDGER */}
//         <div className="space-y-2 pt-0.5">
//           <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
//             <span>Subtotal</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {subtotal.toLocaleString()}
//             </span>
//           </div>

//           <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
//             <span>Estimated Tax</span>
//             <span className="text-foreground font-bold tabular-nums font-mono">
//               KES {taxAmount.toLocaleString()}
//             </span>
//           </div>

//           {discount > 0 && (
//             <div className="flex justify-between text-[11px] font-bold text-brand-accent bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20">
//               <span>Discount Deducted</span>
//               <span className="tabular-nums font-mono">
//                 -KES {discount.toLocaleString()}
//               </span>
//             </div>
//           )}

//           {service && (
//             <div className="flex justify-between items-center text-[11px] font-bold text-brand-primary bg-brand-primary/10 p-2 rounded-lg border border-brand-primary/20">
//               <div className="truncate pr-2">
//                 <span className="block truncate">Service: {service.description}</span>
//               </div>
//               <span className="tabular-nums font-mono shrink-0">
//                 +KES {service.amount.toLocaleString()}
//               </span>
//             </div>
//           )}

//           <div className="flex justify-between items-baseline pt-2.5 border-t border-dashed border-border/60">
//             <span className="text-xs font-black uppercase tracking-wider text-foreground">
//               Total Payable
//             </span>
//             <span className="text-lg font-black text-brand-primary tracking-tight tabular-nums font-mono">
//               KES {payableGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
//         </div>

//         {submitError && (
//           <div className="p-3 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent font-bold text-center animate-in fade-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
//             <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
//             <span>{submitError}</span>
//           </div>
//         )}

//         <button
//           type="button"
//           disabled={cart.length === 0 || isSubmitting}
//           onClick={handleCheckoutRedirect}
//           className="group w-full min-h-[48px] rounded-xl bg-brand-primary text-background font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 active:scale-[0.99] transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
//         >
//           {isSubmitting ? (
//             <>
//               <Loader2 size={16} className="animate-spin" aria-hidden="true" />
//               <span>Staging Order...</span>
//             </>
//           ) : (
//             <>
//               <span>Proceed to Checkout</span>
//               <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
//             </>
//           )}
//         </button>
//       </footer>

//       {/* SERVICE FEE MODAL DIALOG */}
//       {isServiceModalOpen && (
//         <div
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="service-modal-title"
//           className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
//           onKeyDown={(e) => {
//             if (e.key === "Escape") setIsServiceModalOpen(false);
//           }}
//         >
//           <div className="bg-card border border-border/60 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
//             <div className="flex items-center justify-between border-b border-border/40 pb-3">
//               <div className="flex items-center gap-2">
//                 <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
//                   <Wrench size={16} aria-hidden="true" />
//                 </div>
//                 <h3 id="service-modal-title" className="text-xs font-black uppercase tracking-wider text-foreground">
//                   {service ? "Edit Service Fee" : "Add Service Fee"}
//                 </h3>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setIsServiceModalOpen(false)}
//                 className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
//                 aria-label="Close Service Modal"
//               >
//                 <X size={16} aria-hidden="true" />
//               </button>
//             </div>

//             <form onSubmit={handleApplyServiceFee} className="space-y-3.5">
//               <div className="space-y-1">
//                 <label
//                   htmlFor={descInputId}
//                   className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
//                 >
//                   Description <span className="text-brand-accent">*</span>
//                 </label>
//                 <input
//                   id={descInputId}
//                   type="text"
//                   required
//                   autoFocus
//                   placeholder="e.g., Photocopy, Binding, Custom Service"
//                   value={serviceDescInput}
//                   onChange={(e) => setServiceDescInput(e.target.value)}
//                   className="w-full h-10 px-3 bg-surface border border-border/40 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder-muted-foreground"
//                 />
//               </div>

//               <div className="space-y-1">
//                 <label
//                   htmlFor={amountInputId}
//                   className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
//                 >
//                   Amount (KES) <span className="text-brand-accent">*</span>
//                 </label>
//                 <input
//                   id={amountInputId}
//                   type="number"
//                   step="any"
//                   min="0.01"
//                   required
//                   placeholder="0.00"
//                   value={serviceAmountInput}
//                   onChange={(e) => setServiceAmountInput(e.target.value)}
//                   className="w-full h-10 px-3 bg-surface border border-border/40 rounded-xl text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder-muted-foreground"
//                 />
//               </div>

//               <div className="flex gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setIsServiceModalOpen(false)}
//                   className="flex-1 h-10 rounded-xl bg-surface border border-border/40 text-muted-foreground font-bold text-xs uppercase hover:bg-surface/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 h-10 rounded-xl bg-brand-primary text-background font-bold text-xs uppercase flex items-center justify-center gap-1.5 hover:bg-brand-primary/90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
//                 >
//                   <Check size={14} strokeWidth={2.5} aria-hidden="true" />
//                   <span>Save Fee</span>
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </aside>
//   );
// };

"use client";

import React, { useEffect, useState, useCallback, useId } from "react";
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
  AlertCircle,
  Wrench,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

interface EditableQuantityProps {
  itemId: string;
  currentQty: number;
  updateQty: (id: string, delta: number) => void;
  disabled?: boolean;
}

const EditableQuantity = ({ itemId, currentQty, updateQty, disabled }: EditableQuantityProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentQty.toString());
  const inputId = useId();

  useEffect(() => {
    if (!isEditing) {
      setValue(currentQty.toString());
    }
  }, [currentQty, isEditing]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    const parsedValue = parseFloat(value);

    if (isNaN(parsedValue) || parsedValue <= 0) {
      setValue(currentQty.toString());
      return;
    }

    const delta = parsedValue - currentQty;
    if (delta !== 0) {
      updateQty(itemId, delta);
    }
  }, [value, currentQty, itemId, updateQty]);

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        <label htmlFor={inputId} className="sr-only">Edit quantity</label>
        <input
          id={inputId}
          type="number"
          step="any"
          min="0.001"
          autoFocus
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommit();
            if (e.key === "Escape") {
              setValue(currentQty.toString());
              setIsEditing(false);
            }
          }}
          className="w-12 h-7 text-center text-xs font-semibold font-mono bg-background border border-brand-primary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      title="Click to enter manual quantity"
      aria-label={`Current quantity ${currentQty}. Click to enter manual quantity.`}
      className="text-xs font-semibold min-w-[32px] h-7 px-1 text-center text-foreground hover:text-brand-primary hover:bg-background/60 rounded-md tabular-nums font-mono transition-colors border border-transparent hover:border-border/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 flex items-center justify-center cursor-pointer disabled:opacity-50"
    >
      {currentQty}
    </button>
  );
};

export const CartSidebar = ({ businessId: explicitBusinessId }: { businessId?: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { organizationId, businessId: contextBusinessId } = useBusinessContext();

  const resolvedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId;
  const resolvedBusinessId =
    explicitBusinessId || (Array.isArray(contextBusinessId) ? contextBusinessId[0] : contextBusinessId);
  const userId = session?.user?.id;

  const {
    cart,
    updateQty,
    removeFromCart,
    clearCart,
    getFinancials,
    discount,
    setDiscount,
    validateAndSetScope,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [service, setService] = useState<{ amount: number; description: string } | null>(null);
  const [serviceAmountInput, setServiceAmountInput] = useState("");
  const [serviceDescInput, setServiceDescInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const amountInputId = useId();
  const descInputId = useId();

  const isCartEmpty = cart.length === 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && resolvedBusinessId && userId) {
      validateAndSetScope(resolvedBusinessId, userId);
    }
  }, [mounted, resolvedBusinessId, userId, validateAndSetScope]);

  if (!mounted) {
    return (
      <aside
        className="w-full h-full bg-card/50 animate-pulse border-l border-border/30"
        aria-hidden="true"
      />
    );
  }

  const { subtotal, taxAmount, grandTotal } = getFinancials();
  const payableGrandTotal = Math.max(0, grandTotal + (service?.amount || 0));

  const handleExpand = () => {
    if (resolvedBusinessId && resolvedOrgId) {
      router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/cart`);
    }
  };

  const handleClearCartWithFeedback = () => {
    clearCart();
    setService(null);
    toast.info("Cart Reset", {
      description: "All pending terminal items, discounts, and service fees cleared.",
    });
  };

  const handleApplyServiceFee = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(serviceAmountInput);
    const cleanDesc = serviceDescInput.trim();

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid numeric service fee greater than 0.",
      });
      return;
    }

    if (!cleanDesc) {
      toast.error("Description Required", {
        description: "Please specify what this service fee covers.",
      });
      return;
    }

    setService({
      amount: parsedAmount,
      description: cleanDesc,
    });
    setIsServiceModalOpen(false);
    toast.success("Service Fee Added", {
      description: `Added KES ${parsedAmount.toLocaleString()} for "${cleanDesc}".`,
    });
  };

  const handleCheckoutRedirect = async () => {
    if (isCartEmpty || !resolvedBusinessId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const toastId = toast.loading("Staging transaction...", {
      description: "Reserving stock allocations and generating transaction entry.",
    });

    const payload = {
      business_id: resolvedBusinessId,
      // user_id: userId,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
      })),
      discount: discount || 0,
      service: service
        ? {
            amount: service.amount,
            description: service.description,
          }
        : null,
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Failed to establish pending order entry.");
      }

      const pendingSaleData = await response.json();

      toast.success("Order staged successfully", {
        id: toastId,
        description: `Sale ID: ${pendingSaleData.id.slice(0, 8)} • Total KES ${payableGrandTotal.toLocaleString()}`,
      });

      clearCart();
      setService(null);
      router.push(`/org/${resolvedOrgId}/${resolvedBusinessId}/checkout?sale_id=${pendingSaleData.id}`);
    } catch (error: unknown) {
      console.error("Checkout Submission Error:", error);
      const fallbackMsg =
        (error instanceof Error ? error.message : null) ||
        "Operational pipeline error. Please try again.";
      setSubmitError(fallbackMsg);

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
      className="w-full h-full bg-card border-l border-border/30 flex flex-col overflow-hidden relative select-none"
      aria-label="Active Checkout Tray Summary"
    >
      {/* CART HEADER */}
      <header className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-border/30 bg-surface/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/15 shrink-0">
            <ReceiptText size={16} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 leading-tight">
              Current Sale
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide mt-0.5 block">
              {cart.length === 1 ? "1 item" : `${cart.length} items`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleExpand}
            title="Expand Tray View"
            aria-label="Expand Cart View"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-surface/50 transition-colors active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <Maximize2 size={15} aria-hidden="true" />
          </button>
          {(!isCartEmpty || service || discount > 0) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClearCartWithFeedback}
              title="Clear Tray items"
              aria-label="Clear All Cart Items"
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-muted-foreground/70 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* ITEM STREAM AREA */}
      <div
        className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 min-h-0 bg-surface/5"
        aria-live="polite"
        aria-atomic="false"
      >
        {isCartEmpty ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-2">
            <div className="h-11 w-11 bg-surface/30 border border-border/20 rounded-xl flex items-center justify-center text-muted-foreground/40">
              <ShoppingCart size={18} aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-xs text-muted-foreground/60 tracking-wide">
                Tray is empty
              </p>
              <p className="text-[11px] text-muted-foreground/40 max-w-[170px] leading-relaxed">
                Select products from catalog to start standard checkout.
              </p>
            </div>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2.5 bg-background border border-border/30 rounded-xl shadow-2xs hover:border-border/60 transition-all duration-150"
            >
              {/* Product Info (Truncates smoothly with tooltip, zero layout shift) */}
              <div className="flex-1 min-w-0 pr-2.5">
                <p
                  title={item.name}
                  className="font-medium text-xs text-foreground/90 truncate leading-snug tracking-tight"
                >
                  {item.name}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5 font-mono tabular-nums">
                  KES {item.price.toLocaleString()}
                </p>
              </div>

              {/* Quantity Stepper Control */}
              <div className="flex items-center bg-surface/50 border border-border/20 rounded-lg p-0.5 mx-1 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => updateQty(item.id, -1)}
                  aria-label={`Decrease quantity for ${item.name}`}
                  className="h-6 w-6 flex items-center justify-center bg-background/80 border border-border/10 text-muted-foreground/80 hover:text-foreground rounded-md transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                >
                  <Minus size={11} strokeWidth={2} aria-hidden="true" />
                </button>

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
                  aria-label={`Increase quantity for ${item.name}`}
                  className="h-6 w-6 flex items-center justify-center bg-background/80 border border-border/10 text-muted-foreground/80 hover:text-foreground rounded-md transition-all active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                >
                  <Plus size={11} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              {/* Line Price & Remove */}
              <div className="flex items-center gap-1 shrink-0 pl-1 text-right">
                <p className="font-semibold text-xs text-foreground/90 tabular-nums font-mono min-w-[54px]">
                  {(item.price * item.qty).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => removeFromCart(item.id)}
                  title="Remove Item"
                  aria-label={`Remove ${item.name} from cart`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground/50 hover:text-brand-accent transition-opacity cursor-pointer disabled:opacity-0"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FINANCIAL SUMMARY & ACTIONS */}
      <footer className="p-3.5 border-t border-border/30 bg-card space-y-3 shrink-0">
        {/* DUAL ACTION CONTROLS (GRAYED OUT WHEN CART IS EMPTY) */}
        <div className="grid grid-cols-2 gap-2">
          {/* DISCOUNT CONTROL */}
          <div
            className={`min-h-[38px] bg-surface/40 border border-border/30 rounded-xl px-2.5 py-1 flex items-center justify-between transition-opacity ${
              isCartEmpty ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
            }`}
          >
            {isAddingDiscount ? (
              <div className="relative w-full flex items-center">
                <Tag size={12} className="text-brand-primary absolute left-1" aria-hidden="true" />
                <input
                  autoFocus
                  disabled={isSubmitting || isCartEmpty}
                  type="number"
                  min="0"
                  className="w-full bg-transparent border-none py-1 pl-5 pr-4 text-xs font-semibold text-foreground focus:outline-none focus:ring-0 placeholder-muted-foreground/50 font-mono"
                  placeholder="Discount"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  onBlur={() => !discount && setIsAddingDiscount(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsAddingDiscount(false);
                      if (discount > 0) {
                        toast.success("Discount Applied", {
                          description: `Deducted KES ${discount.toLocaleString()} from subtotal.`,
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
                      toast.info("Discount Removed");
                    }}
                    className="absolute right-0 text-muted-foreground/60 hover:text-brand-accent p-1 cursor-pointer"
                    title="Remove Discount"
                    aria-label="Remove Discount"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full min-w-0">
                <button
                  type="button"
                  disabled={isSubmitting || isCartEmpty}
                  onClick={() => setIsAddingDiscount(true)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-brand-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none truncate"
                >
                  <Tag size={11} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                  <span className="truncate">
                    {discount > 0 ? `-KES ${discount.toLocaleString()}` : "Discount"}
                  </span>
                </button>
                {discount > 0 && !isSubmitting && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscount(0);
                      toast.info("Discount Reset");
                    }}
                    className="text-muted-foreground/50 hover:text-brand-accent cursor-pointer px-0.5 shrink-0"
                    title="Reset Discount"
                    aria-label="Reset Discount"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ADD SERVICE FEE CONTROL */}
          <div
            className={`min-h-[38px] bg-surface/40 border border-border/30 rounded-xl px-2.5 py-1 flex items-center justify-between transition-opacity ${
              isCartEmpty ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <button
                type="button"
                disabled={isSubmitting || isCartEmpty}
                onClick={() => {
                  if (service) {
                    setServiceAmountInput(service.amount.toString());
                    setServiceDescInput(service.description);
                  } else {
                    setServiceAmountInput("");
                    setServiceDescInput("");
                  }
                  setIsServiceModalOpen(true);
                }}
                className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-brand-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed focus:outline-none truncate"
              >
                <Wrench size={11} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                <span className="truncate">
                  {service ? `+KES ${service.amount.toLocaleString()}` : "Add Service Fee"}
                </span>
              </button>
              {service && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => {
                    setService(null);
                    toast.info("Service Fee Removed");
                  }}
                  className="text-muted-foreground/50 hover:text-brand-accent cursor-pointer px-0.5 shrink-0"
                  title="Remove Service Fee"
                  aria-label="Remove Service Fee"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BREAKDOWN LEDGER */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground/70">
            <span>Subtotal</span>
            <span className="text-foreground/90 font-medium tabular-nums font-mono">
              KES {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-[11px] font-medium text-muted-foreground/70">
            <span>Estimated Tax</span>
            <span className="text-foreground/90 font-medium tabular-nums font-mono">
              KES {taxAmount.toLocaleString()}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-[11px] font-semibold text-brand-accent bg-brand-accent/5 p-1.5 rounded-lg border border-brand-accent/15">
              <span>Discount</span>
              <span className="tabular-nums font-mono">
                -KES {discount.toLocaleString()}
              </span>
            </div>
          )}

          {service && (
            <div className="flex justify-between items-center text-[11px] font-semibold text-brand-primary bg-brand-primary/5 p-1.5 rounded-lg border border-brand-primary/15">
              <span className="truncate pr-2">Service: {service.description}</span>
              <span className="tabular-nums font-mono shrink-0">
                +KES {service.amount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Total Payable
            </span>
            <span className="text-base font-bold text-brand-primary tracking-tight tabular-nums font-mono">
              KES {payableGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="p-2.5 text-[11px] bg-brand-accent/10 border border-brand-accent/20 rounded-lg text-brand-accent font-semibold text-center flex items-center justify-center gap-1.5">
            <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={isCartEmpty || isSubmitting}
          onClick={handleCheckoutRedirect}
          className="group w-full min-h-[44px] rounded-xl bg-brand-primary text-background font-semibold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 active:scale-[0.99] transition-all shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              <span>Staging Order...</span>
            </>
          ) : (
            <>
              <span>Proceed to Checkout</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </>
          )}
        </button>
      </footer>

      {/* SERVICE FEE MODAL DIALOG */}
      {isServiceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsServiceModalOpen(false);
          }}
        >
          <div className="bg-card border border-border/40 rounded-2xl w-full max-w-sm p-4 shadow-xl space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/15">
                  <Wrench size={14} aria-hidden="true" />
                </div>
                <h3 id="service-modal-title" className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {service ? "Edit Service Fee" : "Add Service Fee"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 text-muted-foreground/60 hover:text-foreground rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                aria-label="Close Service Modal"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleApplyServiceFee} className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor={descInputId}
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  Description <span className="text-brand-accent">*</span>
                </label>
                <input
                  id={descInputId}
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Express Delivery, Custom Labor"
                  value={serviceDescInput}
                  onChange={(e) => setServiceDescInput(e.target.value)}
                  className="w-full h-9 px-3 bg-surface/50 border border-border/30 rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder-muted-foreground/40"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={amountInputId}
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  Amount (KES) <span className="text-brand-accent">*</span>
                </label>
                <input
                  id={amountInputId}
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={serviceAmountInput}
                  onChange={(e) => setServiceAmountInput(e.target.value)}
                  className="w-full h-9 px-3 bg-surface/50 border border-border/30 rounded-lg text-xs font-semibold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder-muted-foreground/40"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 h-9 rounded-lg bg-surface/60 border border-border/30 text-muted-foreground/80 font-medium text-xs uppercase hover:bg-surface transition-colors cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 rounded-lg bg-brand-primary text-background font-semibold text-xs uppercase flex items-center justify-center gap-1 hover:bg-brand-primary/90 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                  <span>Save Fee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};