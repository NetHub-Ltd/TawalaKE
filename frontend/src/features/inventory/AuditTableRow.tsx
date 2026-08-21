// "use client";

// import React, { useState, useId, useCallback, useMemo } from "react";
// import { useForm, UseFormRegister, FieldErrors, SubmitHandler } from "react-hook-form";
// import {
//   Check,
//   AlertTriangle,
//   Loader2,
//   Save,
//   CalendarCheck,
//   CalendarX,
//   Clock,
//   ShieldOff,
// } from "lucide-react";
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";

// // Import generated API entity directly to prevent type structural mismatches (TS2322)
// import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

// // =========================================================
// // Class Name Merging Utility
// // =========================================================

// export function cn(...inputs: ClassValue[]): string {
//   return twMerge(clsx(inputs));
// }

// // =========================================================
// // Domain Data Contracts & Types
// // =========================================================

// /** RHF Internal Form Values */
// export interface AuditFormData {
//   quantity: number;
//   reason_code: string;
//   notes: string;
// }

// /** Payload submitted upon stock take persistence */
// export interface AuditSavePayload {
//   product_id: string;
//   business_id: string;
//   quantity: number;
//   reason_code: string;
//   notes: string;
// }

// export interface AuditReasonCode {
//   value: string;
//   label: string;
// }

// export const AUDIT_REASON_CODES: ReadonlyArray<AuditReasonCode> = [
//   { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
//   { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
//   { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
//   { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
// ] as const;

// // =========================================================
// // Status Telemetry Helpers
// // =========================================================

// export type AuditAlertState = "untracked" | "green" | "amber" | "red";

// export function getAuditAlertState(
//   trackStock: boolean,
//   lastStockTake?: string | Date | null
// ): AuditAlertState {
//   if (!trackStock) return "untracked";
//   if (!lastStockTake) return "red";

//   const auditDate =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;

//   if (isNaN(auditDate.getTime())) return "red";

//   const now = new Date();
//   const isSameMonthAndYear =
//     auditDate.getFullYear() === now.getFullYear() &&
//     auditDate.getMonth() === now.getMonth();

//   return isSameMonthAndYear ? "green" : "amber";
// }

// export function formatAuditDate(lastStockTake?: string | Date | null): string {
//   if (!lastStockTake) return "N/A";
//   const dateObj =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
//   if (isNaN(dateObj.getTime())) return "N/A";

//   return new Intl.DateTimeFormat("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   }).format(dateObj);
// }

// // =========================================================
// // Public Component API Interface
// // =========================================================

// export interface AuditTableRowProps {
//   /** Generated backend Product entity */
//   product: ProductResponse;
//   /** Unique tenant business identifier */
//   businessId: string;
//   /** Callback fired upon audit resolution */
//   onSaveSuccess: (payload: AuditSavePayload) => Promise<void>;
//   /** Optional container class overrides */
//   className?: string;
// }

// // =========================================================
// // Core Component: AuditTableRow
// // =========================================================

// export const AuditTableRow: React.FC<AuditTableRowProps> = ({
//   product,
//   businessId,
//   onSaveSuccess,
//   className,
// }) => {
//   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
//   const [errorMessage, setErrorMessage] = useState<string>("");

//   const quantityInputId = useId();
//   const reasonSelectId = useId();
//   const notesInputId = useId();
//   const errorAlertId = useId();

//   const bookStock = product.stock ?? 0;
//   const trackStock = Boolean(product.track_stock);

//   const alertState = useMemo(
//     () => getAuditAlertState(trackStock, product.last_stock_take),
//     [trackStock, product.last_stock_take]
//   );

//   const leftBorderClass = useMemo(() => {
//     switch (alertState) {
//       case "green":
//         return "border-l-6 border-l-green-500";
//       case "amber":
//         return "border-l-6 border-l-amber-500";
//       case "red":
//         return "border-l-6 border-l-red-500";
//       case "untracked":
//       default:
//         return "border-l-6 border-l-slate-400 dark:border-l-slate-600";
//     }
//   }, [alertState]);

//   // Pure React Hook Form initialization without zodResolver
//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors, isDirty },
//     reset,
//   } = useForm<AuditFormData>({
//     defaultValues: {
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//     },
//   });

//   const watchedQuantity = watch("quantity");
//   const currentQty = typeof watchedQuantity === "number" && !isNaN(watchedQuantity) ? watchedQuantity : bookStock;
//   const variance = currentQty - bookStock;
//   const isVariancePresent = trackStock && variance !== 0;

//   const onSubmit: SubmitHandler<AuditFormData> = useCallback(
//     async (data) => {
//       try {
//         setStatus("saving");
//         setErrorMessage("");

//         const finalPayload: AuditSavePayload = {
//           product_id: product.id,
//           business_id: businessId,
//           quantity: data.quantity,
//           reason_code: isVariancePresent ? data.reason_code : "SYSTEM_MATCH",
//           notes: isVariancePresent
//             ? data.notes
//             : "Physical count matched ledger stock balance.",
//         };

//         await onSaveSuccess(finalPayload);

//         setStatus("success");
//         reset({ quantity: data.quantity, reason_code: "", notes: "" });
//       } catch (err: unknown) {
//         setStatus("error");
//         const message =
//           err instanceof Error
//             ? err.message
//             : "Failed to persist inventory count adjustment.";
//         setErrorMessage(message);
//       }
//     },
//     [businessId, isVariancePresent, onSaveSuccess, product.id, reset]
//   );

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleSubmit(onSubmit)();
//     }
//   };

//   const getRowStyles = () => {
//     if (status === "success" && !isVariancePresent)
//       return "bg-green-500/5 border-green-500/20";
//     if (isVariancePresent) return "bg-amber-500/5 border-amber-500/20";
//     return "border-border/40 hover:bg-surface/40";
//   };

//   return (
//     <>
//       <tr className={cn("border-b transition-colors duration-200", getRowStyles(), className)}>
//         {/* Product Details Block */}
//         <td className={cn("px-6 py-4 align-middle", leftBorderClass)}>
//           <ProductIdentity product={product} alertState={alertState} />
//         </td>

//         {/* System Ledger Stock Display */}
//         <td className="px-4 py-4 align-middle">
//           <div className="flex flex-col justify-center">
//             <span className="font-mono font-medium text-xs text-muted bg-surface/80 border border-border/60 px-3 py-2 rounded-lg text-center w-full min-h-[44px] flex items-center justify-center">
//               {bookStock.toFixed(2)}
//             </span>
//           </div>
//         </td>

//         {/* Physical Stock Count Input with RHF Internal Rules */}
//         <td className="px-4 py-4 align-middle">
//           <div className="flex flex-col justify-center">
//             <input
//               id={quantityInputId}
//               type="number"
//               step="any"
//               onFocus={(e) => e.target.select()}
//               onKeyDown={handleKeyDown}
//               disabled={status === "saving" || !trackStock}
//               aria-invalid={!!errors.quantity}
//               aria-describedby={errors.quantity ? `${quantityInputId}-error` : undefined}
//               aria-label={`Physical count for ${product.label ?? "Product"}`}
//               {...register("quantity", {
//                 required: "Physical quantity is required",
//                 valueAsNumber: true,
//                 validate: (val) =>
//                   (!isNaN(val) && val >= 0) || "Stock quantity cannot fall below zero",
//               })}
//               className={cn(
//                 "w-full font-mono text-xs font-semibold px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-surface disabled:text-muted transition-all shadow-sm",
//                 !trackStock && "cursor-not-allowed opacity-60"
//               )}
//             />
//             {errors.quantity && (
//               <p id={`${quantityInputId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
//                 {errors.quantity.message}
//               </p>
//             )}
//           </div>
//         </td>

//         {/* Variance Telemetry Badges */}
//         <td className="px-4 py-4 align-middle">
//           <VarianceBadge variance={variance} trackStock={trackStock} />
//         </td>

//         {/* Actions Segment */}
//         <td className="px-6 py-4 align-middle text-right">
//           <div className="flex items-center justify-end">
//             {status === "saving" ? (
//               <div className="min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Saving count">
//                 <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
//               </div>
//             ) : (
//               <button
//                 type="button"
//                 onClick={handleSubmit(onSubmit)}
//                 disabled={(!isDirty && status !== "error") || !trackStock}
//                 aria-label={`Save stock count for ${product.label ?? "Product"}`}
//                 className={cn(
//                   "min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all",
//                   isDirty && trackStock
//                     ? "bg-foreground text-card border-transparent hover:opacity-90 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//                     : "bg-surface/50 text-muted border-border/40 cursor-not-allowed"
//                 )}
//               >
//                 <Save className="w-4 h-4" /> Save
//               </button>
//             )}
//           </div>
//         </td>
//       </tr>

//       {/* Accountability Drawer Row */}
//       {isVariancePresent && (
//         <tr className="bg-surface/30 border-b border-border/40">
//           <td colSpan={5} className={cn("px-6 py-4", leftBorderClass)}>
//             <AccountabilityFields
//               register={register}
//               errors={errors}
//               reasonSelectId={reasonSelectId}
//               notesInputId={notesInputId}
//               onKeyDown={handleKeyDown}
//               isSaving={status === "saving"}
//               isVariancePresent={isVariancePresent}
//               trackStock={trackStock}
//             />
//           </td>
//         </tr>
//       )}

//       {/* Error Alert Banner */}
//       {status === "error" && errorMessage && (
//         <tr id={errorAlertId} role="alert" aria-live="polite" className="bg-red-500/10 border-b border-red-500/20">
//           <td colSpan={5} className={cn("px-6 py-2.5", leftBorderClass)}>
//             <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-2">
//               <AlertTriangle className="w-4 h-4 shrink-0" />
//               <span>{errorMessage}</span>
//             </p>
//           </td>
//         </tr>
//       )}
//     </>
//   );
// };

// // =========================================================
// // Sub-Component: Product Identity
// // =========================================================

// interface ProductIdentityProps {
//   product: ProductResponse;
//   alertState: AuditAlertState;
// }

// const ProductIdentity: React.FC<ProductIdentityProps> = ({ product, alertState }) => {
//   const name = product.label ?? "Unnamed Product";
//   const category = product.category ?? "General";
//   const uom = product.attributes?.unit_of_measure ?? "Units";
//   const formattedDate = formatAuditDate(product.last_stock_take);

//   const alertBadge = useMemo(() => {
//     switch (alertState) {
//       case "green":
//         return {
//           label: "Audited This Month",
//           color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
//           icon: <CalendarCheck className="w-3 h-3 stroke-[2.5]" />,
//         };
//       case "amber":
//         return {
//           label: "Audit Due (>1 Mo)",
//           color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
//           icon: <Clock className="w-3 h-3 stroke-[2.5]" />,
//         };
//       case "red":
//         return {
//           label: "Never Audited / Overdue",
//           color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
//           icon: <CalendarX className="w-3 h-3 stroke-[2.5]" />,
//         };
//       case "untracked":
//       default:
//         return {
//           label: "Stock Untracked",
//           color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
//           icon: <ShieldOff className="w-3 h-3 stroke-[2.5]" />,
//         };
//     }
//   }, [alertState]);

//   return (
//     <div className="flex flex-col gap-1">
//       <div className="flex items-center gap-2 flex-wrap">
//         <h4 className="font-semibold text-xs text-foreground tracking-tight line-clamp-1">
//           {name}
//         </h4>
//         <span
//           className={cn(
//             "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
//             alertBadge.color
//           )}
//           title={`Status: ${alertBadge.label}`}
//         >
//           {alertBadge.icon}
//           <span>{alertBadge.label}</span>
//         </span>
//       </div>

//       <p className="text-[10px] text-muted font-medium uppercase tracking-wider flex flex-wrap items-center gap-1.5">
//         <span>{category}</span>
//         <span className="text-border" aria-hidden="true">
//           &bull;
//         </span>
//         <span>{uom}</span>
//         <span className="text-border" aria-hidden="true">
//           &bull;
//         </span>
//         <span className="font-mono">Last Audited: {formattedDate}</span>
//       </p>
//     </div>
//   );
// };

// // =========================================================
// // Sub-Component: Variance Badge
// // =========================================================

// interface VarianceBadgeProps {
//   variance: number;
//   trackStock: boolean;
// }

// const VarianceBadge: React.FC<VarianceBadgeProps> = ({ variance, trackStock }) => {
//   if (!trackStock) {
//     return (
//       <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
//         <ShieldOff className="w-3.5 h-3.5" /> N/A (Untracked)
//       </span>
//     );
//   }

//   if (variance === 0) {
//     return (
//       <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
//         <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Match
//       </span>
//     );
//   }

//   const isSurplus = variance > 0;
//   const trackingStyles = isSurplus
//     ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
//     : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";

//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider",
//         trackingStyles
//       )}
//     >
//       <AlertTriangle className="w-3.5 h-3.5" />
//       {isSurplus ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
//     </span>
//   );
// };

// // =========================================================
// // Sub-Component: Accountability Fields (Pure RHF Rules)
// // =========================================================

// interface AccountabilityFieldsProps {
//   register: UseFormRegister<AuditFormData>;
//   errors: FieldErrors<AuditFormData>;
//   reasonSelectId: string;
//   notesInputId: string;
//   onKeyDown: (e: React.KeyboardEvent) => void;
//   isSaving: boolean;
//   isVariancePresent: boolean;
//   trackStock: boolean;
// }

// const AccountabilityFields: React.FC<AccountabilityFieldsProps> = ({
//   register,
//   errors,
//   reasonSelectId,
//   notesInputId,
//   onKeyDown,
//   isSaving,
//   isVariancePresent,
//   trackStock,
// }) => {
//   return (
//     <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
//       <div className="flex-1 md:max-w-xs">
//         <label
//           htmlFor={reasonSelectId}
//           className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider"
//         >
//           Reason Code *
//         </label>
//         <select
//           id={reasonSelectId}
//           disabled={isSaving}
//           aria-invalid={!!errors.reason_code}
//           aria-describedby={errors.reason_code ? `${reasonSelectId}-error` : undefined}
//           {...register("reason_code", {
//             validate: (value) => {
//               if (trackStock && isVariancePresent && (!value || value.trim() === "")) {
//                 return "Please select an audit justification code.";
//               }
//               return true;
//             },
//           })}
//           className="w-full text-xs font-medium px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer disabled:opacity-50"
//         >
//           <option value="">-- Choose Audit Classification --</option>
//           {AUDIT_REASON_CODES.map((code) => (
//             <option key={code.value} value={code.value}>
//               {code.label}
//             </option>
//           ))}
//         </select>
//         {errors.reason_code && (
//           <p id={`${reasonSelectId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
//             {errors.reason_code.message}
//           </p>
//         )}
//       </div>

//       <div className="flex-1">
//         <label
//           htmlFor={notesInputId}
//           className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider"
//         >
//           Accountability Notes *
//         </label>
//         <input
//           id={notesInputId}
//           type="text"
//           disabled={isSaving}
//           onKeyDown={onKeyDown}
//           placeholder="Provide operational context explaining this variance discrepancy..."
//           aria-invalid={!!errors.notes}
//           aria-describedby={errors.notes ? `${notesInputId}-error` : undefined}
//           {...register("notes", {
//             validate: (value) => {
//               if (trackStock && isVariancePresent && (!value || value.trim().length < 5)) {
//                 return "Descriptive notes must contain at least 5 characters.";
//               }
//               return true;
//             },
//           })}
//           className="w-full text-xs px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium shadow-sm placeholder:text-muted/60 disabled:opacity-50"
//         />
//         {errors.notes && (
//           <p id={`${notesInputId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
//             {errors.notes.message}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// "use client";

// import React, { useState, useId, useCallback, useEffect } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import {
//   Check,
//   AlertTriangle,
//   Loader2,
//   Save,
//   CalendarCheck,
//   CalendarX,
//   Clock,
//   ShieldOff,
//   ChevronDown,
//   X,
// } from "lucide-react";
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

// /* -------------------------------------------------------------------------- */
// /* Utils                                                                      */
// /* -------------------------------------------------------------------------- */

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// /* -------------------------------------------------------------------------- */
// /* Domain                                                                     */
// /* -------------------------------------------------------------------------- */

// export interface AuditSavePayload {
//   product_id: string;
//   business_id: string;
//   quantity: number;
//   reason_code: string;
//   notes: string;
// }

// export interface AuditReasonCode {
//   value: string;
//   label: string;
// }

// export const AUDIT_REASON_CODES: ReadonlyArray<AuditReasonCode> = [
//   { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
//   { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
//   { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
//   { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
//   { value: "SCHEDULED_AUDIT", label: "Scheduled audit (count confirmed)" },
// ] as const;

// const SCHEDULED_REASON = "SCHEDULED_AUDIT";
// const SCHEDULED_NOTES = "Scheduled stock take — physical count matches ledger.";

// /** Zod schema — variance requires reason + notes; mark-as-resolved injects those */
// const auditFormSchema = z
//   .object({
//     quantity: z.coerce
//       .number({ message: "Enter a valid quantity" })
//       .min(0, "Quantity cannot be negative"),
//     reason_code: z.string(),
//     notes: z.string(),
//     mark_resolved: z.boolean(),
//   })
//   .superRefine((data, ctx) => {
//     const book = (ctx as unknown as { bookStock?: number }).bookStock;
//     // bookStock passed via refine context alternative: compare in component
//     // We refine with external book in the component-level schema factory instead.
//   });

// function createAuditSchema(bookStock: number) {
//   return z
//     .object({
//       quantity: z.coerce
//         .number({ message: "Enter a valid quantity" })
//         .min(0, "Quantity cannot be negative"),
//       reason_code: z.string(),
//       notes: z.string(),
//       mark_resolved: z.boolean(),
//     })
//     .superRefine((data, ctx) => {
//       const variance = data.quantity - bookStock;
//       const needsExplanation = variance !== 0 && !data.mark_resolved;

//       if (data.mark_resolved) {
//         // Scheduled confirm — quantity should stay at book (we enforce on submit)
//         return;
//       }

//       if (needsExplanation) {
//         if (!data.reason_code?.trim()) {
//           ctx.addIssue({
//             code: "custom",
//             message: "Select a reason for this variance",
//             path: ["reason_code"],
//           });
//         }
//         if (!data.notes || data.notes.trim().length < 5) {
//           ctx.addIssue({
//             code: "custom",
//             message: "Add a short note (at least 5 characters)",
//             path: ["notes"],
//           });
//         }
//       }
//     });
// }

// type AuditFormValues = z.infer<ReturnType<typeof createAuditSchema>>;

// export type AuditAlertState = "untracked" | "green" | "amber" | "red";

// export function getAuditAlertState(
//   trackStock: boolean,
//   lastStockTake?: string | Date | null,
// ): AuditAlertState {
//   if (!trackStock) return "untracked";
//   if (!lastStockTake) return "red";
//   const auditDate =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
//   if (Number.isNaN(auditDate.getTime())) return "red";
//   const now = new Date();
//   const sameMonth =
//     auditDate.getFullYear() === now.getFullYear() &&
//     auditDate.getMonth() === now.getMonth();
//   return sameMonth ? "green" : "amber";
// }

// export function formatAuditDate(lastStockTake?: string | Date | null): string {
//   if (!lastStockTake) return "Never";
//   const dateObj =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
//   if (Number.isNaN(dateObj.getTime())) return "Never";
//   return new Intl.DateTimeFormat(undefined, {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   }).format(dateObj);
// }

// /* -------------------------------------------------------------------------- */
// /* Props                                                                      */
// /* -------------------------------------------------------------------------- */

// export interface AuditTableRowProps {
//   product: ProductResponse;
//   businessId: string;
//   onSaveSuccess: (payload: AuditSavePayload) => Promise<void>;
//   className?: string;
// }

// /* -------------------------------------------------------------------------- */
// /* Component                                                                  */
// /* -------------------------------------------------------------------------- */

// export function AuditTableRow({
//   product,
//   businessId,
//   onSaveSuccess,
//   className,
// }: AuditTableRowProps) {
//   const [expanded, setExpanded] = useState(false);
//   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
//     "idle",
//   );

//   const bookStock = Number(product.stock) || 0;
//   const trackStock = Boolean(product.track_stock);
//   const alertState = getAuditAlertState(trackStock, product.last_stock_take);
//   const schema = createAuditSchema(bookStock);

//   const form = useForm<AuditFormValues>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     },
//     mode: "onChange",
//   });

//   const {
//     register,
//     handleSubmit,
//     watch,
//     reset,
//     setValue,
//     formState: { errors, isDirty },
//   } = form;

//   const quantity = watch("quantity");
//   const markResolved = watch("mark_resolved");
//   const currentQty = typeof quantity === "number" && !Number.isNaN(quantity) ? quantity : bookStock;
//   const variance = currentQty - bookStock;
//   const hasVariance = trackStock && variance !== 0;

//   // Keep form in sync when product stock updates from parent
//   useEffect(() => {
//     if (status === "saving") return;
//     reset({
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     });
//     setStatus("idle");
//   }, [bookStock, product.id, product.last_stock_take]); // eslint-disable-line react-hooks/exhaustive-deps

//   // Mark as resolved → lock quantity to book + inject reason/notes
//   useEffect(() => {
//     if (!markResolved) return;
//     setValue("quantity", bookStock, { shouldDirty: true, shouldValidate: true });
//     setValue("reason_code", SCHEDULED_REASON, {
//       shouldDirty: true,
//       shouldValidate: true,
//     });
//     setValue("notes", SCHEDULED_NOTES, {
//       shouldDirty: true,
//       shouldValidate: true,
//     });
//   }, [markResolved, bookStock, setValue]);

//   const canSave =
//     trackStock &&
//     status !== "saving" &&
//     (isDirty || markResolved) &&
//     (markResolved || isDirty);

//   const borderClass =
//     alertState === "green"
//       ? "border-l-4 border-l-emerald-500"
//       : alertState === "amber"
//         ? "border-l-4 border-l-amber-500"
//         : alertState === "red"
//           ? "border-l-4 border-l-red-500"
//           : "border-l-4 border-l-slate-400";

//   const collapse = useCallback(() => {
//     setExpanded(false);
//     reset({
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     });
//     setStatus("idle");
//   }, [bookStock, reset]);

//   const onSubmit = handleSubmit(async (data) => {
//     if (!trackStock) {
//       toast.error("This product does not track stock");
//       return;
//     }

//     const qty = data.mark_resolved ? bookStock : data.quantity;
//     const varianceNow = qty - bookStock;

//     let reason = data.reason_code;
//     let notes = data.notes;

//     if (data.mark_resolved || varianceNow === 0) {
//       reason = data.mark_resolved ? SCHEDULED_REASON : "SYSTEM_MATCH";
//       notes = data.mark_resolved
//         ? SCHEDULED_NOTES
//         : "Physical count matched ledger stock balance.";
//     }

//     const payload: AuditSavePayload = {
//       product_id: product.id,
//       business_id: businessId,
//       quantity: qty,
//       reason_code: reason,
//       notes: notes.trim(),
//     };

//     try {
//       setStatus("saving");
//       await onSaveSuccess(payload);
//       setStatus("success");
//       toast.success("Stock count saved", {
//         description: `${product.label ?? "Product"} · ${qty.toFixed(2)} units`,
//       });
//       reset({
//         quantity: qty,
//         reason_code: "",
//         notes: "",
//         mark_resolved: false,
//       });
//       // Brief success, then collapse
//       setTimeout(() => {
//         setExpanded(false);
//         setStatus("idle");
//       }, 900);
//     } catch (err) {
//       setStatus("error");
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not save stock count. Try again.";
//       toast.error("Save failed", { description: message });
//     }
//   });

//   const name = product.label ?? "Unnamed product";
//   const category = product.category ?? "General";
//   const uom = product.attributes?.unit_of_measure ?? "Units";

//   return (
//     <>
//       {/* Summary row — click to expand */}
//       <tr
//         onClick={() => {
//           if (!trackStock) {
//             toast.message("Stock not tracked", {
//               description: "Enable stock tracking on this product to audit it.",
//             });
//             return;
//           }
//           setExpanded((v) => !v);
//         }}
//         className={cn(
//           "border-b border-border/40 transition-colors cursor-pointer",
//           expanded ? "bg-brand-primary/[0.04]" : "hover:bg-surface/50",
//           status === "success" && "bg-emerald-500/10",
//           className,
//         )}
//       >
//         <td className={cn("px-5 py-3.5 align-middle", borderClass)}>
//           <div className="flex items-start gap-3 min-w-0">
//             <ChevronDown
//               size={16}
//               className={cn(
//                 "mt-0.5 shrink-0 text-muted transition-transform",
//                 expanded && "rotate-180 text-brand-primary",
//               )}
//             />
//             <div className="min-w-0 space-y-1">
//               <div className="flex flex-wrap items-center gap-2">
//                 <span className="text-sm font-semibold text-foreground truncate">
//                   {name}
//                 </span>
//                 <AuditBadge state={alertState} />
//               </div>
//               <p className="text-[11px] text-muted flex flex-wrap gap-x-1.5">
//                 <span>{category}</span>
//                 <span aria-hidden>·</span>
//                 <span>{uom}</span>
//                 <span aria-hidden>·</span>
//                 <span className="font-mono">Last: {formatAuditDate(product.last_stock_take)}</span>
//               </p>
//             </div>
//           </div>
//         </td>

//         <td className="px-4 py-3.5 text-right font-mono text-xs text-muted tabular-nums">
//           {bookStock.toFixed(2)}
//         </td>

//         <td className="px-4 py-3.5 text-right font-mono text-xs text-foreground tabular-nums">
//           {expanded ? currentQty.toFixed(2) : bookStock.toFixed(2)}
//         </td>

//         <td className="px-4 py-3.5">
//           <VariancePill variance={trackStock ? (expanded ? variance : 0) : 0} trackStock={trackStock} />
//         </td>

//         <td className="px-5 py-3.5 text-right text-xs text-muted">
//           {expanded ? "Editing…" : trackStock ? "Tap to audit" : "—"}
//         </td>
//       </tr>

//       {/* Expanded editor */}
//       {expanded && trackStock && (
//         <tr className="border-b border-border/40 bg-surface/30">
//           <td colSpan={5} className={cn("px-5 py-4", borderClass)}>
//             <form
//               onSubmit={onSubmit}
//               onClick={(e) => e.stopPropagation()}
//               className="space-y-4 max-w-3xl"
//             >
//               {/* Count */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 <div className="space-y-1.5">
//                   <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
//                     Book stock
//                   </label>
//                   <div className="h-11 flex items-center px-3 rounded-xl border border-border/60 bg-card font-mono text-sm tabular-nums text-muted">
//                     {bookStock.toFixed(2)}
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <label
//                     htmlFor={`qty-${product.id}`}
//                     className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                   >
//                     Physical count
//                   </label>
//                   <input
//                     id={`qty-${product.id}`}
//                     type="number"
//                     step="any"
//                     disabled={status === "saving" || markResolved}
//                     onFocus={(e) => e.target.select()}
//                     {...register("quantity")}
//                     className={cn(
//                       "w-full h-11 px-3 rounded-xl border bg-card font-mono text-sm font-semibold tabular-nums",
//                       "focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
//                       "disabled:opacity-60 disabled:cursor-not-allowed",
//                       errors.quantity ? "border-red-500" : "border-border/60",
//                     )}
//                   />
//                   {errors.quantity && (
//                     <p className="text-xs text-red-500 font-medium" role="alert">
//                       {errors.quantity.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-1.5">
//                   <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
//                     Variance
//                   </label>
//                   <div className="h-11 flex items-center px-3 rounded-xl border border-border/60 bg-card">
//                     <VariancePill variance={variance} trackStock />
//                   </div>
//                 </div>
//               </div>

//               {/* Scheduled audit shortcut */}
//               <label className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card cursor-pointer select-none">
//                 <input
//                   type="checkbox"
//                   className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary/30"
//                   disabled={status === "saving"}
//                   {...register("mark_resolved")}
//                 />
//                 <span className="text-sm leading-snug">
//                   <span className="font-semibold text-foreground">
//                     Mark as audited (no count change)
//                   </span>
//                   <span className="block text-xs text-muted mt-0.5">
//                     Use for scheduled checks when the shelf matches the books.
//                     We’ll submit the current book quantity with a scheduled-audit reason.
//                   </span>
//                 </span>
//               </label>

//               {/* Variance explanation — only when needed and not mark-resolved */}
//               {hasVariance && !markResolved && (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
//                   <div className="space-y-1.5">
//                     <label
//                       htmlFor={`reason-${product.id}`}
//                       className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                     >
//                       Reason *
//                     </label>
//                     <select
//                       id={`reason-${product.id}`}
//                       disabled={status === "saving"}
//                       {...register("reason_code")}
//                       className={cn(
//                         "w-full h-11 px-3 rounded-xl border bg-card text-sm",
//                         "focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
//                         errors.reason_code ? "border-red-500" : "border-border/60",
//                       )}
//                     >
//                       <option value="">Select reason…</option>
//                       {AUDIT_REASON_CODES.filter((c) => c.value !== SCHEDULED_REASON).map(
//                         (c) => (
//                           <option key={c.value} value={c.value}>
//                             {c.label}
//                           </option>
//                         ),
//                       )}
//                     </select>
//                     {errors.reason_code && (
//                       <p className="text-xs text-red-500 font-medium" role="alert">
//                         {errors.reason_code.message}
//                       </p>
//                     )}
//                   </div>

//                   <div className="space-y-1.5">
//                     <label
//                       htmlFor={`notes-${product.id}`}
//                       className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                     >
//                       Notes *
//                     </label>
//                     <input
//                       id={`notes-${product.id}`}
//                       type="text"
//                       disabled={status === "saving"}
//                       placeholder="Brief context for this variance"
//                       {...register("notes")}
//                       className={cn(
//                         "w-full h-11 px-3 rounded-xl border bg-card text-sm",
//                         "focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
//                         errors.notes ? "border-red-500" : "border-border/60",
//                       )}
//                     />
//                     {errors.notes && (
//                       <p className="text-xs text-red-500 font-medium" role="alert">
//                         {errors.notes.message}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Actions */}
//               <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
//                 <button
//                   type="button"
//                   onClick={collapse}
//                   disabled={status === "saving"}
//                   className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:bg-card transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
//                 >
//                   <X size={16} />
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={!canSave}
//                   className={cn(
//                     "h-10 px-5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all",
//                     canSave
//                       ? "bg-brand-primary text-white hover:opacity-90 shadow-sm"
//                       : "bg-surface text-muted border border-border cursor-not-allowed",
//                   )}
//                 >
//                   {status === "saving" ? (
//                     <>
//                       <Loader2 size={16} className="animate-spin" />
//                       Saving…
//                     </>
//                   ) : status === "success" ? (
//                     <>
//                       <Check size={16} />
//                       Saved
//                     </>
//                   ) : (
//                     <>
//                       <Save size={16} />
//                       Save count
//                     </>
//                   )}
//                 </button>
//               </div>

//               {!canSave && status === "idle" && (
//                 <p className="text-[11px] text-muted text-right">
//                   Change the count or tick “Mark as audited” to enable Save.
//                 </p>
//               )}
//             </form>
//           </td>
//         </tr>
//       )}
//     </>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /* Small UI pieces                                                            */
// /* -------------------------------------------------------------------------- */

// function AuditBadge({ state }: { state: AuditAlertState }) {
//   const map = {
//     green: {
//       label: "Audited",
//       className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
//       icon: CalendarCheck,
//     },
//     amber: {
//       label: "Due",
//       className: "text-amber-600 bg-amber-500/10 border-amber-500/20",
//       icon: Clock,
//     },
//     red: {
//       label: "Overdue",
//       className: "text-red-600 bg-red-500/10 border-red-500/20",
//       icon: CalendarX,
//     },
//     untracked: {
//       label: "Untracked",
//       className: "text-slate-500 bg-slate-500/10 border-slate-500/20",
//       icon: ShieldOff,
//     },
//   } as const;

//   const cfg = map[state];
//   const Icon = cfg.icon;

//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
//         cfg.className,
//       )}
//     >
//       <Icon className="w-3 h-3" />
//       {cfg.label}
//     </span>
//   );
// }

// function VariancePill({
//   variance,
//   trackStock,
// }: {
//   variance: number;
//   trackStock: boolean;
// }) {
//   if (!trackStock) {
//     return (
//       <span className="text-[10px] font-bold text-slate-500 uppercase">N/A</span>
//     );
//   }
//   if (variance === 0) {
//     return (
//       <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
//         <Check className="w-3 h-3" /> Match
//       </span>
//     );
//   }
//   const surplus = variance > 0;
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
//         surplus
//           ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
//           : "text-red-600 bg-red-500/10 border-red-500/20",
//       )}
//     >
//       <AlertTriangle className="w-3 h-3" />
//       {surplus ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
//     </span>
//   );
// }

// "use client";

// import React, { useState, useCallback, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import {
//   Check,
//   AlertTriangle,
//   Loader2,
//   Save,
//   CalendarCheck,
//   CalendarX,
//   Clock,
//   ShieldOff,
//   ChevronDown,
//   X,
// } from "lucide-react";
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

// /* -------------------------------------------------------------------------- */
// /* Utils                                                                      */
// /* -------------------------------------------------------------------------- */

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// /* -------------------------------------------------------------------------- */
// /* Domain                                                                     */
// /* -------------------------------------------------------------------------- */

// export interface AuditSavePayload {
//   product_id: string;
//   business_id: string;
//   quantity: number;
//   reason_code: string;
//   notes: string;
// }

// export interface AuditReasonCode {
//   value: string;
//   label: string;
// }

// export const AUDIT_REASON_CODES: ReadonlyArray<AuditReasonCode> = [
//   { value: "SCHEDULED_AUDIT", label: "Scheduled audit (count confirmed)" },
//   { value: "SYSTEM_MATCH", label: "Count matches ledger" },
//   { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
//   { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
//   { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
//   { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
// ] as const;

// const SCHEDULED_REASON = "SCHEDULED_AUDIT";
// const SCHEDULED_NOTES =
//   "Scheduled stock take — physical count matches ledger.";
// const MATCH_REASON = "SYSTEM_MATCH";
// const MATCH_NOTES = "Physical count matched ledger stock balance.";

// function createAuditSchema(bookStock: number) {
//   return z
//     .object({
//       quantity: z
//         .number({ message: "Enter a valid quantity" })
//         .min(0, "Quantity cannot be negative"),
//       reason_code: z.string(),
//       notes: z.string(),
//       mark_resolved: z.boolean(),
//     })
//     .superRefine((data, ctx) => {
//       if (data.mark_resolved) return;

//       const variance = data.quantity - bookStock;

//       if (variance !== 0) {
//         if (!data.reason_code?.trim()) {
//           ctx.addIssue({
//             code: "custom",
//             message: "Select a reason for this variance",
//             path: ["reason_code"],
//           });
//         }
//         if (!data.notes || data.notes.trim().length < 5) {
//           ctx.addIssue({
//             code: "custom",
//             message: "Add a short note (at least 5 characters)",
//             path: ["notes"],
//           });
//         }
//       }
//     });
// }

// type AuditFormValues = z.infer<ReturnType<typeof createAuditSchema>>;

// export type AuditAlertState = "untracked" | "green" | "amber" | "red";

// export function getAuditAlertState(
//   trackStock: boolean,
//   lastStockTake?: string | Date | null,
// ): AuditAlertState {
//   if (!trackStock) return "untracked";
//   if (!lastStockTake) return "red";
//   const auditDate =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
//   if (Number.isNaN(auditDate.getTime())) return "red";
//   const now = new Date();
//   const sameMonth =
//     auditDate.getFullYear() === now.getFullYear() &&
//     auditDate.getMonth() === now.getMonth();
//   return sameMonth ? "green" : "amber";
// }

// export function formatAuditDate(lastStockTake?: string | Date | null): string {
//   if (!lastStockTake) return "Never";
//   const dateObj =
//     typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
//   if (Number.isNaN(dateObj.getTime())) return "Never";
//   return new Intl.DateTimeFormat(undefined, {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   }).format(dateObj);
// }

// /* -------------------------------------------------------------------------- */
// /* Props                                                                      */
// /* -------------------------------------------------------------------------- */

// export interface AuditTableRowProps {
//   product: ProductResponse;
//   businessId: string;
//   onSaveSuccess: (payload: AuditSavePayload) => Promise<void>;
//   className?: string;
// }

// /* -------------------------------------------------------------------------- */
// /* Component                                                                  */
// /* -------------------------------------------------------------------------- */

// export function AuditTableRow({
//   product,
//   businessId,
//   onSaveSuccess,
//   className,
// }: AuditTableRowProps) {
//   const [expanded, setExpanded] = useState(false);
//   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
//     "idle",
//   );

//   const bookStock = Number(product.stock) || 0;
//   const trackStock = Boolean(product.track_stock);
//   const alertState = getAuditAlertState(trackStock, product.last_stock_take);
//   const schema = createAuditSchema(bookStock);

//   const {
//     register,
//     handleSubmit,
//     watch,
//     reset,
//     setValue,
//     formState: { errors, isDirty },
//   } = useForm<AuditFormValues>({
//     resolver: zodResolver(schema),
//     defaultValues: {
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     },
//     mode: "onChange",
//   });

//   const quantity = watch("quantity");
//   const markResolved = watch("mark_resolved");
//   const reasonCode = watch("reason_code");
//   const notes = watch("notes");

//   const currentQty =
//     typeof quantity === "number" && !Number.isNaN(quantity)
//       ? quantity
//       : bookStock;
//   const variance = currentQty - bookStock;
//   const hasVariance = trackStock && variance !== 0;

//   // Sync when product stock / audit date changes from parent
//   useEffect(() => {
//     if (status === "saving") return;
//     reset({
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     });
//     setStatus("idle");
//   }, [bookStock, product.id, product.last_stock_take]); // eslint-disable-line react-hooks/exhaustive-deps

//   // Mark as audited → lock qty to book + fill reason & notes (still visible)
//   useEffect(() => {
//     if (!markResolved) return;
//     setValue("quantity", bookStock, { shouldDirty: true, shouldValidate: true });
//     setValue("reason_code", SCHEDULED_REASON, {
//       shouldDirty: true,
//       shouldValidate: true,
//     });
//     setValue("notes", SCHEDULED_NOTES, {
//       shouldDirty: true,
//       shouldValidate: true,
//     });
//   }, [markResolved, bookStock, setValue]);

//   const canSave =
//     trackStock && status !== "saving" && (isDirty || markResolved);

//   const borderClass =
//     alertState === "green"
//       ? "border-l-4 border-l-emerald-500"
//       : alertState === "amber"
//         ? "border-l-4 border-l-amber-500"
//         : alertState === "red"
//           ? "border-l-4 border-l-red-500"
//           : "border-l-4 border-l-slate-400";

//   const collapse = useCallback(() => {
//     setExpanded(false);
//     reset({
//       quantity: bookStock,
//       reason_code: "",
//       notes: "",
//       mark_resolved: false,
//     });
//     setStatus("idle");
//   }, [bookStock, reset]);

//   const onSubmit = handleSubmit(async (data) => {
//     if (!trackStock) {
//       toast.error("This product does not track stock");
//       return;
//     }

//     const qty = data.mark_resolved ? bookStock : data.quantity;
//     const varianceNow = qty - bookStock;

//     let reason = data.reason_code.trim();
//     let noteText = data.notes.trim();

//     if (data.mark_resolved) {
//       reason = SCHEDULED_REASON;
//       noteText = SCHEDULED_NOTES;
//     } else if (varianceNow === 0) {
//       // Optional: user may still pick reason/notes; otherwise defaults
//       reason = reason || MATCH_REASON;
//       noteText = noteText || MATCH_NOTES;
//     }

//     const payload: AuditSavePayload = {
//       product_id: product.id,
//       business_id: businessId,
//       quantity: qty,
//       reason_code: reason,
//       notes: noteText,
//     };

//     try {
//       setStatus("saving");
//       await onSaveSuccess(payload);
//       setStatus("success");
//       toast.success("Stock count saved", {
//         description: `${product.label ?? "Product"} · ${qty.toFixed(2)} units`,
//       });
//       reset({
//         quantity: qty,
//         reason_code: "",
//         notes: "",
//         mark_resolved: false,
//       });
//       setTimeout(() => {
//         setExpanded(false);
//         setStatus("idle");
//       }, 900);
//     } catch (err) {
//       setStatus("error");
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not save stock count. Try again.";
//       toast.error("Save failed", { description: message });
//     }
//   });

//   const name = product.label ?? "Unnamed product";
//   const category = product.category ?? "General";
//   const uom = product.attributes?.unit_of_measure ?? "Units";
//   const fieldsLocked = status === "saving" || markResolved;

//   return (
//     <>
//       {/* Summary row */}
//       <tr
//         onClick={() => {
//           if (!trackStock) {
//             toast.message("Stock not tracked", {
//               description: "Enable stock tracking on this product to audit it.",
//             });
//             return;
//           }
//           setExpanded((v) => !v);
//         }}
//         className={cn(
//           "border-b border-border/40 transition-colors cursor-pointer",
//           expanded ? "bg-brand-primary/[0.04]" : "hover:bg-surface/50",
//           status === "success" && "bg-emerald-500/10",
//           className,
//         )}
//       >
//         <td className={cn("px-5 py-3.5 align-middle", borderClass)}>
//           <div className="flex items-start gap-3 min-w-0">
//             <ChevronDown
//               size={16}
//               className={cn(
//                 "mt-0.5 shrink-0 text-muted transition-transform",
//                 expanded && "rotate-180 text-brand-primary",
//               )}
//             />
//             <div className="min-w-0 space-y-1">
//               <div className="flex flex-wrap items-center gap-2">
//                 <span className="text-sm font-semibold text-foreground truncate">
//                   {name}
//                 </span>
//                 <AuditBadge state={alertState} />
//               </div>
//               <p className="text-[11px] text-muted flex flex-wrap gap-x-1.5">
//                 <span>{category}</span>
//                 <span aria-hidden>·</span>
//                 <span>{uom}</span>
//                 <span aria-hidden>·</span>
//                 <span className="font-mono">
//                   Last: {formatAuditDate(product.last_stock_take)}
//                 </span>
//               </p>
//             </div>
//           </div>
//         </td>

//         <td className="px-4 py-3.5 text-right font-mono text-xs text-muted tabular-nums">
//           {bookStock.toFixed(2)}
//         </td>

//         <td className="px-4 py-3.5 text-right font-mono text-xs text-foreground tabular-nums">
//           {expanded ? currentQty.toFixed(2) : "—"}
//         </td>

//         <td className="px-4 py-3.5">
//           <VariancePill
//             variance={trackStock && expanded ? variance : 0}
//             trackStock={trackStock}
//           />
//         </td>

//         <td className="px-5 py-3.5 text-right text-xs text-muted">
//           {expanded ? "Editing…" : trackStock ? "Tap to audit" : "—"}
//         </td>
//       </tr>

//       {/* Expanded panel — always includes quantity, reason, notes */}
//       {expanded && trackStock && (
//         <tr className="border-b border-border/40 bg-surface/30">
//           <td colSpan={5} className={cn("px-5 py-5", borderClass)}>
//             <form
//               onSubmit={onSubmit}
//               onClick={(e) => e.stopPropagation()}
//               className="space-y-5 max-w-3xl"
//               noValidate
//             >
//               {/* Counts */}
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 <div className="space-y-1.5">
//                   <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
//                     Book stock
//                   </label>
//                   <div className="h-11 flex items-center px-3 rounded-xl border border-border/60 bg-card font-mono text-sm tabular-nums text-muted">
//                     {bookStock.toFixed(2)}
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <label
//                     htmlFor={`qty-${product.id}`}
//                     className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                   >
//                     Physical count
//                   </label>
//                   <input
//                     id={`qty-${product.id}`}
//                     type="number"
//                     step="any"
//                     disabled={fieldsLocked}
//                     onFocus={(e) => e.target.select()}
//                     {...register("quantity", { valueAsNumber: true })}
//                     className={cn(
//                       "w-full h-11 px-3 rounded-xl border bg-card font-mono text-sm font-semibold tabular-nums",
//                       "focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
//                       "disabled:opacity-60 disabled:cursor-not-allowed",
//                       errors.quantity ? "border-red-500" : "border-border/60",
//                     )}
//                   />
//                   {errors.quantity && (
//                     <p className="text-xs text-red-500 font-medium" role="alert">
//                       {errors.quantity.message}
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-1.5">
//                   <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
//                     Variance
//                   </label>
//                   <div className="h-11 flex items-center px-3 rounded-xl border border-border/60 bg-card">
//                     <VariancePill variance={variance} trackStock />
//                   </div>
//                 </div>
//               </div>

//               {/* Always-visible reason + notes */}
//               <div
//                 className={cn(
//                   "grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border",
//                   hasVariance && !markResolved
//                     ? "border-amber-500/25 bg-amber-500/5"
//                     : "border-border/50 bg-card",
//                 )}
//               >
//                 <div className="space-y-1.5 sm:col-span-1">
//                   <label
//                     htmlFor={`reason-${product.id}`}
//                     className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                   >
//                     Reason code{hasVariance && !markResolved ? " *" : ""}
//                   </label>
//                   <select
//                     id={`reason-${product.id}`}
//                     disabled={fieldsLocked}
//                     {...register("reason_code")}
//                     className={cn(
//                       "w-full h-11 px-3 rounded-xl border bg-card text-sm",
//                       "focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
//                       "disabled:opacity-70 disabled:cursor-not-allowed",
//                       errors.reason_code ? "border-red-500" : "border-border/60",
//                     )}
//                   >
//                     <option value="">Select reason…</option>
//                     {AUDIT_REASON_CODES.map((c) => (
//                       <option key={c.value} value={c.value}>
//                         {c.label}
//                       </option>
//                     ))}
//                   </select>
//                   {errors.reason_code && (
//                     <p className="text-xs text-red-500 font-medium" role="alert">
//                       {errors.reason_code.message}
//                     </p>
//                   )}
//                   {markResolved && (
//                     <p className="text-[11px] text-muted">
//                       Filled automatically for scheduled audit.
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-1.5 sm:col-span-1">
//                   <label
//                     htmlFor={`notes-${product.id}`}
//                     className="text-[11px] font-semibold uppercase tracking-wider text-muted"
//                   >
//                     Accountability notes{hasVariance && !markResolved ? " *" : ""}
//                   </label>
//                   <input
//                     id={`notes-${product.id}`}
//                     type="text"
//                     disabled={fieldsLocked}
//                     placeholder="Context for this count or variance…"
//                     {...register("notes")}
//                     className={cn(
//                       "w-full h-11 px-3 rounded-xl border bg-card text-sm",
//                       "focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
//                       "disabled:opacity-70 disabled:cursor-not-allowed placeholder:text-muted/50",
//                       errors.notes ? "border-red-500" : "border-border/60",
//                     )}
//                   />
//                   {errors.notes && (
//                     <p className="text-xs text-red-500 font-medium" role="alert">
//                       {errors.notes.message}
//                     </p>
//                   )}
//                 </div>

//                 {hasVariance && !markResolved && (
//                   <p className="sm:col-span-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
//                     <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
//                     Count differs from the ledger — reason and notes are required.
//                   </p>
//                 )}
//               </div>

//               {/* Mark as audited */}
//               <label className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card cursor-pointer select-none">
//                 <input
//                   type="checkbox"
//                   className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary/30"
//                   disabled={status === "saving"}
//                   {...register("mark_resolved")}
//                 />
//                 <span className="text-sm leading-snug">
//                   <span className="font-semibold text-foreground">
//                     Mark as audited (no count change)
//                   </span>
//                   <span className="block text-xs text-muted mt-0.5">
//                     For scheduled checks when the shelf matches the books. Sets
//                     quantity to book stock and fills reason + notes for you.
//                     You can still review them above before saving.
//                   </span>
//                 </span>
//               </label>

//               {/* Actions */}
//               <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
//                 <p className="text-[11px] text-muted">
//                   {!canSave && status === "idle"
//                     ? "Change the count, edit reason/notes, or tick “Mark as audited” to enable Save."
//                     : markResolved
//                       ? `Ready to confirm · ${reasonCode || SCHEDULED_REASON}`
//                       : isDirty
//                         ? "Unsaved changes"
//                         : null}
//                 </p>

//                 <div className="flex flex-wrap items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={collapse}
//                     disabled={status === "saving"}
//                     className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:bg-card transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
//                   >
//                     <X size={16} />
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={!canSave}
//                     className={cn(
//                       "h-10 px-5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all",
//                       canSave
//                         ? "bg-brand-primary text-white hover:opacity-90 shadow-sm"
//                         : "bg-surface text-muted border border-border cursor-not-allowed",
//                     )}
//                   >
//                     {status === "saving" ? (
//                       <>
//                         <Loader2 size={16} className="animate-spin" />
//                         Saving…
//                       </>
//                     ) : status === "success" ? (
//                       <>
//                         <Check size={16} />
//                         Saved
//                       </>
//                     ) : (
//                       <>
//                         <Save size={16} />
//                         Save count
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </form>
//           </td>
//         </tr>
//       )}
//     </>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /* Badges                                                                     */
// /* -------------------------------------------------------------------------- */

// function AuditBadge({ state }: { state: AuditAlertState }) {
//   const map = {
//     green: {
//       label: "Audited",
//       className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
//       icon: CalendarCheck,
//     },
//     amber: {
//       label: "Due",
//       className: "text-amber-600 bg-amber-500/10 border-amber-500/20",
//       icon: Clock,
//     },
//     red: {
//       label: "Overdue",
//       className: "text-red-600 bg-red-500/10 border-red-500/20",
//       icon: CalendarX,
//     },
//     untracked: {
//       label: "Untracked",
//       className: "text-slate-500 bg-slate-500/10 border-slate-500/20",
//       icon: ShieldOff,
//     },
//   } as const;

//   const cfg = map[state];
//   const Icon = cfg.icon;

//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
//         cfg.className,
//       )}
//     >
//       <Icon className="w-3 h-3" />
//       {cfg.label}
//     </span>
//   );
// }

// function VariancePill({
//   variance,
//   trackStock,
// }: {
//   variance: number;
//   trackStock: boolean;
// }) {
//   if (!trackStock) {
//     return (
//       <span className="text-[10px] font-bold text-slate-500 uppercase">N/A</span>
//     );
//   }
//   if (variance === 0) {
//     return (
//       <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
//         <Check className="w-3 h-3" /> Match
//       </span>
//     );
//   }
//   const surplus = variance > 0;
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
//         surplus
//           ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
//           : "text-red-600 bg-red-500/10 border-red-500/20",
//       )}
//     >
//       <AlertTriangle className="w-3 h-3" />
//       {surplus ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
//     </span>
//   );
// }

"use client";

import React, { useState, useCallback, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Check,
  AlertTriangle,
  Loader2,
  Save,
  CalendarCheck,
  CalendarX,
  Clock,
  ShieldOff,
  ChevronDown,
  X,
  FileText,
  Info,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/* Domain Types & Schema                                                      */
/* -------------------------------------------------------------------------- */

export interface AuditSavePayload {
  product_id: string;
  business_id: string;
  quantity: number;
  reason_code: string;
  notes: string;
}

export interface AuditReasonCode {
  value: string;
  label: string;
}

export const AUDIT_REASON_CODES: ReadonlyArray<AuditReasonCode> = [
  { value: "SCHEDULED_AUDIT", label: "Scheduled audit (count confirmed)" },
  { value: "SYSTEM_MATCH", label: "Count matches ledger" },
  { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
  { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
  { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
  { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
] as const;

const SCHEDULED_REASON = "SCHEDULED_AUDIT";
const SCHEDULED_NOTES =
  "Scheduled stock take — physical count matches ledger.";
const MATCH_REASON = "SYSTEM_MATCH";
const MATCH_NOTES = "Physical count matched ledger stock balance.";

function createAuditSchema(bookStock: number) {
  return z
    .object({
      quantity: z
        .number({ message: "Enter a valid quantity" })
        .min(0, "Quantity cannot be negative"),
      reason_code: z.string(),
      notes: z.string(),
      mark_resolved: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.mark_resolved) return;

      const variance = data.quantity - bookStock;

      if (variance !== 0) {
        if (!data.reason_code?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Select a reason for this variance",
            path: ["reason_code"],
          });
        }
        if (!data.notes || data.notes.trim().length < 5) {
          ctx.addIssue({
            code: "custom",
            message: "Add a short note (at least 5 characters)",
            path: ["notes"],
          });
        }
      }
    });
}

type AuditFormValues = z.infer<ReturnType<typeof createAuditSchema>>;

export type AuditAlertState = "untracked" | "green" | "amber" | "red";

export function getAuditAlertState(
  trackStock: boolean,
  lastStockTake?: string | Date | null,
): AuditAlertState {
  if (!trackStock) return "untracked";
  if (!lastStockTake) return "red";
  const auditDate =
    typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
  if (Number.isNaN(auditDate.getTime())) return "red";
  const now = new Date();
  const sameMonth =
    auditDate.getFullYear() === now.getFullYear() &&
    auditDate.getMonth() === now.getMonth();
  return sameMonth ? "green" : "amber";
}

export function formatAuditDate(lastStockTake?: string | Date | null): string {
  if (!lastStockTake) return "Never";
  const dateObj =
    typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
  if (Number.isNaN(dateObj.getTime())) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

/* -------------------------------------------------------------------------- */
/* Component Props                                                            */
/* -------------------------------------------------------------------------- */

export interface AuditTableRowProps {
  /** The product entity returned from the API */
  product: ProductResponse;
  /** Active business tenant ID */
  businessId: string;
  /** Async callback executed when audit count is saved */
  onSaveSuccess: (payload: AuditSavePayload) => Promise<void>;
  /** Optional custom CSS class overrides for the primary row */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Interactive table row for auditing inventory items.
 * Allows quick inspection and inline stock count reconciliations with Zod validation.
 */
export function AuditTableRow({
  product,
  businessId,
  onSaveSuccess,
  className,
}: AuditTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );

  const detailPanelId = useId();
  const bookStock = Number(product.stock) || 0;
  const trackStock = Boolean(product.track_stock);
  const alertState = getAuditAlertState(trackStock, product.last_stock_take);
  const schema = createAuditSchema(bookStock);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: bookStock,
      reason_code: "",
      notes: "",
      mark_resolved: false,
    },
    mode: "onChange",
  });

  const quantity = watch("quantity");
  const markResolved = watch("mark_resolved");
  const reasonCode = watch("reason_code");

  const currentQty =
    typeof quantity === "number" && !Number.isNaN(quantity)
      ? quantity
      : bookStock;
  const variance = currentQty - bookStock;
  const hasVariance = trackStock && variance !== 0;

  // Sync state when product props update externally
  useEffect(() => {
    if (status === "saving") return;
    reset({
      quantity: bookStock,
      reason_code: "",
      notes: "",
      mark_resolved: false,
    });
    setStatus("idle");
  }, [bookStock, product.id, product.last_stock_take, reset]);

  // Handle auto-population when 'markResolved' is toggled
  useEffect(() => {
    if (!markResolved) return;
    setValue("quantity", bookStock, { shouldDirty: true, shouldValidate: true });
    setValue("reason_code", SCHEDULED_REASON, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("notes", SCHEDULED_NOTES, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [markResolved, bookStock, setValue]);

  const canSave =
    trackStock && status !== "saving" && (isDirty || markResolved);

  const borderClass =
    alertState === "green"
      ? "border-l-4 border-l-emerald-500"
      : alertState === "amber"
        ? "border-l-4 border-l-amber-500"
        : alertState === "red"
          ? "border-l-4 border-l-rose-500"
          : "border-l-4 border-l-slate-400 dark:border-l-slate-600";

  const collapse = useCallback(() => {
    setExpanded(false);
    reset({
      quantity: bookStock,
      reason_code: "",
      notes: "",
      mark_resolved: false,
    });
    setStatus("idle");
  }, [bookStock, reset]);

  const handleRowClick = () => {
    if (!trackStock) {
      toast.message("Stock not tracked", {
        description: "Enable stock tracking on this product to audit it.",
      });
      return;
    }
    setExpanded((v) => !v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick();
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!trackStock) {
      toast.error("This product does not track stock");
      return;
    }

    const qty = data.mark_resolved ? bookStock : data.quantity;
    const varianceNow = qty - bookStock;

    let reason = data.reason_code.trim();
    let noteText = data.notes.trim();

    if (data.mark_resolved) {
      reason = SCHEDULED_REASON;
      noteText = SCHEDULED_NOTES;
    } else if (varianceNow === 0) {
      reason = reason || MATCH_REASON;
      noteText = noteText || MATCH_NOTES;
    }

    const payload: AuditSavePayload = {
      product_id: product.id,
      business_id: businessId,
      quantity: qty,
      reason_code: reason,
      notes: noteText,
    };

    try {
      setStatus("saving");
      await onSaveSuccess(payload);
      setStatus("success");
      toast.success("Stock count saved", {
        description: `${product.label ?? "Product"} · ${qty.toFixed(2)} units`,
      });
      reset({
        quantity: qty,
        reason_code: "",
        notes: "",
        mark_resolved: false,
      });
      setTimeout(() => {
        setExpanded(false);
        setStatus("idle");
      }, 900);
    } catch (err) {
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Could not save stock count. Try again.";
      toast.error("Save failed", { description: message });
    }
  });

  const name = product.label ?? "Unnamed product";
  const category = product.category ?? "General";
  const uom = product.attributes?.unit_of_measure ?? "Units";
  const fieldsLocked = status === "saving" || markResolved;

  return (
    <>
      {/* Summary Row */}
      <tr
        tabIndex={trackStock ? 0 : -1}
        role="button"
        aria-expanded={expanded}
        aria-controls={expanded ? detailPanelId : undefined}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group border-b border-border/60 transition-colors duration-150 outline-none select-none",
          trackStock ? "cursor-pointer" : "cursor-default opacity-80",
          expanded
            ? "bg-primary/[0.03] dark:bg-primary/[0.07]"
            : "hover:bg-muted/50 focus-visible:bg-muted/60",
          status === "success" && "bg-emerald-500/10 dark:bg-emerald-950/20",
          className,
        )}
      >
        <td className={cn("px-4 py-3.5 align-middle transition-all", borderClass)}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-all duration-200 shrink-0",
                expanded && "rotate-180 text-primary group-hover:text-primary bg-primary/10",
              )}
            >
              <ChevronDown size={16} />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {name}
                </span>
                <AuditBadge state={alertState} />
              </div>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                <span>{category}</span>
                <span className="text-border" aria-hidden>•</span>
                <span>{uom}</span>
                <span className="text-border" aria-hidden>•</span>
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  Last: {formatAuditDate(product.last_stock_take)}
                </span>
              </p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3.5 text-right font-mono text-xs font-medium text-muted-foreground tabular-nums align-middle">
          {bookStock.toFixed(2)}
        </td>

        <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-foreground tabular-nums align-middle">
          {expanded ? currentQty.toFixed(2) : "—"}
        </td>

        <td className="px-4 py-3.5 align-middle">
          <div className="flex justify-start">
            <VariancePill
              variance={trackStock && expanded ? variance : 0}
              trackStock={trackStock}
            />
          </div>
        </td>

        <td className="px-4 py-3.5 text-right align-middle">
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              expanded
                ? "text-primary font-semibold"
                : trackStock
                  ? "text-muted-foreground group-hover:text-foreground"
                  : "text-muted-foreground/50",
            )}
          >
            {expanded ? "Editing…" : trackStock ? "Tap to audit" : "—"}
          </span>
        </td>
      </tr>

      {/* Expanded Editing Panel */}
      {expanded && trackStock && (
        <tr id={detailPanelId} className="border-b border-border/80 bg-muted/20">
          <td colSpan={5} className={cn("p-4 sm:p-5 transition-all", borderClass)}>
            <form
              onSubmit={onSubmit}
              onClick={(e) => e.stopPropagation()}
              className="space-y-4 max-w-4xl"
              noValidate
            >
              {/* Quantities Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Book Stock Display */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Book stock
                  </label>
                  <div className="h-10 flex items-center px-3 rounded-lg border border-border bg-muted/40 font-mono text-sm font-medium tabular-nums text-muted-foreground">
                    {bookStock.toFixed(2)}
                  </div>
                </div>

                {/* Physical Count Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`qty-${product.id}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
                  >
                    Physical count
                  </label>
                  <input
                    id={`qty-${product.id}`}
                    type="number"
                    step="any"
                    disabled={fieldsLocked}
                    onFocus={(e) => e.target.select()}
                    {...register("quantity", { valueAsNumber: true })}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border bg-background font-mono text-sm font-semibold tabular-nums text-foreground transition-all shadow-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/50",
                      errors.quantity
                        ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-input",
                    )}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-rose-500 font-medium" role="alert">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                {/* Calculated Variance */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Variance
                  </label>
                  <div className="h-10 flex items-center px-3 rounded-lg border border-border bg-background shadow-sm">
                    <VariancePill variance={variance} trackStock />
                  </div>
                </div>
              </div>

              {/* Reason & Notes Field Container */}
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border transition-all duration-200",
                  hasVariance && !markResolved
                    ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
                    : "border-border/70 bg-background shadow-sm",
                )}
              >
                {/* Reason Code Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`reason-${product.id}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1"
                  >
                    Reason code
                    {hasVariance && !markResolved && (
                      <span className="text-rose-500 font-semibold">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      id={`reason-${product.id}`}
                      disabled={fieldsLocked}
                      {...register("reason_code")}
                      className={cn(
                        "w-full h-10 px-3 pr-8 rounded-lg border bg-background text-sm text-foreground appearance-none transition-all shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-muted/50",
                        errors.reason_code
                          ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-input",
                      )}
                    >
                      <option value="">Select reason…</option>
                      {AUDIT_REASON_CODES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-2.5 top-3" />
                  </div>
                  {errors.reason_code && (
                    <p className="text-xs text-rose-500 font-medium" role="alert">
                      {errors.reason_code.message}
                    </p>
                  )}
                  {markResolved && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Info className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      Filled automatically for scheduled audit.
                    </p>
                  )}
                </div>

                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`notes-${product.id}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1"
                  >
                    Accountability notes
                    {hasVariance && !markResolved && (
                      <span className="text-rose-500 font-semibold">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id={`notes-${product.id}`}
                      type="text"
                      disabled={fieldsLocked}
                      placeholder="Context for this count or variance…"
                      {...register("notes")}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border bg-background text-sm text-foreground transition-all shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-muted/50 placeholder:text-muted-foreground/50",
                        errors.notes
                          ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-input",
                      )}
                    />
                  </div>
                  {errors.notes && (
                    <p className="text-xs text-rose-500 font-medium" role="alert">
                      {errors.notes.message}
                    </p>
                  )}
                </div>

                {/* Variance Warning Banner */}
                {hasVariance && !markResolved && (
                  <div className="sm:col-span-2 pt-1">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Count differs from book stock — reason and notes are required.
                    </p>
                  </div>
                )}
              </div>

              {/* Checkbox Card Option */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/30 transition-colors cursor-pointer select-none shadow-sm">
                <input
                  type="checkbox"
                  disabled={status === "saving"}
                  {...register("mark_resolved")}
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20 accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-sm font-semibold text-foreground block">
                    Mark as audited (no count change)
                  </span>
                  <span className="text-xs text-muted-foreground block leading-normal">
                    For routine checks when physical stock matches ledger. Sets count to
                    book stock and auto-fills audit details.
                  </span>
                </div>
              </label>

              {/* Bottom Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground">
                  {!canSave && status === "idle" ? (
                    <span className="flex items-center gap-1 text-muted-foreground/80">
                      <FileText className="w-3.5 h-3.5" />
                      Modify count or check &quot;Mark as audited&quot; to enable saving.
                    </span>
                  ) : markResolved ? (
                    <span className="font-medium text-primary">
                      Ready to confirm audit · {reasonCode || SCHEDULED_REASON}
                    </span>
                  ) : isDirty ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      ● Unsaved count changes
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={collapse}
                    disabled={status === "saving"}
                    className="h-9 px-3.5 rounded-lg border border-input text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className={cn(
                      "h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]",
                      canSave
                        ? "bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                        : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70",
                    )}
                  >
                    {status === "saving" ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving…
                      </>
                    ) : status === "success" ? (
                      <>
                        <Check size={14} className="text-emerald-300" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save count
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper Badges & Components                                                 */
/* -------------------------------------------------------------------------- */

function AuditBadge({ state }: { state: AuditAlertState }) {
  const map = {
    green: {
      label: "Audited",
      className:
        "text-emerald-700 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-950/40",
      icon: CalendarCheck,
    },
    amber: {
      label: "Due",
      className:
        "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-amber-400 dark:bg-amber-950/40",
      icon: Clock,
    },
    red: {
      label: "Overdue",
      className:
        "text-rose-700 bg-rose-500/10 border-rose-500/30 dark:text-rose-400 dark:bg-rose-950/40",
      icon: CalendarX,
    },
    untracked: {
      label: "Untracked",
      className:
        "text-slate-600 bg-slate-500/10 border-slate-500/30 dark:text-slate-400 dark:bg-slate-900/40",
      icon: ShieldOff,
    },
  } as const;

  const cfg = map[state];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0",
        cfg.className,
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function VariancePill({
  variance,
  trackStock,
}: {
  variance: number;
  trackStock: boolean;
}) {
  if (!trackStock) {
    return (
      <span className="text-[10px] font-bold text-muted-foreground uppercase">
        N/A
      </span>
    );
  }
  if (variance === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 dark:text-emerald-400 px-2 py-0.5 rounded-md uppercase">
        <Check className="w-3 h-3" /> Match
      </span>
    );
  }
  const surplus = variance > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tabular-nums",
        surplus
          ? "text-indigo-700 bg-indigo-500/10 border-indigo-500/30 dark:text-indigo-400 dark:bg-indigo-950/40"
          : "text-rose-700 bg-rose-500/10 border-rose-500/30 dark:text-rose-400 dark:bg-rose-950/40",
      )}
    >
      <AlertTriangle className="w-3 h-3" />
      {surplus ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
    </span>
  );
}