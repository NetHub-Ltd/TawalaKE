// "use client";

// import React, { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { ProductCreate } from "@/lib/api/generated/models/productCreate";
// import { Loader2 } from "lucide-react";

// export type ProductCategory = ProductCreate["category"];

// export const CATEGORIES = [
//   { id: "beverages", label: "Beverages & Drinks" },
//   { id: "packaged_foods", label: "Packaged Foods & Groceries" },
//   { id: "fresh_produce", label: "Fresh Produce & Grains" },
//   { id: "bakery", label: "Bakery & Confectionery" },
//   { id: "household", label: "Household & Cleaning" },
//   { id: "personal_care", label: "Personal Care & Toiletries" },
//   { id: "pharmacy", label: "Pharmacy & Medications" },
//   { id: "agrovet", label: "Agrovet & Farming Supplies" },
//   { id: "hardware", label: "Hardware & Tools" },
//   { id: "electrical", label: "Electrical & Electronics" },
//   { id: "clothing", label: "Clothing & Apparel" },
//   { id: "beauty", label: "Beauty & Cosmetics" },
//   { id: "food_service", label: "Fast Food & Restaurant Supplies" },
//   { id: "cooking_ingredients", label: "Cooking Ingredients & Spices" },
//   { id: "services", label: "Services & Labor" },
//   { id: "digital", label: "Digital Products & Airtime" },
//   { id: "other", label: "Other / Miscellaneous" },
// ] as const;

// export const UNITS = [
//   { value: "pcs", label: "Pieces (PCS)" },
//   { value: "pair", label: "Pairs (PR)" },
//   { value: "set", label: "Sets (SET)" },
//   { value: "dozen", label: "Dozens (DZN)" },
//   { value: "kg", label: "Kilograms (KG)" },
//   { value: "g", label: "Grams (G)" },
//   { value: "l", label: "Liters (L)" },
//   { value: "ml", label: "Milliliters (ML)" },
//   { value: "box", label: "Box" },
//   { value: "pack", label: "Pack" },
//   { value: "carton", label: "Carton" },
//   { value: "bag", label: "Bag / Sack" },
//   { value: "m", label: "Meters (M)" },
//   { value: "unit", label: "Unit" },
//   { value: "other", label: "Other Unit" },
// ] as const;

// type ProductForm = ProductCreate;

// interface AssetComposerProps {
//   initialData?: Partial<ProductForm> | null;
//   onSubmit: (data: ProductForm) => Promise<void>;
//   onCancel: () => void;
//   isPending?: boolean;
// }

// export function AssetComposer({
//   initialData,
//   onSubmit,
//   onCancel,
//   isPending = false,
// }: AssetComposerProps) {
//   const { businessId } = useBusinessContext();

//   const businessIdString = React.useMemo(() => {
//     return (Array.isArray(businessId) ? businessId[0] : businessId) || "";
//   }, [businessId]);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<ProductForm>({
//     defaultValues: {
//       label: "",
//       selling_price: undefined,
//       stock: 0,
//       category: "other",
//       attributes: {
//         unit_of_measure: "pcs",
//         buying_price: undefined,
//         sku: "",
//       },
//     },
//     mode: "onBlur",
//   });

//   useEffect(() => {
//     if (initialData) {
//       reset({
//         label: initialData.label || "",
//         selling_price: initialData.selling_price,
//         stock: initialData.stock ?? 0,
//         category: initialData.category || "other",
//         attributes: {
//           unit_of_measure: initialData.attributes?.unit_of_measure || "pcs",
//           buying_price: initialData.attributes?.buying_price,
//           sku: initialData.attributes?.sku || "",
//         },
//       });
//     }
//   }, [initialData, reset]);

//   const onFormSubmit = async (data: ProductForm) => {
//     const trimmedLabel = data.label?.trim();
//     if (!trimmedLabel) return;

//     const payload: ProductForm = {
//       business_id: businessIdString,
//       label: trimmedLabel,
//       selling_price: Number(data.selling_price),
//       stock: Number(data.stock) || 0,
//       category: data.category,
//       attributes: {
//         unit_of_measure: data.attributes?.unit_of_measure || "pcs",
//         buying_price: Number(data.attributes?.buying_price) || 0,
//         sku: data.attributes?.sku?.trim() || "",
//       },
//     };

//     try {
//       await onSubmit(payload);
//       if (!initialData) {
//         reset();
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const isLoading = isPending || isSubmitting;

//   return (
//     <form
//       onSubmit={handleSubmit(onFormSubmit)}
//       className="w-full bg-card rounded-2xl border border-border text-foreground"
//       noValidate
//     >
//       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
//         {/* Product Label */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Product Label *
//           </label>
//           <input
//             {...register("label", {
//               required: "Required",
//               validate: (v) => (v?.trim().length ?? 0) > 0 || "Cannot be empty spaces",
//             })}
//             type="text"
//             className={`h-11 px-3 border rounded-xl bg-background text-sm outline-none transition-colors duration-150 ${
//               errors.label ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
//             }`}
//           />
//           {errors.label && (
//             <span className="text-destructive text-xs font-medium">{errors.label.message}</span>
//           )}
//         </div>

//         {/* Category */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Category
//           </label>
//           <select
//             {...register("category")}
//             className="h-11 px-3 border border-border bg-background rounded-xl text-sm font-semibold outline-none focus:border-brand-primary transition-colors duration-150"
//           >
//             {CATEGORIES.map((cat) => (
//               <option key={cat.id} value={cat.id}>
//                 {cat.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Initial Stock */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Initial Stock
//           </label>
//           <input
//             type="number"
//             {...register("stock", {
//               valueAsNumber: true,
//               min: { value: 0, message: "Cannot be negative" },
//             })}
//             className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
//               errors.stock ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
//             }`}
//           />
//           {errors.stock && (
//             <span className="text-destructive text-xs font-medium">{errors.stock.message}</span>
//           )}
//         </div>

//         {/* Unit Cost Price */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Unit Cost Price (KES)
//           </label>
//           <input
//             type="number"
//             step="0.01"
//             {...register("attributes.buying_price", {
//               valueAsNumber: true,
//               min: { value: 0, message: "Cannot be negative" },
//             })}
//             className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
//               errors.attributes?.buying_price ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
//             }`}
//           />
//           {errors.attributes?.buying_price && (
//             <span className="text-destructive text-xs font-medium">{errors.attributes.buying_price.message}</span>
//           )}
//         </div>

//         {/* Unit Retail Price */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Unit Retail Price *
//           </label>
//           <input
//             type="number"
//             step="0.01"
//             {...register("selling_price", {
//               required: "Required",
//               min: { value: 0.01, message: "Must be greater than 0" },
//               valueAsNumber: true,
//             })}
//             className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
//               errors.selling_price ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
//             }`}
//           />
//           {errors.selling_price && (
//             <span className="text-destructive text-xs font-medium">{errors.selling_price.message}</span>
//           )}
//         </div>

//         {/* SKU / Barcode */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             SKU / Barcode
//           </label>
//           <input
//             type="text"
//             {...register("attributes.sku")}
//             className="h-11 px-3 border border-border bg-background rounded-xl text-sm font-mono outline-none focus:border-brand-primary transition-colors duration-150"
//           />
//         </div>

//         {/* Unit of Measure */}
//         <div className="flex flex-col gap-1.5 md:col-span-2">
//           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
//             Unit of Measure
//           </label>
//           <select
//             {...register("attributes.unit_of_measure")}
//             className="h-11 px-3 border border-border bg-background rounded-xl text-sm font-semibold outline-none focus:border-brand-primary transition-colors duration-150"
//           >
//             {UNITS.map((unit) => (
//               <option key={unit.value} value={unit.value}>
//                 {unit.label}
//               </option>
//             ))}
//           </select>
//         </div>

//       </div>

//       {/* Action Footer: No active:scale, completely decoupled from layout updates */}
//       <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-4 bg-muted/20">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150 px-4 h-10 rounded-xl"
//         >
//           Cancel
//         </button>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold uppercase text-xs tracking-wider px-5 h-10 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
//         >
//           {isLoading && <Loader2 className="animate-spin" size={14} />}
//           <span>{isLoading ? "Saving..." : !!initialData ? "Update Product" : "Save Product"}</span>
//         </button>
//       </div>
//     </form>
//   );
// }

"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";
import { Loader2 } from "lucide-react";

export type ProductCategory = ProductCreate["category"];

export const CATEGORIES = [
  { id: "beverages", label: "Beverages & Drinks" },
  { id: "packaged_foods", label: "Packaged Foods & Groceries" },
  { id: "fresh_produce", label: "Fresh Produce & Grains" },
  { id: "bakery", label: "Bakery & Confectionery" },
  { id: "household", label: "Household & Cleaning" },
  { id: "personal_care", label: "Personal Care & Toiletries" },
  { id: "pharmacy", label: "Pharmacy & Medications" },
  { id: "agrovet", label: "Agrovet & Farming Supplies" },
  { id: "hardware", label: "Hardware & Tools" },
  { id: "electrical", label: "Electrical & Electronics" },
  { id: "clothing", label: "Clothing & Apparel" },
  { id: "beauty", label: "Beauty & Cosmetics" },
  { id: "food_service", label: "Fast Food & Restaurant Supplies" },
  { id: "cooking_ingredients", label: "Cooking Ingredients & Spices" },
  { id: "services", label: "Services & Labor" },
  { id: "digital", label: "Digital Products & Airtime" },
  { id: "other", label: "Other / Miscellaneous" },
] as const;

export const UNITS = [
  { value: "pcs", label: "Pieces (PCS)" },
  { value: "pair", label: "Pairs (PR)" },
  { value: "set", label: "Sets (SET)" },
  { value: "dozen", label: "Dozens (DZN)" },
  { value: "kg", label: "Kilograms (KG)" },
  { value: "g", label: "Grams (G)" },
  { value: "l", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ML)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "carton", label: "Carton" },
  { value: "bag", label: "Bag / Sack" },
  { value: "m", label: "Meters (M)" },
  { value: "unit", label: "Unit" },
  { value: "other", label: "Other Unit" },
] as const;

type ProductForm = ProductCreate;

interface AssetComposerProps {
  initialData?: Partial<ProductForm> | null;
  onSubmit: (data: ProductForm) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

export function AssetComposer({
  initialData,
  onSubmit,
  onCancel,
  isPending = false,
}: AssetComposerProps) {
  const { businessId } = useBusinessContext();

  const businessIdString = React.useMemo(() => {
    return (Array.isArray(businessId) ? businessId[0] : businessId) || "";
  }, [businessId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProductForm>({
    defaultValues: {
      label: "",
      selling_price: undefined,
      stock: 0,
      category: "other",
      attributes: {
        unit_of_measure: "pcs",
        buying_price: undefined,
        sku: "",
      },
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      reset({
        label: initialData.label || "",
        selling_price: initialData.selling_price,
        stock: initialData.stock ?? 0,
        category: initialData.category || "other",
        attributes: {
          unit_of_measure: initialData.attributes?.unit_of_measure || "pcs",
          buying_price: initialData.attributes?.buying_price,
          sku: initialData.attributes?.sku || "",
        },
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: ProductForm) => {
    const trimmedLabel = data.label?.trim();
    if (!trimmedLabel) return;

    const generatedSku = data.attributes?.sku?.trim() 
      || `TWL-AUTO-${businessIdString.slice(0, 8).toUpperCase()}-${Date.now()}`;

    const payload: ProductForm = {
      business_id: businessIdString,
      label: trimmedLabel,
      selling_price: Number(data.selling_price),
      stock: Number(data.stock) || 0,
      category: data.category,
      attributes: {
        unit_of_measure: data.attributes?.unit_of_measure || "pcs",
        buying_price: Number(data.attributes?.buying_price) || 0,
        sku: generatedSku,
      },
    };

    try {
      await onSubmit(payload);
      if (!initialData) {
        reset();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isLoading = isPending || isSubmitting;

  return (
    <>
      {/* Visual Submission Overlay Modal */}
      {isLoading && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200"
          role="alert"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border shadow-xl">
            <Loader2 className="animate-spin text-brand-primary" size={32} />
            <p className="text-sm font-bold uppercase tracking-wider text-foreground">
              Processing Transaction...
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="w-full bg-card rounded-2xl border border-border text-foreground transition-shadow duration-200"
        noValidate
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Product Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Label *
            </label>
            <input
              {...register("label", {
                required: "Required",
                validate: (v) => (v?.trim().length ?? 0) > 0 || "Cannot be empty spaces",
              })}
              type="text"
              className={`h-11 px-3 border rounded-xl bg-background text-sm outline-none transition-colors duration-150 ${
                errors.label ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
              }`}
            />
            {errors.label && (
              <span className="text-destructive text-xs font-medium">{errors.label.message}</span>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Category
            </label>
            <select
              {...register("category")}
              className="h-11 px-3 border border-border bg-background rounded-xl text-sm font-semibold outline-none focus:border-brand-primary transition-colors duration-150"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Initial Stock
            </label>
            <input
              type="number"
              {...register("stock", {
                valueAsNumber: true,
                min: { value: 0, message: "Cannot be negative" },
              })}
              className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
                errors.stock ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
              }`}
            />
            {errors.stock && (
              <span className="text-destructive text-xs font-medium">{errors.stock.message}</span>
            )}
          </div>

          {/* Unit Cost Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Unit Cost Price (KES)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("attributes.buying_price", {
                valueAsNumber: true,
                min: { value: 0, message: "Cannot be negative" },
              })}
              className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
                errors.attributes?.buying_price ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
              }`}
            />
            {errors.attributes?.buying_price && (
              <span className="text-destructive text-xs font-medium">{errors.attributes.buying_price.message}</span>
            )}
          </div>

          {/* Unit Retail Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Unit Retail Price *
            </label>
            <input
              type="number"
              step="0.01"
              {...register("selling_price", {
                required: "Required",
                min: { value: 0.01, message: "Must be greater than 0" },
                valueAsNumber: true,
              })}
              className={`h-11 px-3 border rounded-xl bg-background text-sm font-mono ${
                errors.selling_price ? "border-destructive focus:border-destructive" : "border-border focus:border-brand-primary"
              }`}
            />
            {errors.selling_price && (
              <span className="text-destructive text-xs font-medium">{errors.selling_price.message}</span>
            )}
          </div>

          {/* Unit of Measure */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Unit of Measure
            </label>
            <select
              {...register("attributes.unit_of_measure")}
              className="h-11 px-3 border border-border bg-background rounded-xl text-sm font-semibold outline-none focus:border-brand-primary transition-colors duration-150"
            >
              {UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-4 bg-muted/20">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150 px-4 h-10 rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold uppercase text-xs tracking-wider px-5 h-10 rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading && <Loader2 className="animate-spin" size={14} />}
            <span>{isLoading ? "Saving..." : !!initialData ? "Update Product" : "Save Product"}</span>
          </button>
        </div>
      </form>
    </>
  );
}