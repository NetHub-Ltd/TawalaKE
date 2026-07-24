// "use client";

// import React, { useState, useId } from "react";
// import { useForm } from "react-hook-form";
// import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// interface ProductAttributes {
//   buying_price?: number;
//   sku?: string;
// }

// interface ProductResponse {
//   id: string;
//   label: string;
//   category?: string;
//   selling_price?: number;
//   stock?: number;
//   attributes?: ProductAttributes;
// }

// interface StockTakingFormData {
//   quantity: number;
//   buying_price: number;
//   selling_price: number;
//   reference_id: string;
//   reference_type: string;
//   notes: string;
// }

// interface StockTakingTableRowProps {
//   product: ProductResponse;
//   businessId: string;
//   onSaveSuccess: (payload: unknown) => Promise<void>;
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
//   const referenceId = useId();
//   const notesId = useId();

//   const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
//   const defaultSellingPrice = product.selling_price ?? 0;
//   const currentLedgerStock = product.stock ?? 0;

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
//       reference_id: "",
//       reference_type: "INITIAL_STOCK_TAKE",
//       notes: "",
//     },
//   });

//   const toggleExpand = () => setIsExpanded((prev) => !prev);

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
//         reference_id: data.reference_id.trim() || undefined,
//         reference_type: data.reference_type,
//         notes: data.notes.trim() || "New stock recorded.",
//       };

//       await onSaveSuccess(finalPayload);

//       setStatus("success");
//       reset({
//         quantity: data.quantity,
//         buying_price: data.buying_price,
//         selling_price: data.selling_price,
//         reference_id: data.reference_id,
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
//         className="border-b border-border bg-background hover:bg-card cursor-pointer transition-colors duration-150 select-none"
//       >
//         <td colSpan={2} className="px-6 py-4">
//           <div className="flex items-center gap-3">
//             <div className="text-muted shrink-0" aria-hidden="true">
//               {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//             </div>
//             <div>
//               <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
//                 {product.label}
//               </h4>
//               <p className="text-[10px] text-muted font-mono font-semibold tracking-wider mt-0.5">
//                 SKU: {product.attributes?.sku || "NO_SKU"} &bull; {product.category || "General"}
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

//       {isExpanded && (
//         <tr className="bg-card border-b border-border">
//           <td colSpan={5} className="p-6">
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

//                 <div>
//                   <label
//                     htmlFor={referenceId}
//                     className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
//                   >
//                     Reference Code / PO Number
//                   </label>
//                   <input
//                     id={referenceId}
//                     type="text"
//                     disabled={status === "saving"}
//                     placeholder="e.g. PO-98402"
//                     {...register("reference_id")}
//                     className="w-full text-xs font-mono px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
//                   />
//                 </div>

//                 <div>
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
//                   className="p-3 bg-background border border-brand-primary text-brand-primary rounded-md text-xs font-bold"
//                 >
//                   {errorMessage}
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

import React, { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

interface StockTakingFormData {
  quantity: number;
  buying_price: number;
  selling_price: number;
  reference_id: string;
  reference_type: string;
  notes: string;
}

interface StockTakingTableRowProps {
  product: ProductResponse;
  businessId: string;
  onSaveSuccess: (payload: unknown) => Promise<void>;
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

export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const quantityId = useId();
  const buyingPriceId = useId();
  const sellingPriceId = useId();
  const referenceTypeId = useId();
  const referenceId = useId();
  const notesId = useId();

  const defaultBuyingPrice = (product.attributes as { buying_price?: number })?.buying_price ?? 0;
  const defaultSellingPrice = product.selling_price ?? 0;
  const currentLedgerStock = product.stock ?? 0;
  const sku = (product.attributes as { sku?: string })?.sku || "NO_SKU";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<StockTakingFormData>({
    defaultValues: {
      quantity: currentLedgerStock,
      buying_price: defaultBuyingPrice,
      selling_price: defaultSellingPrice,
      reference_id: "",
      reference_type: "INITIAL_STOCK_TAKE",
      notes: "",
    },
  });

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const onSubmit = async (data: StockTakingFormData) => {
    try {
      setStatus("saving");
      setErrorMessage("");

      const finalPayload = {
        product_id: product.id,
        business_id: businessId,
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_id: data.reference_id.trim() || undefined,
        reference_type: data.reference_type,
        notes: data.notes.trim() || "New stock recorded.",
      };

      await onSaveSuccess(finalPayload);

      setStatus("success");
      reset({
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_id: data.reference_id,
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
        className="border-b border-border bg-background hover:bg-card cursor-pointer transition-colors duration-150 select-none"
      >
        <td colSpan={2} className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-muted shrink-0" aria-hidden="true">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
                {product.label}
              </h4>
              <p className="text-[10px] text-muted font-mono font-semibold tracking-wider mt-0.5">
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

      {isExpanded && (
        <tr className="bg-card border-b border-border">
          <td colSpan={5} className="p-6">
            <div className="space-y-4">
              <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 border-none p-0 m-0">
                <legend className="sr-only">New Stock Entry Form for {product.label}</legend>

                <div>
                  <label
                    htmlFor={quantityId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    Physical Count
                  </label>
                  <input
                    id={quantityId}
                    type="number"
                    step="any"
                    onFocus={(e) => e.target.select()}
                    disabled={status === "saving"}
                    {...register("quantity", {
                      required: "Physical count is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Count cannot be negative" },
                    })}
                    placeholder="0.00"
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
                  />
                  {errors.quantity && (
                    <p className="text-[10px] text-brand-primary font-bold mt-1">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={buyingPriceId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    Cost Price (KES)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-2 text-[10px] font-bold text-muted"
                      aria-hidden="true"
                    >
                      KES
                    </span>
                    <input
                      id={buyingPriceId}
                      type="number"
                      step="any"
                      onFocus={(e) => e.target.select()}
                      disabled={status === "saving"}
                      {...register("buying_price", {
                        required: "Cost price is required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Price cannot be negative" },
                      })}
                      className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
                    />
                  </div>
                  {errors.buying_price && (
                    <p className="text-[10px] text-brand-primary font-bold mt-1">
                      {errors.buying_price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={sellingPriceId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    Retail Price (KES)
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-2 text-[10px] font-bold text-muted"
                      aria-hidden="true"
                    >
                      KES
                    </span>
                    <input
                      id={sellingPriceId}
                      type="number"
                      step="any"
                      onFocus={(e) => e.target.select()}
                      disabled={status === "saving"}
                      {...register("selling_price", {
                        required: "Selling price is required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Price cannot be negative" },
                      })}
                      className="w-full text-xs font-mono font-bold pl-11 pr-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
                    />
                  </div>
                  {errors.selling_price && (
                    <p className="text-[10px] text-brand-primary font-bold mt-1">
                      {errors.selling_price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={referenceTypeId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    Reference Type
                  </label>
                  <select
                    id={referenceTypeId}
                    disabled={status === "saving"}
                    {...register("reference_type")}
                    className="w-full text-xs font-medium px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs cursor-pointer"
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

                <div>
                  <label
                    htmlFor={referenceId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    Reference Code / PO Number
                  </label>
                  <input
                    id={referenceId}
                    type="text"
                    disabled={status === "saving"}
                    placeholder="e.g. PO-98402"
                    {...register("reference_id")}
                    className="w-full text-xs font-mono px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor={notesId}
                    className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1"
                  >
                    New Stock Notes
                  </label>
                  <input
                    id={notesId}
                    type="text"
                    disabled={status === "saving"}
                    placeholder="e.g. Physical inventory count verified"
                    {...register("notes")}
                    className="w-full text-xs px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-brand-primary transition-all shadow-xs"
                  />
                </div>
              </fieldset>

              {status === "error" && errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-background border border-brand-primary text-brand-primary rounded-md text-xs font-bold"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  disabled={status === "saving"}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border bg-background text-foreground rounded-md hover:bg-card focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isDirty || status === "saving"}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-primary text-background rounded-md hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50 min-w-[120px] cursor-pointer"
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