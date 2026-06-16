// "use client";

// import React from "react"; // Removed useEffect from imports
// import { useForm } from "react-hook-form";
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

// // Industry standard domain presets
// const CATEGORY_PRESETS = [
//   "General",
//   "Apparel & Clothing",
//   "Beverages",
//   "Electronics",
//   "Food & Groceries",
//   "Hardware & Tools",
//   "Health & Beauty",
//   "Home Goods",
//   "Services"
// ];

// const UNIT_PRESETS = [
//   { value: "pcs", label: "Pieces (PCS)" },
//   { value: "kg", label: "Kilograms (KG)" },
//   { value: "g", label: "Grams (G)" },
//   { value: "l", label: "Liters (L)" },
//   { value: "mm", label: "MilliMeters (MM)" },
//   { value: "box", label: "Boxes (BOX)" },
//   { value: "pack", label: "Packs (PCK)" },
//   { value: "mtrs", label: "Meters (MTRS)" }
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
//   initialData?: AssetFormValues;
//   onSubmit: (data: AssetFormValues) => void;
//   onCancel: () => void;
//   isPending?: boolean;
//   submitButtonText?: string;
// }

// const defaultValues: AssetFormValues = {
//   label: "",
//   selling_price: 0,
//   stock: 0,
//   category: "General",
//   attributes: {
//     unit_of_measure: "pcs",
//     buying_price: 0,
//     sku: "",
//   },
// };

// export function AssetComposer({ 
//   initialData, 
//   onSubmit, 
//   onCancel, 
//   isPending = false,
//   submitButtonText = "Save Product"
// }: AssetComposerProps) {
  
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<AssetFormValues>({
//     defaultValues: defaultValues,
//     // ✨ FIX: This forces react-hook-form to stay deeply reactive to asynchronous data modifications,
//     // bypassing cache locks and ensuring modified keystrokes are registered upon submission.
//     values: initialData, 
//   });

//   const handleFormSubmit = (data: AssetFormValues) => {
//     const processedData = {
//       ...data,
//       attributes: {
//         ...data.attributes,
//         sku: data.attributes.sku?.trim() !== "" 
//           ? data.attributes.sku.trim() 
//           : `TW-AUTO-${Date.now().toString().slice(-6)}`
//       }
//     };
//     console.log("processed AssetComposer submit values", processedData);
//     onSubmit(processedData);
//   };

//   return (
//     <form 
//       onSubmit={handleSubmit(handleFormSubmit)} 
//       className="w-full bg-card border border-border rounded-2xl shadow-soft overflow-hidden flex flex-col h-full"
//     >
//       {/* Scroll-contained Desktop Double Columns */}
//       <div className="flex-1 overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
//         {/* LEFT COLUMN: Identity & Inventory Mechanics */}
//         <div className="space-y-6">
//           <div className="flex items-center gap-2 pb-3 border-b border-border">
//             <Package size={18} className="text-primary" />
//             <h2 className="text-base font-bold text-foreground uppercase tracking-tight">Identity & Parameters</h2>
//           </div>

//           {/* Product Title Field */}
//           <div className="space-y-2">
//             <label htmlFor="label" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//               Product Label / Title <span className="text-destructive">*</span>
//             </label>
//             <input
//               id="label"
//               type="text"
//               {...register("label", { required: "Product identifier is mandatory" })}
//               placeholder="e.g., Premium Roasted Arabica Coffee (Dark Blend)"
//               className={cn(
//                 "w-full bg-background/50 border border-border rounded-xl h-12 px-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-secondary/40",
//                 errors.label && "border-destructive focus:border-destructive focus:ring-destructive"
//               )}
//             />
//             {errors.label && (
//               <p className="text-xs font-semibold text-destructive mt-1">{errors.label.message}</p>
//             )}
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {/* Category Placement Select input */}
//             <div className="space-y-2">
//               <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 Category Placement
//               </label>
//               <div className="relative">
//                 <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" size={16} />
//                 <select
//                   id="category"
//                   {...register("category")}
//                   className="w-full bg-background/50 border border-border rounded-xl h-12 pl-10 pr-10 text-sm font-medium appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:border-secondary/40"
//                 >
//                   {CATEGORY_PRESETS.map((cat) => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" size={16} />
//               </div>
//             </div>

//             {/* Current Stock Count Input */}
//             <div className="space-y-2">
//               <label htmlFor="stock" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 Current On-Hand Stock
//               </label>
//               <div className="relative">
//                 <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" size={16} />
//                 <input
//                   id="stock"
//                   type="number"
//                   min="0"
//                   {...register("stock", { valueAsNumber: true, required: true })}
//                   className="w-full bg-background/50 border border-border rounded-xl h-12 pl-10 pr-4 text-sm font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-secondary/40"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN: Financial Metrics & Logistical Identifiers */}
//         <div className="space-y-6 lg:border-l lg:border-border lg:pl-8">
//           <div className="flex items-center gap-2 pb-3 border-b border-border">
//             <DollarSign size={18} className="text-primary" />
//             <h2 className="text-base font-bold text-foreground uppercase tracking-tight">Financial & Logistics</h2>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {/* Buying Price Input */}
//             <div className="space-y-2">
//               <label htmlFor="buying_price" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 Unit Cost Price (Buying)
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">KSH</span>
//                 <input
//                   id="buying_price"
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   {...register("attributes.buying_price", { valueAsNumber: true })}
//                   className="w-full bg-background/50 border border-border rounded-xl h-12 pl-12 pr-4 text-sm font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-secondary/40"
//                 />
//               </div>
//             </div>

//             {/* Retail Selling Price Input */}
//             <div className="space-y-2">
//               <label htmlFor="selling_price" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 Unit Retail Price (Selling) <span className="text-destructive">*</span>
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">KSH</span>
//                 <input
//                   id="selling_price"
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   {...register("selling_price", { valueAsNumber: true, required: "Selling price configuration needed" })}
//                   className={cn(
//                     "w-full bg-background/50 border border-border rounded-xl h-12 pl-12 pr-4 text-sm font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-secondary/40",
//                     errors.selling_price && "border-destructive focus:border-destructive focus:ring-destructive"
//                   )}
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {/* SKU Input Field */}
//             <div className="space-y-2">
//               <label htmlFor="sku" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 SKU / Barcode Identifier
//               </label>
//               <div className="relative">
//                 <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" size={16} />
//                 <input
//                   id="sku"
//                   type="text"
//                   {...register("attributes.sku")}
//                   placeholder="Auto-generated if empty"
//                   className="w-full bg-background/50 border border-border rounded-xl h-12 pl-10 pr-4 text-sm font-medium placeholder:text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all hover:border-secondary/40"
//                 />
//               </div>
//             </div>

//             {/* Unit of Measure Select Input */}
//             <div className="space-y-2">
//               <label htmlFor="unit_of_measure" className="block text-xs font-bold uppercase tracking-wider text-secondary">
//                 Unit of Measure (UoM)
//               </label>
//               <div className="relative">
//                 <select
//                   id="unit_of_measure"
//                   {...register("attributes.unit_of_measure")}
//                   className="w-full bg-background/50 border border-border rounded-xl h-12 pl-4 pr-10 text-sm font-medium appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:border-secondary/40"
//                 >
//                   {UNIT_PRESETS.map((unit) => (
//                     <option key={unit.value} value={unit.value}>{unit.label}</option>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" size={16} />
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* FIXED FOOTER CONTROLS ACTION BAR */}
//       <div className="px-6 py-4 lg:px-8 bg-background/60 backdrop-blur-sm border-t border-border flex items-center justify-end gap-3 shrink-0">
//         <button
//           type="button"
//           onClick={onCancel}
//           disabled={isPending}
//           className="h-11 px-5 rounded-xl text-sm font-semibold text-secondary hover:text-foreground hover:bg-background transition-all focus-visible:outline-none cursor-pointer"
//         >
//           Cancel
//         </button>
        
//         <button
//           type="submit"
//           disabled={isPending}
//           className="h-11 px-6 bg-primary text-white font-bold rounded-xl text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 focus-visible:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isPending ? (
//             <>
//               <Loader2 className="animate-spin" size={16} />
//               <span>Processing...</span>
//             </>
//           ) : (
//             <>
//               <Plus size={16} />
//               <span>{submitButtonText}</span>
//             </>
//           )}
//         </button>
//       </div>
//     </form>
//   );
// }

"use client";

import React from "react";
import { useForm } from "react-hook-form";
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
  "Apparel & Clothing",
  "Beverages",
  "Electronics",
  "Food & Groceries",
  "Hardware & Tools",
  "Health & Beauty",
  "Home Goods",
  "Services"
];

const UNIT_PRESETS = [
  { value: "pcs", label: "Pieces (PCS)" },
  { value: "kg", label: "Kilograms (KG)" },
  { value: "g", label: "Grams (G)" },
  { value: "l", label: "Liters (L)" },
  { value: "mm", label: "MilliMeters (MM)" },
  { value: "box", label: "Boxes (BOX)" },
  { value: "pack", label: "Packs (PCK)" },
  { value: "mtrs", label: "Meters (MTRS)" }
];

export interface AssetFormValues {
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
  initialData?: AssetFormValues;
  onSubmit: (data: AssetFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitButtonText?: string;
}

const defaultValues: AssetFormValues = {
  label: "",
  selling_price: 0,
  stock: 0,
  category: "General",
  attributes: {
    unit_of_measure: "pcs",
    buying_price: 0,
    sku: "",
  },
};

export function AssetComposer({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isPending = false,
  submitButtonText = "Save Product"
}: AssetComposerProps) {
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormValues>({
    defaultValues: defaultValues,
    values: initialData, 
  });

  const handleFormSubmit = (data: AssetFormValues) => {
    const processedData = {
      ...data,
      attributes: {
        ...data.attributes,
        sku: data.attributes.sku?.trim() !== "" 
          ? data.attributes.sku.trim() 
          : `TW-AUTO-${Date.now().toString().slice(-6)}`
      }
    };
    onSubmit(processedData);
  };

  return (
    // Grounded Visual Matrix Container - Reduced elevation shadow, relying on structured border contrast
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className="w-full bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden flex flex-col h-full"
    >
      {/* Scrollable Form Layout Grid */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* LEFT COLUMN: Identity & Inventory Mechanics */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Package size={18} className="text-brand-primary" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              Identity & Parameters
            </h3>
          </div>

          {/* Product Title Input */}
          <div className="space-y-2">
            <label htmlFor="label" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Product Label / Title <span className="text-brand-primary" aria-hidden="true">*</span>
            </label>
            <input
              id="label"
              type="text"
              aria-required="true"
              aria-invalid={errors.label ? "true" : "false"}
              aria-describedby={errors.label ? "label-error" : undefined}
              {...register("label", { required: "Product identifier is mandatory" })}
              placeholder="e.g., Premium Roasted Arabica Coffee (Dark Blend)"
              className={cn(
                "w-full bg-background/50 border border-border/60 rounded-xl h-12 px-4 text-sm font-medium focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all hover:border-border",
                errors.label && "border-destructive focus:border-destructive focus:ring-destructive"
              )}
            />
            {errors.label && (
              <p id="label-error" className="text-xs font-semibold text-destructive mt-1">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Placement Selection */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Category Placement
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <select
                  id="category"
                  {...register("category")}
                  className="w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-10 pr-10 text-sm font-medium appearance-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all cursor-pointer hover:border-border"
                >
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
              </div>
            </div>

            {/* Current Stock Count Input */}
            <div className="space-y-2">
              <label htmlFor="stock" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Current On-Hand Stock
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  id="stock"
                  type="number"
                  min="0"
                  {...register("stock", { valueAsNumber: true, required: true })}
                  className="w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-10 pr-4 text-sm font-medium tabular-nums focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all hover:border-border"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Metrics & Logistical Identifiers */}
        <div className="space-y-6 lg:border-l lg:border-border/40 lg:pl-8">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <DollarSign size={18} className="text-brand-primary" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              Financial & Logistics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buying Price Input */}
            <div className="space-y-2">
              <label htmlFor="buying_price" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Unit Cost Price (Buying)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">KSH</span>
                <input
                  id="buying_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("attributes.buying_price", { valueAsNumber: true })}
                  className="w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-12 pr-4 text-sm font-medium tabular-nums focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all hover:border-border"
                />
              </div>
            </div>

            {/* Retail Selling Price Input */}
            <div className="space-y-2">
              <label htmlFor="selling_price" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Unit Retail Price (Selling) <span className="text-brand-primary" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">KSH</span>
                <input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  aria-required="true"
                  aria-invalid={errors.selling_price ? "true" : "false"}
                  aria-describedby={errors.selling_price ? "selling-price-error" : undefined}
                  {...register("selling_price", { valueAsNumber: true, required: "Selling price configuration needed" })}
                  className={cn(
                    "w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-12 pr-4 text-sm font-medium tabular-nums focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all hover:border-border",
                    errors.selling_price && "border-destructive focus:border-destructive focus:ring-destructive"
                  )}
                />
              </div>
              {errors.selling_price && (
                <p id="selling-price-error" className="text-xs font-semibold text-destructive mt-1">
                  {errors.selling_price.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU Input Field */}
            <div className="space-y-2">
              <label htmlFor="sku" className="block text-xs font-bold uppercase tracking-wider text-muted">
                SKU / Barcode Identifier
              </label>
              <div className="relative">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  id="sku"
                  type="text"
                  {...register("attributes.sku")}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-10 pr-4 text-sm font-medium placeholder:text-muted/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all hover:border-border"
                />
              </div>
            </div>

            {/* Unit of Measure Select Input */}
            <div className="space-y-2">
              <label htmlFor="unit_of_measure" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Unit of Measure (UoM)
              </label>
              <div className="relative">
                <select
                  id="unit_of_measure"
                  {...register("attributes.unit_of_measure")}
                  className="w-full bg-background/50 border border-border/60 rounded-xl h-12 pl-4 pr-10 text-sm font-medium appearance-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all cursor-pointer hover:border-border"
                >
                  {UNIT_PRESETS.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FIXED FOOTER CONTROLS ACTION BAR */}
      <div className="px-6 py-4 lg:px-8 bg-background/60 backdrop-blur-xs border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="h-11 px-5 rounded-xl text-sm font-semibold text-muted hover:text-foreground hover:bg-background/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isPending}
          className="h-11 px-6 bg-brand-primary text-white font-bold rounded-xl text-sm shadow-xs hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}