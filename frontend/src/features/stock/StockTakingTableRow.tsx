// // "use client";

// // import React, { useState, useId } from "react";
// // import { useForm } from "react-hook-form";
// // import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
// // import { ProductResponse } from "@/lib/api/generated/models";

// // interface StockTakingFormData {
// //   quantity: number;
// //   buying_price: number;
// //   selling_price: number;
// //   // reference_id: string;
// //   reference_type: string;
// //   notes: string;
// // }

// // interface StockTakingTableRowProps {
// //   product: ProductResponse;
// //   businessId: string;
// //   onSaveSuccess: (payload: unknown) => Promise<void>;
// // }

// // export const REFERENCE_GROUPS = [
// //   {
// //     group: "Inventory Audits",
// //     options: [
// //       { value: "INITIAL_STOCK_TAKE", label: "Initial Inventory Audit" },
// //       { value: "ROUTINE_COUNT", label: "Routine Cycle Count" },
// //     ],
// //   },
// //   {
// //     group: "Inbound Stock",
// //     options: [
// //       { value: "PURCHASE_ORDER", label: "Supplier Purchase Order (PO)" },
// //       { value: "GOODS_RECEIVED", label: "Goods Received Note (GRN)" },
// //       { value: "CUSTOMER_RETURN", label: "Customer Return / Restock" },
// //     ],
// //   },
// //   {
// //     group: "Adjustments & Write-Offs",
// //     options: [
// //       { value: "COUNT_CORRECTION", label: "Manual Variance Correction" },
// //       { value: "DAMAGE_EXPIRE", label: "Damaged / Expired Stock" },
// //       { value: "INTERNAL_USE", label: "Internal Store Consumption" },
// //     ],
// //   },
// // ] as const;

// // export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
// //   product,
// //   businessId,
// //   onSaveSuccess,
// // }) => {
// //   const [isExpanded, setIsExpanded] = useState(false);
// //   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
// //   const [errorMessage, setErrorMessage] = useState("");

// //   const quantityId = useId();
// //   const buyingPriceId = useId();
// //   const sellingPriceId = useId();
// //   const referenceTypeId = useId();
// //   // const referenceId = useId();
// //   const notesId = useId();

// //   const defaultBuyingPrice = (product.attributes as { buying_price?: number })?.buying_price ?? 0;
// //   const defaultSellingPrice = product.selling_price ?? 0;
// //   const currentLedgerStock = product.stock ?? 0;
// //   const sku = (product.attributes as { sku?: string })?.sku || "NO_SKU";

// //   const {
// //     register,
// //     handleSubmit,
// //     formState: { errors, isDirty },
// //     reset,
// //   } = useForm<StockTakingFormData>({
// //     defaultValues: {
// //       quantity: currentLedgerStock,
// //       buying_price: defaultBuyingPrice,
// //       selling_price: defaultSellingPrice,
// //       // reference_id: "",
// //       reference_type: "INITIAL_STOCK_TAKE",
// //       notes: "",
// //     },
// //   });

// //   const toggleExpand = () => setIsExpanded((prev) => !prev);

// //   const onSubmit = async (data: StockTakingFormData) => {
// //     try {
// //       setStatus("saving");
// //       setErrorMessage("");

// //       const finalPayload = {
// //         product_id: product.id,
// //         business_id: businessId,
// //         quantity: data.quantity,
// //         buying_price: data.buying_price,
// //         selling_price: data.selling_price,
// //         // reference_id: data.reference_id.trim() || undefined,
// //         reference_type: data.reference_type,
// //         notes: data.notes.trim() || "New stock recorded.",
// //       };

// //       await onSaveSuccess(finalPayload);

// //       setStatus("success");
// //       reset({
// //         quantity: data.quantity,
// //         buying_price: data.buying_price,
// //         selling_price: data.selling_price,
// //         // reference_id: data.reference_id,
// //         reference_type: data.reference_type,
// //         notes: "",
// //       });
// //       setIsExpanded(false);
// //     } catch (err: unknown) {
// //       setStatus("error");
// //       const msg = err instanceof Error ? err.message : "Failed to record new stock data.";
// //       setErrorMessage(msg);
// //     }
// //   };

// //   return (
// //     <>
// //       <tr
// //         onClick={toggleExpand}
// //         onKeyDown={(e) => {
// //           if (e.key === "Enter" || e.key === " ") {
// //             e.preventDefault();
// //             toggleExpand();
// //           }
// //         }}
// //         tabIndex={0}
// //         role="button"
// //         aria-expanded={isExpanded}
// //         aria-label={`Toggle new stock form for ${product.label}`}
// //         className="border-b border-border bg-background hover:bg-card cursor-pointer transition-colors duration-150 select-none"
// //       >
// //         <td colSpan={2} className="px-6 py-4">
// //           <div className="flex items-center gap-3">
// //             <div className="text-muted shrink-0" aria-hidden="true">
// //               {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
// //             </div>
// //             <div>
// //               <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
// //                 {product.label}
// //               </h4>
// //               <p className="text-[10px] text-muted font-mono font-semibold tracking-wider mt-0.5">
// //                 SKU: {sku} &bull; {product.category || "General"}
// //               </p>
// //             </div>
// //           </div>
// //         </td>

// //         <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
// //           {currentLedgerStock}
// //         </td>

// //         <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
// //           KES {defaultBuyingPrice.toLocaleString()}
// //         </td>

// //         <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground text-right">
// //           KES {defaultSellingPrice.toLocaleString()}
// //         </td>
// //       </tr>

// //       {isExpanded && (
// //         <tr className="bg-card border-b border-border">
// //           <td colSpan={5} className="p-6">
// //             <div className="space-y-4">
// //               <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 border-none p-0 m-0">
// //                 <legend className="sr-only">New Stock Entry Form for {product.label}</legend>

// //                 <div>
// //                   <label
// //                     htmlFor={quantityId}
// //                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
// //                   >
// //                     Physical Count
// //                   </label>
// //                   <input
// //                     id={quantityId}
// //                     type="number"
// //                     step="any"
// //                     onFocus={(e) => e.target.select()}
// //                     disabled={status === "saving"}
// //                     {...register("quantity", {
// //                       required: "Physical count is required",
// //                       valueAsNumber: true,
// //                       min: { value: 0, message: "Count cannot be negative" },
// //                     })}
// //                     placeholder="0.00"
// //                     className="w-full text-xs font-mono font-bold px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
// //                   />
// //                   {errors.quantity && (
// //                     <p className="text-[10px] text-brand-primary font-bold mt-1">
// //                       {errors.quantity.message}
// //                     </p>
// //                   )}
// //                 </div>

// //                 <div>
// //                   <label
// //                     htmlFor={buyingPriceId}
// //                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
// //                   >
// //                     Cost Price (KES)
// //                   </label>
// //                   <div className="relative">
// //                     <span
// //                       className="absolute left-3 top-2 text-[10px] font-bold text-muted"
// //                       aria-hidden="true"
// //                     >
// //                       KES
// //                     </span>
// //                     <input
// //                       id={buyingPriceId}
// //                       type="number"
// //                       step="any"
// //                       onFocus={(e) => e.target.select()}
// //                       disabled={status === "saving"}
// //                       {...register("buying_price", {
// //                         required: "Cost price is required",
// //                         valueAsNumber: true,
// //                         min: { value: 0, message: "Price cannot be negative" },
// //                       })}
// //                       className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
// //                     />
// //                   </div>
// //                   {errors.buying_price && (
// //                     <p className="text-[10px] text-brand-primary font-bold mt-1">
// //                       {errors.buying_price.message}
// //                     </p>
// //                   )}
// //                 </div>

// //                 <div>
// //                   <label
// //                     htmlFor={sellingPriceId}
// //                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
// //                   >
// //                     Retail Price (KES)
// //                   </label>
// //                   <div className="relative">
// //                     <span
// //                       className="absolute left-3 top-2 text-[10px] font-bold text-muted"
// //                       aria-hidden="true"
// //                     >
// //                       KES
// //                     </span>
// //                     <input
// //                       id={sellingPriceId}
// //                       type="number"
// //                       step="any"
// //                       onFocus={(e) => e.target.select()}
// //                       disabled={status === "saving"}
// //                       {...register("selling_price", {
// //                         required: "Selling price is required",
// //                         valueAsNumber: true,
// //                         min: { value: 0, message: "Price cannot be negative" },
// //                       })}
// //                       className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
// //                     />
// //                   </div>
// //                   {errors.selling_price && (
// //                     <p className="text-[10px] text-brand-primary font-bold mt-1">
// //                       {errors.selling_price.message}
// //                     </p>
// //                   )}
// //                 </div>

// //                 <div>
// //                   <label
// //                     htmlFor={referenceTypeId}
// //                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
// //                   >
// //                     Reference Type
// //                   </label>
// //                   <select
// //                     id={referenceTypeId}
// //                     disabled={status === "saving"}
// //                     {...register("reference_type")}
// //                     className="w-full text-xs font-medium px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs cursor-pointer"
// //                   >
// //                     {REFERENCE_GROUPS.map((group) => (
// //                       <optgroup key={group.group} label={group.group}>
// //                         {group.options.map((option) => (
// //                           <option key={option.value} value={option.value}>
// //                             {option.label}
// //                           </option>
// //                         ))}
// //                       </optgroup>
// //                     ))}
// //                   </select>
// //                 </div>


// //                 <div>
// //                   <label
// //                     htmlFor={notesId}
// //                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
// //                   >
// //                     New Stock Notes
// //                   </label>
// //                   <input
// //                     id={notesId}
// //                     type="text"
// //                     disabled={status === "saving"}
// //                     placeholder="e.g. Physical inventory count verified"
// //                     {...register("notes")}
// //                     className="w-full text-xs px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
// //                   />
// //                 </div>
// //               </fieldset>

// //               {status === "error" && errorMessage && (
// //                 <div
// //                   role="alert"
// //                   className="p-3 bg-background border border-brand-primary text-brand-primary rounded-md text-xs font-bold"
// //                 >
// //                   {errorMessage}
// //                 </div>
// //               )}

// //               <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
// //                 <button
// //                   type="button"
// //                   onClick={() => setIsExpanded(false)}
// //                   disabled={status === "saving"}
// //                   className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border bg-background text-foreground rounded-md hover:bg-card focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50 cursor-pointer"
// //                 >
// //                   Cancel
// //                 </button>

// //                 <button
// //                   type="button"
// //                   onClick={handleSubmit(onSubmit)}
// //                   disabled={!isDirty || status === "saving"}
// //                   className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-primary text-background rounded-md hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50 min-w-[120px] cursor-pointer"
// //                 >
// //                   {status === "saving" ? (
// //                     <>
// //                       <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" aria-hidden="true" />
// //                       Saving...
// //                     </>
// //                   ) : (
// //                     <>
// //                       <Save className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
// //                       New Stock
// //                     </>
// //                   )}
// //                 </button>
// //               </div>
// //             </div>
// //           </td>
// //         </tr>
// //       )}
// //     </>
// //   );
// // };

// // // testing so that we can commit dev

// "use client";

// import React, { useState, useId, useMemo, useCallback } from "react";
// import { useForm } from "react-hook-form";
// import {
//   Loader2,
//   Save,
//   ChevronDown,
//   ChevronUp,
//   AlertTriangle,
//   CalendarCheck,
//   CalendarX,
//   Clock,
// } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// // =========================================================
// // Utility: Class Name Merging
// // =========================================================

// function cn(...inputs: (string | boolean | undefined | null)[]): string {
//   return inputs.filter(Boolean).join(" ");
// }

// // =========================================================
// // Domain Data Types & Interfaces
// // =========================================================

// export interface ProductResponseLastStockTake {
//   id?: string;
//   date?: string | Date;
//   performed_by?: string;
//   notes?: string;
// }

// export interface StockTakingFormData {
//   quantity: number;
//   buying_price: number;
//   selling_price: number;
//   reference_type: string;
//   notes: string;
// }

// export interface StockTakingTableRowProps {
//   product: ProductResponse & {
//     last_stock_take?: ProductResponseLastStockTake | null;
//   };
//   businessId: string;
//   onSaveSuccess: (payload: {
//     product_id: string;
//     business_id: string;
//     quantity: number;
//     buying_price: number;
//     selling_price: number;
//     reference_type: string;
//     notes: string;
//   }) => Promise<void>;
// }

// export const REFERENCE_GROUPS = [
//   {
//     group: "Inventory Audits",
//     options: [
//       { value: "INITIAL_STOCK_TAKE", label: "Initial Inventory Audit" },
//       { value: "ROUTINE_COUNT", label: "Routine Cycle Count" },
//     ],
//   },
//   {
//     group: "Inbound Stock",
//     options: [
//       { value: "PURCHASE_ORDER", label: "Supplier Purchase Order (PO)" },
//       { value: "GOODS_RECEIVED", label: "Goods Received Note (GRN)" },
//       { value: "CUSTOMER_RETURN", label: "Customer Return / Restock" },
//     ],
//   },
//   {
//     group: "Adjustments & Write-Offs",
//     options: [
//       { value: "COUNT_CORRECTION", label: "Manual Variance Correction" },
//       { value: "DAMAGE_EXPIRE", label: "Damaged / Expired Stock" },
//       { value: "INTERNAL_USE", label: "Internal Store Consumption" },
//     ],
//   },
// ] as const;

// // =========================================================
// // Helper: Monthly Audit Recency Calculator
// // =========================================================

// export type MonthlyAuditState = "current-month" | "previous-month" | "never";

// /**
//  * Determines whether a product was audited during the current calendar month,
//  * audited in a prior month, or never audited.
//  */
// export function getMonthlyAuditState(
//   lastStockTake?: ProductResponseLastStockTake | null
// ): MonthlyAuditState {
//   if (!lastStockTake || !lastStockTake.date) {
//     return "never";
//   }

//   const auditDate =
//     typeof lastStockTake.date === "string"
//       ? new Date(lastStockTake.date)
//       : lastStockTake.date;

//   if (isNaN(auditDate.getTime())) {
//     return "never";
//   }

//   const now = new Date();
//   const isSameMonthAndYear =
//     auditDate.getFullYear() === now.getFullYear() &&
//     auditDate.getMonth() === now.getMonth();

//   return isSameMonthAndYear ? "current-month" : "previous-month";
// }

// // =========================================================
// // Main Component
// // =========================================================

// /**
//  * Production-ready stock-taking row component featuring a 8px left-border
//  * monthly audit recency indicator and inline discrepancy form drawer.
//  */
// export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
//   product,
//   businessId,
//   onSaveSuccess,
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
//   const [errorMessage, setErrorMessage] = useState("");

//   const quantityId = useId();
//   const buyingPriceId = useId();
//   const sellingPriceId = useId();
//   const referenceTypeId = useId();
//   const notesId = useId();

//   const defaultBuyingPrice = (product.attributes as { buying_price?: number })?.buying_price ?? 0;
//   const defaultSellingPrice = product.selling_price ?? 0;
//   const currentLedgerStock = product.stock ?? 0;
//   const sku = (product.attributes as { sku?: string })?.sku || "NO_SKU";

//   // Calculate monthly audit recency state
//   const auditState = useMemo(
//     () => getMonthlyAuditState(product.last_stock_take),
//     [product.last_stock_take]
//   );

//   // Dynamic 8px left border alert class
//   const leftBorderClass = useMemo(() => {
//     switch (auditState) {
//       case "current-month":
//         return "border-l-8 border-l-emerald-500";
//       case "previous-month":
//         return "border-l-8 border-l-amber-500";
//       case "never":
//       default:
//         return "border-l-8 border-l-slate-600 dark:border-l-slate-400";
//     }
//   }, [auditState]);

//   // Audit status badge metadata
//   const auditBadge = useMemo(() => {
//     switch (auditState) {
//       case "current-month":
//         return {
//           label: "Audited This Month",
//           color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
//           icon: <CalendarCheck className="w-3 h-3 stroke-[2.5]" />,
//         };
//       case "previous-month":
//         return {
//           label: "Audit Due (>1 Mo)",
//           color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
//           icon: <Clock className="w-3 h-3 stroke-[2.5]" />,
//         };
//       case "never":
//       default:
//         return {
//           label: "Never Audited",
//           color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
//           icon: <CalendarX className="w-3 h-3 stroke-[2.5]" />,
//         };
//     }
//   }, [auditState]);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isDirty },
//     reset,
//   } = useForm<StockTakingFormData>({
//     defaultValues: {
//       quantity: currentLedgerStock,
//       buying_price: defaultBuyingPrice,
//       selling_price: defaultSellingPrice,
//       reference_type: "INITIAL_STOCK_TAKE",
//       notes: "",
//     },
//   });

//   const toggleExpand = useCallback(() => {
//     setIsExpanded((prev) => !prev);
//   }, []);

//   const onSubmit = async (data: StockTakingFormData) => {
//     try {
//       setStatus("saving");
//       setErrorMessage("");

//       const finalPayload = {
//         product_id: product.id,
//         business_id: businessId,
//         quantity: data.quantity,
//         buying_price: data.buying_price,
//         selling_price: data.selling_price,
//         reference_type: data.reference_type,
//         notes: data.notes.trim() || "New stock recorded.",
//       };

//       await onSaveSuccess(finalPayload);

//       setStatus("success");
//       reset({
//         quantity: data.quantity,
//         buying_price: data.buying_price,
//         selling_price: data.selling_price,
//         reference_type: data.reference_type,
//         notes: "",
//       });
//       setIsExpanded(false);
//     } catch (err: unknown) {
//       setStatus("error");
//       const msg = err instanceof Error ? err.message : "Failed to record new stock data.";
//       setErrorMessage(msg);
//     }
//   };

//   return (
//     <>
//       {/* Primary Table Row */}
//       <tr
//         onClick={toggleExpand}
//         onKeyDown={(e) => {
//           if (e.key === "Enter" || e.key === " ") {
//             e.preventDefault();
//             toggleExpand();
//           }
//         }}
//         tabIndex={0}
//         role="button"
//         aria-expanded={isExpanded}
//         aria-label={`Toggle new stock form for ${product.label}`}
//         className="border-b border-border bg-background hover:bg-card cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//       >
//         {/* Product Identity Column (Carries 8px Left Border Alert Indicator) */}
//         <td colSpan={2} className={cn("px-6 py-4", leftBorderClass)}>
//           <div className="flex items-center gap-3">
//             <div className="text-muted shrink-0" aria-hidden="true">
//               {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//             </div>
//             <div>
//               <div className="flex items-center gap-2 flex-wrap">
//                 <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
//                   {product.label}
//                 </h4>
//                 <span
//                   className={cn(
//                     "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
//                     auditBadge.color
//                   )}
//                   title={`Audit Status: ${auditBadge.label}`}
//                 >
//                   {auditBadge.icon}
//                   <span>{auditBadge.label}</span>
//                 </span>
//               </div>
//               <p className="text-[10px] text-muted font-mono font-semibold tracking-wider mt-0.5">
//                 SKU: {sku} &bull; {product.category || "General"}
//               </p>
//             </div>
//           </div>
//         </td>

//         <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
//           {currentLedgerStock}
//         </td>

//         <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
//           KES {defaultBuyingPrice.toLocaleString()}
//         </td>

//         <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground text-right">
//           KES {defaultSellingPrice.toLocaleString()}
//         </td>
//       </tr>

//       {/* Expanded Stock Entry Drawer (Carries Continuous 8px Left Border Alert Indicator) */}
//       {isExpanded && (
//         <tr className="bg-card border-b border-border">
//           <td colSpan={5} className={cn("p-6", leftBorderClass)}>
//             <div className="space-y-4">
//               <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 border-none p-0 m-0">
//                 <legend className="sr-only">New Stock Entry Form for {product.label}</legend>

//                 <div>
//                   <label
//                     htmlFor={quantityId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     Physical Count
//                   </label>
//                   <input
//                     id={quantityId}
//                     type="number"
//                     step="any"
//                     onFocus={(e) => e.target.select()}
//                     disabled={status === "saving"}
//                     aria-invalid={!!errors.quantity}
//                     {...register("quantity", {
//                       required: "Physical count is required",
//                       valueAsNumber: true,
//                       min: { value: 0, message: "Count cannot be negative" },
//                     })}
//                     placeholder="0.00"
//                     className="w-full text-xs font-mono font-bold px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
//                   />
//                   {errors.quantity && (
//                     <p className="text-[10px] text-brand-primary font-bold mt-1">
//                       {errors.quantity.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label
//                     htmlFor={buyingPriceId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     Cost Price (KES)
//                   </label>
//                   <div className="relative">
//                     <span
//                       className="absolute left-3 top-2 text-[10px] font-bold text-muted"
//                       aria-hidden="true"
//                     >
//                       KES
//                     </span>
//                     <input
//                       id={buyingPriceId}
//                       type="number"
//                       step="any"
//                       onFocus={(e) => e.target.select()}
//                       disabled={status === "saving"}
//                       aria-invalid={!!errors.buying_price}
//                       {...register("buying_price", {
//                         required: "Cost price is required",
//                         valueAsNumber: true,
//                         min: { value: 0, message: "Price cannot be negative" },
//                       })}
//                       className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
//                     />
//                   </div>
//                   {errors.buying_price && (
//                     <p className="text-[10px] text-brand-primary font-bold mt-1">
//                       {errors.buying_price.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label
//                     htmlFor={sellingPriceId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     Retail Price (KES)
//                   </label>
//                   <div className="relative">
//                     <span
//                       className="absolute left-3 top-2 text-[10px] font-bold text-muted"
//                       aria-hidden="true"
//                     >
//                       KES
//                     </span>
//                     <input
//                       id={sellingPriceId}
//                       type="number"
//                       step="any"
//                       onFocus={(e) => e.target.select()}
//                       disabled={status === "saving"}
//                       aria-invalid={!!errors.selling_price}
//                       {...register("selling_price", {
//                         required: "Selling price is required",
//                         valueAsNumber: true,
//                         min: { value: 0, message: "Price cannot be negative" },
//                       })}
//                       className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
//                     />
//                   </div>
//                   {errors.selling_price && (
//                     <p className="text-[10px] text-brand-primary font-bold mt-1">
//                       {errors.selling_price.message}
//                     </p>
//                   )}
//                 </div>

//                 <div>
//                   <label
//                     htmlFor={referenceTypeId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     Reference Type
//                   </label>
//                   <select
//                     id={referenceTypeId}
//                     disabled={status === "saving"}
//                     {...register("reference_type")}
//                     className="w-full text-xs font-medium px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs cursor-pointer"
//                   >
//                     {REFERENCE_GROUPS.map((group) => (
//                       <optgroup key={group.group} label={group.group}>
//                         {group.options.map((option) => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </optgroup>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="md:col-span-2">
//                   <label
//                     htmlFor={notesId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     New Stock Notes
//                   </label>
//                   <input
//                     id={notesId}
//                     type="text"
//                     disabled={status === "saving"}
//                     placeholder="e.g. Physical inventory count verified"
//                     {...register("notes")}
//                     className="w-full text-xs px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
//                   />
//                 </div>
//               </fieldset>

//               {status === "error" && errorMessage && (
//                 <div
//                   role="alert"
//                   className="p-3 bg-background border border-brand-primary text-brand-primary rounded-md text-xs font-bold flex items-center gap-2"
//                 >
//                   <AlertTriangle className="w-4 h-4 shrink-0" />
//                   <span>{errorMessage}</span>
//                 </div>
//               )}

//               <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
//                 <button
//                   type="button"
//                   onClick={() => setIsExpanded(false)}
//                   disabled={status === "saving"}
//                   className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border bg-background text-foreground rounded-md hover:bg-card focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50 cursor-pointer"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleSubmit(onSubmit)}
//                   disabled={!isDirty || status === "saving"}
//                   className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-primary text-background rounded-md hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50 min-w-[120px] cursor-pointer"
//                 >
//                   {status === "saving" ? (
//                     <>
//                       <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" aria-hidden="true" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
//                       New Stock
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </td>
//         </tr>
//       )}
//     </>
//   );
// };

"use client";

import React, { useState, useId, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  Clock,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// =========================================================
// Utility: Class Name Merging
// =========================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// =========================================================
// Zod Validation Schema
// =========================================================

export const stockTakingFormSchema = z.object({
  quantity: z
    .number({
      required_error: "Physical count is required",
      invalid_type_error: "Physical count must be a valid number",
    })
    .min(0, "Physical count cannot be negative"),
  buying_price: z
    .number({
      required_error: "Cost price is required",
      invalid_type_error: "Cost price must be a valid number",
    })
    .min(0, "Cost price cannot be negative"),
  selling_price: z
    .number({
      required_error: "Selling price is required",
      invalid_type_error: "Selling price must be a valid number",
    })
    .min(0, "Selling price cannot be negative"),
  reference_type: z.string().min(1, "Reference type is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().default(""),
});

export type StockTakingFormData = z.infer<typeof stockTakingFormSchema>;

// =========================================================
// Types & Domain Interfaces
// =========================================================

export interface ProductResponse {
  id: string;
  label: string;
  selling_price?: number;
  track_stock?: boolean;
  last_stock_take?: string | Date | null;
  stock?: number;
  popularity_score?: number;
  active?: boolean;
  category?: string;
  attributes?: {
    sku?: string;
    buying_price?: number;
    [key: string]: unknown;
  };
}

export type MonthlyAuditState = "current-month" | "previous-month" | "never";

export interface StockTakingSavePayload {
  product_id: string;
  business_id: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  reference_type: string;
  notes: string;
}

export interface StockTakingTableRowProps {
  /** Product data entity */
  product: ProductResponse;
  /** Active business account identifier */
  businessId: string;
  /** Async handler called when submitting new stock record */
  onSaveSuccess: (payload: StockTakingSavePayload) => Promise<void>;
  /** Optional custom class for the row */
  className?: string;
}

export const REFERENCE_GROUPS = [
  {
    group: "Inventory Audits",
    options: [
      { value: "INITIAL_STOCK_TAKE", label: "Initial Inventory Audit" },
      { value: "ROUTINE_COUNT", label: "Routine Cycle Count" },
    ],
  },
  {
    group: "Inbound Stock",
    options: [
      { value: "PURCHASE_ORDER", label: "Supplier Purchase Order (PO)" },
      { value: "GOODS_RECEIVED", label: "Goods Received Note (GRN)" },
      { value: "CUSTOMER_RETURN", label: "Customer Return / Restock" },
    ],
  },
  {
    group: "Adjustments & Write-Offs",
    options: [
      { value: "COUNT_CORRECTION", label: "Manual Variance Correction" },
      { value: "DAMAGE_EXPIRE", label: "Damaged / Expired Stock" },
      { value: "INTERNAL_USE", label: "Internal Store Consumption" },
    ],
  },
] as const;

// =========================================================
// Helper: Audit Recency Calculator
// =========================================================

/**
 * Converts `last_stock_take` (ISO string, Date object, or null/undefined)
 * into a JavaScript Date object and determines audit recency relative to the current month.
 */
export function getMonthlyAuditState(
  lastStockTake?: string | Date | null
): MonthlyAuditState {
  if (!lastStockTake) {
    return "never";
  }

  const auditDate = typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;

  if (!(auditDate instanceof Date) || isNaN(auditDate.getTime())) {
    return "never";
  }

  const now = new Date();
  const isSameMonthAndYear =
    auditDate.getFullYear() === now.getFullYear() &&
    auditDate.getMonth() === now.getMonth();

  return isSameMonthAndYear ? "current-month" : "previous-month";
}

// =========================================================
// Main Component
// =========================================================

/**
 * Production-ready stock-taking row component featuring an 8px thick left border
 * for stock audit recency status and an expandable form drawer.
 */
export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const quantityId = useId();
  const buyingPriceId = useId();
  const sellingPriceId = useId();
  const referenceTypeId = useId();
  const notesId = useId();

  const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
  const defaultSellingPrice = product.selling_price ?? 0;
  const currentLedgerStock = product.stock ?? 0;
  const sku = product.attributes?.sku || "NO_SKU";

  // Compute monthly audit state
  const auditState = useMemo(
    () => getMonthlyAuditState(product.last_stock_take),
    [product.last_stock_take]
  );

  // Dynamic 8px thick left border class
  const leftBorderClass = useMemo(() => {
    switch (auditState) {
      case "current-month":
        return "border-l-8 border-l-emerald-500";
      case "previous-month":
        return "border-l-8 border-l-amber-500";
      case "never":
      default:
        return "border-l-8 border-l-slate-600 dark:border-l-slate-400";
    }
  }, [auditState]);

  // Audit badge visual metadata
  const auditBadge = useMemo(() => {
    switch (auditState) {
      case "current-month":
        return {
          label: "Audited This Month",
          color: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          icon: <CalendarCheck className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case "previous-month":
        return {
          label: "Audit Due (>1 Mo)",
          color: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          icon: <Clock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case "never":
      default:
        return {
          label: "Never Audited",
          color: "text-slate-700 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
          icon: <CalendarX className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
    }
  }, [auditState]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<StockTakingFormData>({
    resolver: zodResolver(stockTakingFormSchema),
    defaultValues: {
      quantity: currentLedgerStock,
      buying_price: defaultBuyingPrice,
      selling_price: defaultSellingPrice,
      reference_type: "INITIAL_STOCK_TAKE",
      notes: "",
    },
  });

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const onSubmit = async (data: StockTakingFormData) => {
    try {
      setStatus("saving");
      setErrorMessage("");

      const payload: StockTakingSavePayload = {
        product_id: product.id,
        business_id: businessId,
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_type: data.reference_type,
        notes: data.notes?.trim() || "New stock recorded.",
      };

      await onSaveSuccess(payload);

      setStatus("success");
      reset({
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_type: data.reference_type,
        notes: "",
      });
      setIsExpanded(false);
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to record new stock data.";
      setErrorMessage(msg);
    }
  };

  return (
    <>
      {/* Primary Summary Row */}
      <tr
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpand();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Toggle new stock form for ${product.label}`}
        className={cn(
          "border-b border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className
        )}
      >
        {/* Product Details Column with 8px Left Border Accent */}
        <td colSpan={2} className={cn("px-6 py-4", leftBorderClass)}>
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground shrink-0" aria-hidden="true">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
                  {product.label}
                </h4>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
                    auditBadge.color
                  )}
                  title={`Audit Status: ${auditBadge.label}`}
                >
                  {auditBadge.icon}
                  <span>{auditBadge.label}</span>
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono font-semibold tracking-wider mt-0.5">
                SKU: {sku} &bull; {product.category || "General"}
              </p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
          {currentLedgerStock}
        </td>

        <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
          KES {defaultBuyingPrice.toLocaleString()}
        </td>

        <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground text-right">
          KES {defaultSellingPrice.toLocaleString()}
        </td>
      </tr>

      {/* Expanded Stock Input Drawer */}
      {isExpanded && (
        <tr className="bg-muted/30 border-b border-border">
          <td colSpan={5} className={cn("p-6", leftBorderClass)}>
            <div className="space-y-4">
              <fieldset
                disabled={status === "saving"}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 border-none p-0 m-0 disabled:opacity-75"
              >
                <legend className="sr-only">New Stock Entry Form for {product.label}</legend>

                {/* Physical Count */}
                <div>
                  <label
                    htmlFor={quantityId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Physical Count
                  </label>
                  <input
                    id={quantityId}
                    type="number"
                    step="any"
                    onFocus={(e) => e.target.select()}
                    aria-invalid={!!errors.quantity}
                    aria-describedby={errors.quantity ? `${quantityId}-error` : undefined}
                    {...register("quantity", { valueAsNumber: true })}
                    placeholder="0"
                    className={cn(
                      "w-full text-xs font-mono font-bold px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-xs",
                      errors.quantity && "border-destructive focus:ring-destructive"
                    )}
                  />
                  {errors.quantity && (
                    <p id={`${quantityId}-error`} className="text-[10px] text-destructive font-bold mt-1">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                {/* Cost Price */}
                <div>
                  <label
                    htmlFor={buyingPriceId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Cost Price (KES)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-2 text-[10px] font-bold text-muted-foreground select-none"
                      aria-hidden="true"
                    >
                      KES
                    </span>
                    <input
                      id={buyingPriceId}
                      type="number"
                      step="any"
                      onFocus={(e) => e.target.select()}
                      aria-invalid={!!errors.buying_price}
                      aria-describedby={errors.buying_price ? `${buyingPriceId}-error` : undefined}
                      {...register("buying_price", { valueAsNumber: true })}
                      className={cn(
                        "w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-xs",
                        errors.buying_price && "border-destructive focus:ring-destructive"
                      )}
                    />
                  </div>
                  {errors.buying_price && (
                    <p id={`${buyingPriceId}-error`} className="text-[10px] text-destructive font-bold mt-1">
                      {errors.buying_price.message}
                    </p>
                  )}
                </div>

                {/* Retail Price */}
                <div>
                  <label
                    htmlFor={sellingPriceId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Retail Price (KES)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-2 text-[10px] font-bold text-muted-foreground select-none"
                      aria-hidden="true"
                    >
                      KES
                    </span>
                    <input
                      id={sellingPriceId}
                      type="number"
                      step="any"
                      onFocus={(e) => e.target.select()}
                      aria-invalid={!!errors.selling_price}
                      aria-describedby={errors.selling_price ? `${sellingPriceId}-error` : undefined}
                      {...register("selling_price", { valueAsNumber: true })}
                      className={cn(
                        "w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-xs",
                        errors.selling_price && "border-destructive focus:ring-destructive"
                      )}
                    />
                  </div>
                  {errors.selling_price && (
                    <p id={`${sellingPriceId}-error`} className="text-[10px] text-destructive font-bold mt-1">
                      {errors.selling_price.message}
                    </p>
                  )}
                </div>

                {/* Reference Type */}
                <div>
                  <label
                    htmlFor={referenceTypeId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Reference Type
                  </label>
                  <select
                    id={referenceTypeId}
                    aria-invalid={!!errors.reference_type}
                    {...register("reference_type")}
                    className="w-full text-xs font-medium px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-xs cursor-pointer"
                  >
                    {REFERENCE_GROUPS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label
                    htmlFor={notesId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    New Stock Notes
                  </label>
                  <input
                    id={notesId}
                    type="text"
                    placeholder="e.g. Verified physical inventory count"
                    aria-invalid={!!errors.notes}
                    {...register("notes")}
                    className="w-full text-xs px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-xs"
                  />
                  {errors.notes && (
                    <p className="text-[10px] text-destructive font-bold mt-1">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Submission Error Banner */}
              {status === "error" && errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-xs font-bold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  disabled={status === "saving"}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-input bg-background text-foreground rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isDirty || status === "saving"}
                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-opacity disabled:opacity-50 min-w-[120px] cursor-pointer"
                >
                  {status === "saving" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      New Stock
                    </>
                  )}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};