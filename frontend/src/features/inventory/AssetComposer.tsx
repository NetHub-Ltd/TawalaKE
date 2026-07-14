// "use client";

// import React from "react";
// import { useForm } from "react-hook-form";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { Button } from "@/lib/components/ui/Button";

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

// export interface CategoryPresetItem {
//   id: string;
//   label: string;
//   industryGroup: 'Retail & Minimart' | 'Pharmacy & Agrovet' | 'Hardware & Electronics' | 'Apparel, Beauty & Branding' | 'Food & Hospitality' | 'Services & General';
// }

// export const CATEGORY_PRESETS: CategoryPresetItem[] = [
//   // == Retail, Minimarts & Wholesalers ==
//   { id: "beverages", label: "Beverages & Drinks", industryGroup: "Retail & Minimart" },
//   { id: "packaged_foods", label: "Packaged Foods & Groceries", industryGroup: "Retail & Minimart" },
//   { id: "fresh_produce", label: "Fresh Produce & Grains", industryGroup: "Retail & Minimart" },
//   { id: "bakery_confectionery", label: "Bakery & Confectionery", industryGroup: "Retail & Minimart" },
//   { id: "household_cleaning", label: "Household Cleaning & Detergents", industryGroup: "Retail & Minimart" },
//   { id: "personal_care", label: "Personal Toiletries & Care", industryGroup: "Retail & Minimart" },

//   // == Pharmacies & Agrovets ==
//   { id: "prescription_meds", label: "Prescription Medications (POM)", industryGroup: "Pharmacy & Agrovet" },
//   { id: "otc_meds", label: "Over-The-Counter (OTC) Drugs", industryGroup: "Pharmacy & Agrovet" },
//   { id: "medical_supplies", label: "Medical Supplies & First Aid", industryGroup: "Pharmacy & Agrovet" },
//   { id: "supplements_vitamins", label: "Supplements & Vitamins", industryGroup: "Pharmacy & Agrovet" },
//   { id: "animal_feed", label: "Animal Feeds & Nutrition", industryGroup: "Pharmacy & Agrovet" },
//   { id: "crop_protection", label: "Agrochemicals & Crop Protection", industryGroup: "Pharmacy & Agrovet" },
//   { id: "veterinary_meds", label: "Veterinary Drugs & Care", industryGroup: "Pharmacy & Agrovet" },

//   // == Hardwares & Electronics ==
//   { id: "construction_materials", label: "Cement, Sand & Materials", industryGroup: "Hardware & Electronics" },
//   { id: "plumbing_fixtures", label: "Plumbing Pipes & Fixtures", industryGroup: "Hardware & Electronics" },
//   { id: "electrical_wiring", label: "Electrical Fittings & Cables", industryGroup: "Hardware & Electronics" },
//   { id: "hand_power_tools", label: "Hand & Power Tools", industryGroup: "Hardware & Electronics" },
//   { id: "paints_coatings", label: "Paints, Thinners & Coatings", industryGroup: "Hardware & Electronics" },
//   { id: "fasteners_hardware", label: "Nails, Screws & Fasteners", industryGroup: "Hardware & Electronics" },
//   { id: "phones_accessories", label: "Mobile Phones & Accessories", industryGroup: "Hardware & Electronics" },

//   // == Apparel, Beauty & Branding (Clean Target Verticals) ==
//   { id: "clothing_apparel", label: "Clothing & Apparel", industryGroup: "Apparel, Beauty & Branding" },
//   { id: "footwear", label: "Footwear & Shoes", industryGroup: "Apparel, Beauty & Branding" },
//   { id: "dtf_printing_branding", label: "DTF Printing & Branding Supplies", industryGroup: "Apparel, Beauty & Branding" },
//   { id: "barber_salon_services", label: "Barbershop & Beauty Salon Items", industryGroup: "Apparel, Beauty & Branding" },
//   { id: "cosmetics_makeup", label: "Cosmetics & Makeup Products", industryGroup: "Apparel, Beauty & Branding" },

//   // == Restaurants & Food Hospitality ==
//   { id: "cooked_meals", label: "Prepared Food & Hot Meals", industryGroup: "Food & Hospitality" },
//   { id: "fast_food_snacks", label: "Fast Foods & Snacks", industryGroup: "Food & Hospitality" },
//   { id: "cooking_ingredients", label: "Bulk Cooking Oils & Spices", industryGroup: "Food & Hospitality" },

//   // == Services & Subscriptions ==
//   { id: "professional_services", label: "Billable Labor & Services", industryGroup: "Services & General" },
//   { id: "digital_goods", label: "Airtime, Tokens & Digital Products", industryGroup: "Services & General" },
//   { id: "other_category", label: "Other / Unlisted Industry Category", industryGroup: "Services & General" }
// ];

// export interface UnitPresetItem {
//   value: string;
//   label: string;
//   category: 'Count' | 'Weight' | 'Volume' | 'Packaging & Wholesale' | 'Measurement' | 'Other';
// }

// export const UNIT_PRESETS: UnitPresetItem[] = [
//   // == Discrete Item Counting Units ==
//   { value: "pcs", label: "Pieces (PCS)", category: "Count" },
//   { value: "pair", label: "Pairs (PR)", category: "Count" },
//   { value: "set", label: "Sets (SET)", category: "Count" },
//   { value: "strip", label: "Strips (STP)", category: "Count" },
//   { value: "unit", label: "Individual Units (UNT)", category: "Count" },

//   // == Weight Measurement Units ==
//   { value: "kg", label: "Kilograms (KG)", category: "Weight" },
//   { value: "g", label: "Grams (G)", category: "Weight" },
//   { value: "ton", label: "Metric Tons (TON)", category: "Weight" },

//   // == Fluid and Liquid Volume Units ==
//   { value: "l", label: "Liters (L)", category: "Volume" },
//   { value: "ml", label: "Milliliters (ML)", category: "Volume" },

//   // == Industrial / Construction Specific Measurements ==
//   { value: "m", label: "Meters (M)", category: "Measurement" },
//   { value: "ft", label: "Feet (FT)", category: "Measurement" },
//   { value: "sqm", label: "Square Meters (SQM)", category: "Measurement" },

//   // == Bulk Logistics / Storage Packaging Units ==
//   { value: "box", label: "Boxes (BOX)", category: "Packaging & Wholesale" },
//   { value: "pack", label: "Packs (PCK)", category: "Packaging & Wholesale" },
//   { value: "carton", label: "Cartons (CTN)", category: "Packaging & Wholesale" },
//   { value: "crate", label: "Crates (CRT)", category: "Packaging & Wholesale" },
//   { value: "bale", label: "Bales (BAL)", category: "Packaging & Wholesale" },
//   { value: "bag_sack", label: "Bags / Sacks (BAG)", category: "Packaging & Wholesale" },
//   { value: "roll", label: "Rolls (ROL)", category: "Packaging & Wholesale" },
//   { value: "dozen", label: "Dozens (DZN)", category: "Packaging & Wholesale" },

//   // == Fallback ==
//   { value: "other", label: "Other Unit Measure", category: "Other" }
// ];

// export interface AssetFormValues {
//   business_id?: string;
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
//   initialData?: Partial<AssetFormValues>;
//   onSubmit: (data: AssetFormValues, resetForm: () => void) => void;
//   onCancel: () => void;
//   isPending?: boolean;
//   submitButtonText?: string;
// }

// export function AssetComposer({ 
//   initialData,
//   onSubmit, 
//   onCancel, 
//   isPending = false,
//   submitButtonText = "Save Product"
// }: AssetComposerProps) {
//   const { businessId } = useBusinessContext();
  
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
//       category: "general_inventory",
//       attributes: {
//         unit_of_measure: "pcs",
//         buying_price: 0,
//         sku: "",
//       },
//       ...initialData,
//     }
//   });

//   const handleFormSubmit = (data: AssetFormValues) => {
//     const businessIdString = Array.isArray(businessId) ? businessId[0] : businessId;
//     const businessChunk = businessIdString ? businessIdString.replace(/-/g, "").slice(0, 8).toUpperCase() : "UNKNOWN";
//     const computedSku = data.attributes.sku?.trim() !== "" 
//       ? data.attributes.sku.trim() 
//       : `TWL-AUTO-${businessChunk}-${Date.now()}`;

//     const structuredPayload: AssetFormValues = {
//       business_id: businessIdString || "",
//       label: data.label.trim(),
//       selling_price: Number(data.selling_price) || 0,
//       stock: Number(data.stock) || 0, 
//       category: data.category,
//       attributes: {
//         unit_of_measure: data.attributes.unit_of_measure,
//         buying_price: Number(data.attributes.buying_price) || 0,
//         sku: computedSku
//       }
//     };

//     onSubmit(structuredPayload, () => reset());
//   };

//   const industryGroups = Array.from(new Set(CATEGORY_PRESETS.map(c => c.industryGroup)));
//   const unitCategories = Array.from(new Set(UNIT_PRESETS.map(u => u.category)));

//   return (
//     <form 
//       onSubmit={handleSubmit(handleFormSubmit)} 
//       className="w-full card-layered overflow-hidden flex flex-col"
//     >
//       <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        
//         {/* LEFT COLUMN */}
//         <div className="space-y-6">
//           <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
//             <Package size={18} className="text-brand-primary" />
//             <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
//               Identity & Parameters
//             </h3>
//           </div>

//           <div className="space-y-2">
//             <label htmlFor="label" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//               Product Label / Title <span className="text-brand-primary">*</span>
//             </label>
//             <input
//               id="label"
//               type="text"
//               {...register("label", { required: "Product identifier is mandatory" })}
//               placeholder="e.g., Premium Roasted Arabica Coffee"
//               className={cn(
//                 "w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold h-12 px-4 text-foreground placeholder:text-muted/50 transition-all focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 disabled:bg-surface/50",
//                 errors.label && "border-brand-primary focus:ring-brand-primary/20"
//               )}
//             />
//             {errors.label && (
//               <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
//                 {errors.label.message}
//               </p>
//             )}
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//             <div className="space-y-2">
//               <label htmlFor="category" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 Category Placement
//               </label>
//               <div className="relative">
//                 <Tag className="absolute left-3.5 top-3.5 text-muted" size={16} />
//                 <select
//                   id="category"
//                   {...register("category")}
//                   className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold pl-11 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
//                 >
//                   {industryGroups.map((group) => (
//                     <optgroup key={group} label={group} className="text-brand-primary font-extrabold text-xs bg-card p-2">
//                       {CATEGORY_PRESETS.filter(cat => cat.industryGroup === group).map((cat) => (
//                         <option key={cat.id} value={cat.id} className="text-foreground font-semibold text-sm bg-card">
//                           {cat.label}
//                         </option>
//                       ))}
//                     </optgroup>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3.5 top-3.5 text-muted pointer-events-none" size={16} />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="stock" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 Initial Stock Base
//               </label>
//               <div className="relative">
//                 <Layers className="absolute left-3.5 top-3.5 text-muted/40" size={16} />
//                 <input
//                   id="stock"
//                   type="number"
//                   {...register("stock", { valueAsNumber: true })}
//                   className="w-full bg-surface border-2 border-border/40 rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
//                   min="0"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="space-y-6 lg:border-l-2 lg:border-border/60 lg:pl-10">
//           <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
//             <DollarSign size={18} className="text-brand-accent" />
//             <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
//               Financial & Logistics
//             </h3>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//             <div className="space-y-2">
//               <label htmlFor="buying_price" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 Unit Cost Price (Buying)
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3.5 top-3.5 text-xs font-black text-muted font-mono">KES</span>
//                 <input
//                   id="buying_price"
//                   type="number"
//                   step="any"
//                   {...register("attributes.buying_price", { valueAsNumber: true })}
//                   className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="selling_price" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 Unit Retail Price (Selling) <span className="text-brand-primary">*</span>
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3.5 top-3.5 text-xs font-black text-muted font-mono">KES</span>
//                 <input
//                   id="selling_price"
//                   type="number"
//                   step="any"
//                   {...register("selling_price", { valueAsNumber: true, required: "Selling price required" })}
//                   className={cn(
//                     "w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
//                     errors.selling_price && "border-brand-primary focus:ring-brand-primary/20"
//                   )}
//                 />
//               </div>
//               {errors.selling_price && (
//                 <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
//                   {errors.selling_price.message}
//                 </p>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//             <div className="space-y-2">
//               <label htmlFor="sku" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 SKU / Barcode Identifier
//               </label>
//               <div className="relative">
//                 <Barcode className="absolute left-3.5 top-3.5 text-muted" size={16} />
//                 <input
//                   id="sku"
//                   type="text"
//                   {...register("attributes.sku")}
//                   placeholder="Auto-generated if left empty"
//                   className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground placeholder:text-muted/50 placeholder:font-sans focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="unit_of_measure" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
//                 Unit of Measure (UoM)
//               </label>
//               <div className="relative">
//                 <select
//                   id="unit_of_measure"
//                   {...register("attributes.unit_of_measure")}
//                   className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold pl-4 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
//                 >
//                   {unitCategories.map((category) => (
//                     <optgroup key={category} label={category} className="text-brand-secondary font-extrabold text-xs bg-card p-2">
//                       {UNIT_PRESETS.filter(unit => unit.category === category).map((unit) => (
//                         <option key={unit.value} value={unit.value} className="text-foreground font-semibold text-sm bg-card">
//                           {unit.label}
//                         </option>
//                       ))}
//                     </optgroup>
//                   ))}
//                 </select>
//                 <ChevronDown className="absolute right-3.5 top-3.5 text-muted pointer-events-none" size={16} />
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* FOOTER CONTROLS ACTION BAR */}
//       <div className="px-6 py-5 bg-surface/40 border-t border-border/60 flex items-center justify-end gap-4">
//         <Button
//           type="button"
//           variant="primary"
//           size="sm"
//           onClick={onCancel}
//           disabled={isPending}
//           className="font-black uppercase text-xs tracking-wider text-muted hover:text-foreground h-11 px-5 transition-colors"
//         >
//           Cancel
//         </Button>
        
//         <Button
//           type="submit"
//           variant="secondary"
//           size="sm"
//           disabled={isPending}
//           className="px-2"
//         >
//           {isPending ? (
//             <>
//               <Loader2 className="animate-spin mr-2" size={14} />
//               Processing...
//             </>
//           ) : (
//             <>
//               <Plus size={14} className="mr-2" />
//               {submitButtonText}
//             </>
//           )}
//         </Button>
//       </div>
//     </form>
//   );
// }

"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { Button } from "@/lib/components/ui/Button";

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

export interface CategoryItem {
  id: string;
  label: string;
  group?: string; // Optional for visual grouping
}

// Much simpler and practical standard categories
export const CATEGORIES: CategoryItem[] = [
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
];

export interface UnitItem {
  value: string;
  label: string;
}

// Clean, practical units
export const UNITS: UnitItem[] = [
  // Count
  { value: "pcs", label: "Pieces (PCS)" },
  { value: "pair", label: "Pairs (PR)" },
  { value: "set", label: "Sets (SET)" },
  { value: "dozen", label: "Dozens (DZN)" },

  // Weight
  { value: "kg", label: "Kilograms (KG)" },
  { value: "g", label: "Grams (G)" },

  // Volume
  { value: "l", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ML)" },

  // Packaging
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "carton", label: "Carton" },
  { value: "bag", label: "Bag / Sack" },

  // Others
  { value: "m", label: "Meters (M)" },
  { value: "unit", label: "Unit" },
  { value: "other", label: "Other Unit" },
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
  initialData?: Partial<AssetFormValues>;
  onSubmit: (data: AssetFormValues, resetForm: () => void) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitButtonText?: string;
}

export function AssetComposer({ 
  initialData,
  onSubmit, 
  onCancel, 
  isPending = false,
  submitButtonText = "Save Product"
}: AssetComposerProps) {
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
      category: "other",
      attributes: {
        unit_of_measure: "pcs",
        buying_price: 0,
        sku: "",
      },
      ...initialData,
    }
  });

  const handleFormSubmit = (data: AssetFormValues) => {
    const businessIdString = Array.isArray(businessId) ? businessId[0] : businessId;
    const businessChunk = businessIdString 
      ? businessIdString.replace(/-/g, "").slice(0, 8).toUpperCase() 
      : "UNKNOWN";

    const computedSku = data.attributes.sku?.trim() !== "" 
      ? data.attributes.sku.trim() 
      : `TWL-AUTO-${businessChunk}-${Date.now()}`;

    const structuredPayload: AssetFormValues = {
      business_id: businessIdString || "",
      label: data.label.trim(),
      selling_price: Number(data.selling_price) || 0,
      stock: Number(data.stock) || 0,
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
      className="w-full card-layered overflow-hidden flex flex-col"
    >
      <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
            <Package size={18} className="text-brand-primary" />
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Identity & Parameters
            </h3>
          </div>

          <div className="space-y-2">
            <label htmlFor="label" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
              Product Label / Title <span className="text-brand-primary">*</span>
            </label>
            <input
              id="label"
              type="text"
              {...register("label", { required: "Product identifier is mandatory" })}
              placeholder="e.g., Premium Roasted Arabica Coffee"
              className={cn(
                "w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold h-12 px-4 text-foreground placeholder:text-muted/50 transition-all focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 disabled:bg-surface/50",
                errors.label && "border-brand-primary focus:ring-brand-primary/20"
              )}
            />
            {errors.label && (
              <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
                {errors.label.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3.5 text-muted" size={16} />
                <select
                  id="category"
                  {...register("category")}
                  className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold pl-11 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 text-muted pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="stock" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                Initial Stock
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 text-muted/40" size={16} />
                <input
                  id="stock"
                  type="number"
                  {...register("stock", { valueAsNumber: true, min: 0 })}
                  className="w-full bg-surface border-2 border-border/40 rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 lg:border-l-2 lg:border-border/60 lg:pl-10">
          <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
            <DollarSign size={18} className="text-brand-accent" />
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Financial & Logistics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="buying_price" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                Unit Cost Price (Buying)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs font-black text-muted font-mono">KES</span>
                <input
                  id="buying_price"
                  type="number"
                  step="any"
                  {...register("attributes.buying_price", { valueAsNumber: true })}
                  className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="selling_price" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                Unit Retail Price (Selling) <span className="text-brand-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs font-black text-muted font-mono">KES</span>
                <input
                  id="selling_price"
                  type="number"
                  step="any"
                  {...register("selling_price", { valueAsNumber: true, required: "Selling price required" })}
                  className={cn(
                    "w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
                    errors.selling_price && "border-brand-primary focus:ring-brand-primary/20"
                  )}
                />
              </div>
              {errors.selling_price && (
                <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
                  {errors.selling_price.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="sku" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                SKU / Barcode Identifier
              </label>
              <div className="relative">
                <Barcode className="absolute left-3.5 top-3.5 text-muted" size={16} />
                <input
                  id="sku"
                  type="text"
                  {...register("attributes.sku")}
                  placeholder="Auto-generated if left empty"
                  className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground placeholder:text-muted/50 placeholder:font-sans focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="unit_of_measure" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                Unit of Measure
              </label>
              <div className="relative">
                <select
                  id="unit_of_measure"
                  {...register("attributes.unit_of_measure")}
                  className="w-full bg-background/50 border-2 border-border/80 rounded-xl text-sm font-bold pl-4 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
                >
                  {UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 text-muted pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER CONTROLS ACTION BAR */}
      <div className="px-6 py-5 bg-surface/40 border-t border-border/60 flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
          className="font-black uppercase text-xs tracking-wider text-muted hover:text-foreground h-11 px-5 transition-colors"
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={isPending}
          className="bg-brand-primary hover:bg-brand-primary/95 text-white font-black uppercase text-xs tracking-wider h-11 min-w-[140px] px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-100 shadow-lift"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin mr-2" size={14} />
              Processing...
            </>
          ) : (
            <>
              <Plus size={14} className="mr-2" />
              {submitButtonText}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}