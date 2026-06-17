// // src/features/inventory/AssetComposer.tsx
// "use client";

// import React from "react";
// import { useForm } from "react-hook-form";
// import {useBusinessContext} from "@/features/business/hooks/useBusiness"

// import { 
//   Plus, 
//   Layers, 
//   DollarSign, 
//   Tag, 
//   Barcode,
//   Package,
//   Loader2,
//   ChevronDown
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// const CATEGORY_PRESETS = [
//   "General", "Apparel & Clothing", "Beverages", "Electronics", 
//   "Food & Groceries", "Hardware & Tools", "Health & Beauty", "Home Goods", "Services"
// ];

// const UNIT_PRESETS = [
//   { value: "pcs", label: "Pieces (PCS)" },
//   { value: "kg", label: "Kilograms (KG)" },
//   { value: "g", label: "Grams (G)" },
//   { value: "l", label: "Liters (L)" },
//   { value: "box", label: "Boxes (BOX)" },
//   { value: "pack", label: "Packs (PCK)" }
// ];

// export interface AssetFormValues {
//   label: string;
//   selling_price: number;
//   stock: number;
//   category: string;
//   attributes: {
//     unit_of_measure: string;
//     buying_price: number;
//     sku: string;
//   };
// }

// interface AssetComposerProps {
//   onSubmit: (data: AssetFormValues, resetForm: () => void) => void;
//   onCancel: () => void;
//   isPending?: boolean;
//   submitButtonText?: string;
// }

// export function AssetComposer({ 
//   onSubmit, 
//   onCancel, 
//   isPending = false,
//   submitButtonText = "Save Product"
// }: AssetComposerProps) {
  
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<AssetFormValues>({
//     defaultValues: {
//       label: "",
//       selling_price: 0,
//       stock: 0,
//       category: "General",
//       attributes: {
//         unit_of_measure: "pcs",
//         buying_price: 0,
//         sku: "",
//       },
//     }
//   });

//   const handleFormSubmit = (data: AssetFormValues) => {
//     // Pass the standard React Hook Form reset handle function upstream
//     data.business_id = ""
//     onSubmit(data, () => reset());
//   };

//   return (
//     <form 
//       onSubmit={handleSubmit(handleFormSubmit)} 
//       className="w-full bg-card border border-border/40 rounded-xl shadow-xs overflow-hidden flex flex-col"
//     >
//       <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
//         {/* LEFT COLUMN */}
//         <div className="space-y-6">
//           <div className="flex items-center gap-2 pb-3 border-b border-border/30">
//             <Package size={16} className="text-brand-secondary" />
//             <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
//               Identity & Parameters
//             </h3>
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="label" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//               Product Label / Title <span className="text-brand-primary">*</span>
//             </label>
//             <input
//               id="label"
//               type="text"
//               {...register("label", { required: "Product identifier is mandatory" })}
//               placeholder="e.g., Premium Roasted Arabica Coffee"
//               className={cn(
//                 "w-full bg-background border border-border/60 rounded text-xs font-bold font-mono h-10 px-3 text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface",
//                 errors.label && "border-brand-primary"
//               )}
//             />
//             {errors.label && (
//               <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mt-0.5">
//                 {errors.label.message}
//               </p>
//             )}
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label htmlFor="category" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 Category Placement
//               </label>
//               <div className="relative">
//                 <Tag className="absolute left-3 top-3 text-muted/60" size={14} />
//                 <select
//                   id="category"
//                   {...register("category")}
//                   className="w-full bg-background border border-border/60 rounded text-xs font-bold pl-9 pr-8 h-10 text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
//                 >
//                   {CATEGORY_PRESETS.map((cat) => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3 top-3 text-muted/60 pointer-events-none" size={14} />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="stock" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 Initial Stock Base
//               </label>
//               <div className="relative">
//                 <Layers className="absolute left-3 top-3 text-muted/40" size={14} />
//                 <input
//                   id="stock"
//                   type="number"
//                   readOnly
//                   value={0}
//                   className="w-full bg-surface/50 border border-border/40 rounded text-xs font-bold font-mono pl-9 pr-3 h-10 text-muted cursor-not-allowed select-none focus:outline-none"
//                   title="Stock counts must be altered using active Ledger entry points."
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="space-y-6 lg:border-l lg:border-border/30 lg:pl-8">
//           <div className="flex items-center gap-2 pb-3 border-b border-border/30">
//             <DollarSign size={16} className="text-brand-secondary" />
//             <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
//               Financial & Logistics
//             </h3>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label htmlFor="buying_price" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 Unit Cost Price (Buying)
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted/60 font-mono">KES</span>
//                 <input
//                   id="buying_price"
//                   type="number"
//                   step="any"
//                   {...register("attributes.buying_price", { valueAsNumber: true })}
//                   className="w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-11 pr-3 h-10 text-foreground focus:outline-none focus:border-brand-primary/40"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="selling_price" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 Unit Retail Price (Selling) <span className="text-brand-primary">*</span>
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted/60 font-mono">KES</span>
//                 <input
//                   id="selling_price"
//                   type="number"
//                   step="any"
//                   {...register("selling_price", { valueAsNumber: true, required: "Selling price required" })}
//                   className={cn(
//                     "w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-11 pr-3 h-10 text-foreground focus:outline-none focus:border-brand-primary/40",
//                     errors.selling_price && "border-brand-primary"
//                   )}
//                 />
//               </div>
//               {errors.selling_price && (
//                 <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mt-0.5">
//                   {errors.selling_price.message}
//                 </p>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label htmlFor="sku" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 SKU / Barcode Identifier
//               </label>
//               <div className="relative">
//                 <Barcode className="absolute left-3 top-3 text-muted/60" size={14} />
//                 <input
//                   id="sku"
//                   type="text"
//                   {...register("attributes.sku")}
//                   placeholder="Auto-generated if left empty"
//                   className="w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-9 pr-3 h-10 text-foreground placeholder:text-muted/40 placeholder:font-sans focus:outline-none focus:border-brand-primary/40"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="unit_of_measure" className="block text-[10px] font-black uppercase tracking-widest text-muted">
//                 Unit of Measure (UoM)
//               </label>
//               <div className="relative">
//                 <select
//                   id="unit_of_measure"
//                   {...register("attributes.unit_of_measure")}
//                   className="w-full bg-background border border-border/60 rounded text-xs font-bold pl-3 pr-8 h-10 text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
//                 >
//                   {UNIT_PRESETS.map((unit) => (
//                     <option key={unit.value} value={unit.value}>{unit.label}</option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3 top-3 text-muted/60 pointer-events-none" size={14} />
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* FOOTER CONTROLS ACTION BAR */}
//       <div className="px-6 py-4 bg-surface/20 border-t border-border/40 flex items-center justify-end gap-3">
//         <button
//           type="button"
//           onClick={onCancel}
//           disabled={isPending}
//           className="inline-flex items-center justify-center px-4 h-9 text-[10px] font-black uppercase tracking-wider text-muted hover:text-foreground rounded-lg border border-transparent transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//         >
//           Cancel
//         </button>
        
//         <button
//           type="submit"
//           disabled={isPending}
//           className="inline-flex items-center justify-center gap-1.5 px-4 h-9 text-[10px] font-black uppercase tracking-wider rounded-lg border border-transparent bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isPending ? (
//             <>
//               <Loader2 className="animate-spin" size={12} />
//               <span>Processing...</span>
//             </>
//           ) : (
//             <>
//               <Plus size={12} />
//               <span>{submitButtonText}</span>
//             </>
//           )}
//         </button>
//       </div>
//     </form>
//   );
// }

// src/features/inventory/AssetComposer.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

import { 
  Plus, 
  Layers, 
  DollarSign, 
  Tag, 
  Barcode,
  Package,
  Loader2,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_PRESETS = [
  "General",
  "Beverages & Drinks",
  "Food & Groceries",
  "Apparel & Clothing",
  "Electronics & Tech",
  "Hardware & Spares",
  "Health & Beauty",
  "Home & Kitchen Essentials",
  "Services & Subscriptions"
];

const UNIT_PRESETS = [
  { value: "pcs", label: "Pieces (PCS)" },
  { value: "kg", label: "Kilograms (KG)" },
  { value: "g", label: "Grams (G)" },
  { value: "l", label: "Liters (L)" },
  { value: "box", label: "Boxes (BOX)" },
  { value: "pack", label: "Packs (PCK)" }
];

export interface AssetFormValues {
  business_id?: string;
  label: string;
  selling_price: number;
  stock: number;
  category: string;
  attributes: {
    unit_of_measure: string;
    buying_price: number;
    sku: string;
  };
}

interface AssetComposerProps {
  onSubmit: (data: AssetFormValues, resetForm: () => void) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitButtonText?: string;
}

export function AssetComposer({ 
  onSubmit, 
  onCancel, 
  isPending = false,
  submitButtonText = "Save Product"
}: AssetComposerProps) {
  // 1. Pull the global context dynamically
  const { businessId } = useBusinessContext();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    defaultValues: {
      label: "",
      selling_price: 0,
      stock: 0,
      category: "General",
      attributes: {
        unit_of_measure: "pcs",
        buying_price: 0,
        sku: "",
      },
    }
  });

  const handleFormSubmit = (data: AssetFormValues) => {
    // 2. Generate custom automated SKU format: TWL-AUTO + 8-char string chunk + Epoch timestamp
    const businessIdString = Array.isArray(businessId) ? businessId[0] : businessId;
    const businessChunk = businessIdString ? businessIdString.replace(/-/g, "").slice(0, 8).toUpperCase() : "UNKNOWN";
    const computedSku = data.attributes.sku?.trim() !== "" 
      ? data.attributes.sku.trim() 
      : `TWL-AUTO-${businessChunk}-${Date.now()}`;

    // 3. Compose exact JSON data tree matching destination payload schema requirements explicitly
    const structuredPayload: AssetFormValues = {
      business_id: businessIdString || "",
      label: data.label.trim(),
      selling_price: Number(data.selling_price) || 0,
      stock: 0, // Enforced zero baseline rule protection
      category: data.category,
      attributes: {
        unit_of_measure: data.attributes.unit_of_measure,
        buying_price: Number(data.attributes.buying_price) || 0,
        sku: computedSku
      }
    };

    onSubmit(structuredPayload, () => reset());
  };

  return (
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className="w-full bg-card border border-border/40 rounded-xl shadow-xs overflow-hidden flex flex-col"
    >
      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/30">
            <Package size={16} className="text-brand-secondary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
              Identity & Parameters
            </h3>
          </div>

          <div className="space-y-2">
            <label htmlFor="label" className="block text-[10px] font-black uppercase tracking-widest text-muted">
              Product Label / Title <span className="text-brand-primary">*</span>
            </label>
            <input
              id="label"
              type="text"
              {...register("label", { required: "Product identifier is mandatory" })}
              placeholder="e.g., Premium Roasted Arabica Coffee"
              className={cn(
                "w-full bg-background border border-border/60 rounded text-xs font-bold font-mono h-10 px-3 text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface",
                errors.label && "border-brand-primary"
              )}
            />
            {errors.label && (
              <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mt-0.5">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                Category Placement
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 text-muted/60" size={14} />
                <select
                  id="category"
                  {...register("category")}
                  className="w-full bg-background border border-border/60 rounded text-xs font-bold pl-9 pr-8 h-10 text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
                >
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-muted/60 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="stock" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                Initial Stock Base
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-3 text-muted/40" size={14} />
                <input
                  id="stock"
                  type="number"
                  readOnly
                  value={0}
                  className="w-full bg-surface/50 border border-border/40 rounded text-xs font-bold font-mono pl-9 pr-3 h-10 text-muted cursor-not-allowed select-none focus:outline-none"
                  title="Stock counts must be altered using active Ledger entry points."
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 lg:border-l lg:border-border/30 lg:pl-8">
          <div className="flex items-center gap-2 pb-3 border-b border-border/30">
            <DollarSign size={16} className="text-brand-secondary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
              Financial & Logistics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="buying_price" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                Unit Cost Price (Buying)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted/60 font-mono">KES</span>
                <input
                  id="buying_price"
                  type="number"
                  step="any"
                  {...register("attributes.buying_price", { valueAsNumber: true })}
                  className="w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-11 pr-3 h-10 text-foreground focus:outline-none focus:border-brand-primary/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="selling_price" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                Unit Retail Price (Selling) <span className="text-brand-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[10px] font-bold text-muted/60 font-mono">KES</span>
                <input
                  id="selling_price"
                  type="number"
                  step="any"
                  {...register("selling_price", { valueAsNumber: true, required: "Selling price required" })}
                  className={cn(
                    "w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-11 pr-3 h-10 text-foreground focus:outline-none focus:border-brand-primary/40",
                    errors.selling_price && "border-brand-primary"
                  )}
                />
              </div>
              {errors.selling_price && (
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mt-0.5">
                  {errors.selling_price.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="sku" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                SKU / Barcode Identifier
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-3 text-muted/60" size={14} />
                <input
                  id="sku"
                  type="text"
                  {...register("attributes.sku")}
                  placeholder="Auto-generated if left empty"
                  className="w-full bg-background border border-border/60 rounded text-xs font-bold font-mono pl-9 pr-3 h-10 text-foreground placeholder:text-muted/40 placeholder:font-sans focus:outline-none focus:border-brand-primary/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="unit_of_measure" className="block text-[10px] font-black uppercase tracking-widest text-muted">
                Unit of Measure (UoM)
              </label>
              <div className="relative">
                <select
                  id="unit_of_measure"
                  {...register("attributes.unit_of_measure")}
                  className="w-full bg-background border border-border/60 rounded text-xs font-bold pl-3 pr-8 h-10 text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
                >
                  {UNIT_PRESETS.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-muted/60 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER CONTROLS ACTION BAR */}
      <div className="px-6 py-4 bg-surface/20 border-t border-border/40 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex items-center justify-center px-4 h-9 text-[10px] font-black uppercase tracking-wider text-muted hover:text-foreground rounded-lg border border-transparent transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-9 text-[10px] font-black uppercase tracking-wider rounded-lg border border-transparent bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={12} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Plus size={12} />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}