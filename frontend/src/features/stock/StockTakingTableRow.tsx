
// // src/features/stock/StockTakingTableRow.tsx
// "use client";

// import React, { useState } from "react";
// import { useForm } from "react-hook-form";
// import { Loader2, Save, Tags, Layers, FileText } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";
// import { Button } from "@/lib/components/ui/Button";

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
//   onSaveSuccess: (payload: any) => Promise<void>;
// }

// export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
//   product,
//   businessId,
//   onSaveSuccess,
// }) => {
//   const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
//   const [errorMessage, setErrorMessage] = useState("");

//   // 1. Strict derivation bound explicitly to your generated OpenAPI schema shape
//   const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
//   const defaultSellingPrice = product.selling_price ?? 0;
//   const currentLedgerStock = product.stock ?? 0;

//   // 2. Initialize pure React Hook Form with exact baseline values
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
//       reference_type: "PURCHASE_ORDER",
//       notes: "",
//     },
//   });

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
//         notes: data.notes.trim() || "Stock ingestion session completed via terminal line ledger item.",
//       };

//       await onSaveSuccess(finalPayload);
      
//       setStatus("success");
//       reset({ 
//         quantity: data.quantity, 
//         buying_price: data.buying_price, 
//         selling_price: data.selling_price,
//         reference_id: data.reference_id,
//         reference_type: data.reference_type,
//         notes: "" 
//       });
//     } catch (err: any) {
//       setStatus("error");
//       setErrorMessage(err?.message || "Failed to commit stock take registration event records.");
//     }
//   };

//   const getRowStyles = () => {
//     if (status === "success") return "bg-brand-accent/5 border-brand-accent/20";
//     if (status === "error") return "bg-brand-primary/5 border-brand-primary/20";
//     return "bg-background border-border/40 hover:bg-surface/30";
//   };

//   return (
//     <form 
//       onSubmit={handleSubmit(onSubmit)} 
//       className={`border-b transition-colors duration-200 ${getRowStyles()}`}
//     >
//       {/* Upper Main Dense Data Grid Row */}
//       <div className="flex flex-col lg:flex-row lg:items-center px-4 py-3 gap-4">
        
//         {/* Product Meta Specifications Block using explicit schema access fields */}
//         <div className="flex-1 min-w-[220px]">
//           <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">{product.label}</h4>
//           <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">
//             SKU: {product.attributes?.sku || "NO_SKU"} &bull;{" "}
//             <span className="opacity-80">{product.category || "General"}</span>
//           </p>
//         </div>

//         {/* Form Inputs Horizontal Array */}
//         <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
          
//           {/* Physical Count Input Field */}
//           <div className="w-full sm:w-24">
//             <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Count</label>
//             <input
//               type="number"
//               step="any"
//               onFocus={(e) => e.target.select()}
//               disabled={status === "saving"}
//               {...register("quantity", {
//                 required: "Count is required",
//                 valueAsNumber: true,
//                 min: { value: 0, message: "Cannot store sub-zero volume" }
//               })}
//               placeholder="0.00"
//               className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
//             />
//             {errors.quantity && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.quantity.message}</p>}
//           </div>

//           {/* Cost/Buying Price Unit Field */}
//           <div className="w-full sm:w-28">
//             <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Cost Price</label>
//             <div className="relative">
//               <span className="absolute left-2 top-1.5 text-[10px] font-bold text-muted/60">KES</span>
//               <input
//                 type="number"
//                 step="any"
//                 onFocus={(e) => e.target.select()}
//                 disabled={status === "saving"}
//                 {...register("buying_price", {
//                   required: "Cost required",
//                   valueAsNumber: true,
//                   min: { value: 0, message: "Invalid value" }
//                 })}
//                 className="w-full text-xs font-mono font-bold pl-8 pr-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
//               />
//             </div>
//             {errors.buying_price && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.buying_price.message}</p>}
//           </div>

//           {/* Retail/Selling Price Unit Field */}
//           <div className="w-full sm:w-28">
//             <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Retail Price</label>
//             <div className="relative">
//               <span className="absolute left-2 top-1.5 text-[10px] font-bold text-muted/60">KES</span>
//               <input
//                 type="number"
//                 step="any"
//                 onFocus={(e) => e.target.select()}
//                 disabled={status === "saving"}
//                 {...register("selling_price", {
//                   required: "Selling required",
//                   valueAsNumber: true,
//                   min: { value: 0, message: "Invalid value" }
//                 })}
//                 className="w-full text-xs font-mono font-bold pl-8 pr-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
//               />
//             </div>
//             {errors.selling_price && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.selling_price.message}</p>}
//           </div>

//         </div>

//         {/* Save/Commit Control Anchor Section */}
//         <div className="w-full lg:w-20 flex items-center justify-end ml-auto shrink-0">
//           {status === "saving" ? (
//             <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
//           ) : (
//             <button
//               type="submit"
//               disabled={!isDirty && status !== "error"}
//               className={`w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all min-h-[32px] ${
//                 isDirty 
//                   ? "bg-brand-secondary text-background border-transparent hover:scale-[1.02] active:scale-100 cursor-pointer shadow-xs" 
//                   : "bg-surface text-muted border-border/40 cursor-not-allowed"
//               }`}
//             >
//               <Save className="w-3 h-3" /> Save
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Under-shelf Document Audit Trailing Controls Row */}
//       <div className="px-4 pb-3 pt-1 border-t border-dashed border-border/30 bg-surface/10 grid grid-cols-1 md:grid-cols-3 gap-3">
        
//         {/* Document Context Selection Parameter */}
//         <div className="flex items-center gap-2">
//           <Layers className="w-3.5 h-3.5 text-muted/60 shrink-0" />
//           <select
//             {...register("reference_type")}
//             className="w-full text-[11px] font-bold bg-transparent text-foreground focus:outline-none cursor-pointer"
//           >
//             <option value="PURCHASE_ORDER">Purchase Order (PO)</option>
//             <option value="STOCK_TAKE">Initial Stock Take</option>
//             <option value="GOODS_RECEIVED">Goods Received Note (GRN)</option>
//             <option value="ADJUSTMENT">Manual Pricing/Count Patch</option>
//           </select>
//         </div>

//         {/* Reference Document Hash Token Code Input */}
//         <div className="flex items-center gap-2">
//           <Tags className="w-3.5 h-3.5 text-muted/60 shrink-0" />
//           <input
//             type="text"
//             placeholder="Reference code or ID string..."
//             {...register("reference_id")}
//             className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-mono"
//           />
//         </div>

//         {/* Ledger Activity Supplementary Notes Field */}
//         <div className="flex items-center gap-2">
//           <FileText className="w-3.5 h-3.5 text-muted/60 shrink-0" />
//           <input
//             type="text"
//             placeholder="Add operational notes or logging metadata context..."
//             {...register("notes")}
//             className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-medium"
//           />
//         </div>

//       </div>

//       {/* System Transaction Discrepancy Warnings */}
//       {status === "error" && errorMessage && (
//         <div className="bg-brand-primary/10 border-t border-brand-primary/20 px-4 py-1.5 text-[10px] font-black text-brand-primary uppercase tracking-wide">
//           {errorMessage}
//         </div>
//       )}
//     </form>
//   );
// };

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, Tags, Layers, FileText } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { Button } from "@/lib/components/ui/Button";

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
  onSaveSuccess: (payload: any) => Promise<void>;
}

export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Strict derivation bound explicitly to your generated OpenAPI schema shape
  const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
  const defaultSellingPrice = product.selling_price ?? 0;
  const currentLedgerStock = product.stock ?? 0;

  // 2. Initialize pure React Hook Form with exact baseline values
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
      reference_type: "PURCHASE_ORDER",
      notes: "",
    },
  });

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
        notes: data.notes.trim() || "Stock ingestion session completed via terminal line ledger item.",
      };

      await onSaveSuccess(finalPayload);
      
      setStatus("success");
      reset({ 
        quantity: data.quantity, 
        buying_price: data.buying_price, 
        selling_price: data.selling_price,
        reference_id: data.reference_id,
        reference_type: data.reference_type,
        notes: "" 
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to commit stock take registration event records.");
    }
  };

  const getRowStyles = () => {
    if (status === "success") return "bg-brand-accent/5 border-brand-accent/20";
    if (status === "error") return "bg-brand-primary/5 border-brand-primary/20";
    return "bg-background border-border/40 hover:bg-surface/30";
  };

  return (
    <tr className={`border-b transition-colors duration-200 ${getRowStyles()}`}>
      <td colSpan={4} className="p-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Upper Main Dense Data Grid Row */}
          <div className="flex flex-col lg:flex-row lg:items-center px-4 py-3 gap-4">
            
            {/* Product Meta Specifications Block using explicit schema access fields */}
            <div className="flex-1 min-w-[220px]">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">{product.label}</h4>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">
                SKU: {product.attributes?.sku || "NO_SKU"} &bull;{" "}
                <span className="opacity-80">{product.category || "General"}</span>
              </p>
            </div>

            {/* Form Inputs Horizontal Array */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
              
              {/* Physical Count Input Field */}
              <div className="w-full sm:w-24">
                <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Count</label>
                <input
                  type="number"
                  step="any"
                  onFocus={(e) => e.target.select()}
                  disabled={status === "saving"}
                  {...register("quantity", {
                    required: "Count is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot store sub-zero volume" }
                  })}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
                />
                {errors.quantity && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.quantity.message}</p>}
              </div>

              {/* Cost/Buying Price Unit Field */}
              <div className="w-full sm:w-28">
                <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Cost Price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-[10px] font-bold text-muted/60">KES</span>
                  <input
                    type="number"
                    step="any"
                    onFocus={(e) => e.target.select()}
                    disabled={status === "saving"}
                    {...register("buying_price", {
                      required: "Cost required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Invalid value" }
                    })}
                    className="w-full text-xs font-mono font-bold pl-8 pr-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
                  />
                </div>
                {errors.buying_price && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.buying_price.message}</p>}
              </div>

              {/* Retail/Selling Price Unit Field */}
              <div className="w-full sm:w-28">
                <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1 lg:hidden">Retail Price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-[10px] font-bold text-muted/60">KES</span>
                  <input
                    type="number"
                    step="any"
                    onFocus={(e) => e.target.select()}
                    disabled={status === "saving"}
                    {...register("selling_price", {
                      required: "Selling required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Invalid value" }
                    })}
                    className="w-full text-xs font-mono font-bold pl-8 pr-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface"
                  />
                </div>
                {errors.selling_price && <p className="text-[10px] text-brand-primary font-bold mt-0.5">{errors.selling_price.message}</p>}
              </div>

            </div>

            {/* Save/Commit Control Anchor Section */}
            <div className="w-full lg:w-24 flex items-center justify-end ml-auto shrink-0">
              <Button
                type="submit"
                variant={isDirty ? "secondary" : "outline"}
                size="sm"
                disabled={(!isDirty && status !== "error") || status === "saving"}
                className={`w-full lg:w-auto font-black uppercase text-[10px] tracking-wider transition-all min-h-[32px] ${
                  isDirty && status !== "saving" ? "hover:scale-[1.02] active:scale-100" : ""
                }`}
              >
                {status === "saving" ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Under-shelf Document Audit Trailing Controls Row */}
          <div className="px-4 pb-3 pt-1 border-t border-dashed border-border/30 bg-surface/10 grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Document Context Selection Parameter */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-muted/60 shrink-0" />
              <select
                {...register("reference_type")}
                className="w-full text-[11px] font-bold bg-transparent text-foreground focus:outline-none cursor-pointer"
              >
                <option value="PURCHASE_ORDER">Purchase Order (PO)</option>
                <option value="STOCK_TAKE">Initial Stock Take</option>
                <option value="GOODS_RECEIVED">Goods Received Note (GRN)</option>
                <option value="ADJUSTMENT">Manual Pricing/Count Patch</option>
              </select>
            </div>

            {/* Reference Document Hash Token Code Input */}
            <div className="flex items-center gap-2">
              <Tags className="w-3.5 h-3.5 text-muted/60 shrink-0" />
              <input
                type="text"
                placeholder="Reference code or ID string..."
                {...register("reference_id")}
                className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-mono"
              />
            </div>

            {/* Ledger Activity Supplementary Notes Field */}
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted/60 shrink-0" />
              <input
                type="text"
                placeholder="Add operational notes or logging metadata context..."
                {...register("notes")}
                className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-medium"
              />
            </div>

          </div>

          {/* System Transaction Discrepancy Warnings */}
          {status === "error" && errorMessage && (
            <div className="bg-brand-primary/10 border-t border-brand-primary/20 px-4 py-1.5 text-[10px] font-black text-brand-primary uppercase tracking-wide">
              {errorMessage}
            </div>
          )}
        </form>
      </td>
    </tr>
  );
};