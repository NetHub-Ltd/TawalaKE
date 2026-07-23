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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs transition-opacity duration-200"
          role="alert"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-2xl border border-border/60 shadow-lift">
            <Loader2 className="animate-spin text-brand-primary" size={28} />
            <p className="text-xs font-black uppercase tracking-widest text-foreground">
              Processing Transaction...
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="w-full bg-card rounded-[1.25rem] border border-border/60 shadow-lift overflow-hidden text-foreground transition-all duration-200"
        noValidate
      >
        {/* COMPACT SECTION HEADER */}
        <div className="px-5 py-3.5 bg-surface/30 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              {!!initialData ? "Edit Asset Specifications" : "New Asset Registration"}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface/80 px-2.5 py-1 rounded-md border border-border/40">
            {businessIdString ? `BIZ-${businessIdString.slice(0, 6).toUpperCase()}` : "DRAFT MODE"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* GENERAL INFORMATION GROUP */}
          <div className="space-y-3.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-border/30 pb-1">
              General Identity
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Label */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-label" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Product Label <span className="text-brand-primary">*</span>
                </label>
                <input
                  id="asset-label"
                  {...register("label", {
                    required: "Required",
                    validate: (v) => (v?.trim().length ?? 0) > 0 || "Cannot be empty spaces",
                  })}
                  type="text"
                  placeholder="e.g. Premium White Bread 800g"
                  className={`h-9 px-3 border rounded-xl bg-background text-xs font-medium outline-none transition-all duration-150 focus:ring-2 focus:ring-brand-primary/10 ${
                    errors.label ? "border-destructive focus:border-destructive" : "border-border/60 focus:border-brand-primary"
                  }`}
                />
                {errors.label && (
                  <span className="text-destructive text-[10px] font-bold mt-0.5">{errors.label.message}</span>
                )}
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-category" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Category
                </label>
                <select
                  id="asset-category"
                  {...register("category")}
                  className="h-9 px-3 border border-border/60 bg-background rounded-xl text-xs font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all duration-150 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* INVENTORY & PRICING GROUP */}
          <div className="space-y-3.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-border/30 pb-1">
              Valuation & Stock Metrics
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Initial Stock */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-stock" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Initial Stock
                </label>
                <input
                  id="asset-stock"
                  type="number"
                  {...register("stock", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot be negative" },
                  })}
                  className={`h-9 px-3 border rounded-xl bg-background text-xs font-mono font-semibold transition-all duration-150 focus:ring-2 focus:ring-brand-primary/10 ${
                    errors.stock ? "border-destructive focus:border-destructive" : "border-border/60 focus:border-brand-primary"
                  }`}
                />
                {errors.stock && (
                  <span className="text-destructive text-[10px] font-bold mt-0.5">{errors.stock.message}</span>
                )}
              </div>

              {/* Unit Cost Price */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-buying-price" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Cost Price (KES)
                </label>
                <input
                  id="asset-buying-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("attributes.buying_price", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Cannot be negative" },
                  })}
                  className={`h-9 px-3 border rounded-xl bg-background text-xs font-mono font-semibold transition-all duration-150 focus:ring-2 focus:ring-brand-primary/10 ${
                    errors.attributes?.buying_price ? "border-destructive focus:border-destructive" : "border-border/60 focus:border-brand-primary"
                  }`}
                />
                {errors.attributes?.buying_price && (
                  <span className="text-destructive text-[10px] font-bold mt-0.5">{errors.attributes.buying_price.message}</span>
                )}
              </div>

              {/* Unit Retail Price */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-selling-price" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Retail Price <span className="text-brand-primary">*</span>
                </label>
                <input
                  id="asset-selling-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("selling_price", {
                    required: "Required",
                    min: { value: 0.01, message: "Must be > 0" },
                    valueAsNumber: true,
                  })}
                  className={`h-9 px-3 border rounded-xl bg-background text-xs font-mono font-semibold transition-all duration-150 focus:ring-2 focus:ring-brand-primary/10 ${
                    errors.selling_price ? "border-destructive focus:border-destructive" : "border-border/60 focus:border-brand-primary"
                  }`}
                />
                {errors.selling_price && (
                  <span className="text-destructive text-[10px] font-bold mt-0.5">{errors.selling_price.message}</span>
                )}
              </div>

              {/* Unit of Measure */}
              <div className="flex flex-col gap-1">
                <label htmlFor="asset-uom" className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Unit of Measure
                </label>
                <select
                  id="asset-uom"
                  {...register("attributes.unit_of_measure")}
                  className="h-9 px-3 border border-border/60 bg-background rounded-xl text-xs font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all duration-150 cursor-pointer"
                >
                  {UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="px-5 py-3 bg-surface/30 border-t border-border/40 flex items-center justify-end gap-3 select-none">
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-black uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-150 px-3.5 h-8 rounded-lg cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase text-[10px] tracking-wider px-4 h-8 rounded-lg transition-all duration-150 shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading && <Loader2 className="animate-spin" size={12} />}
            <span>{isLoading ? "Saving..." : !!initialData ? "Update Product" : "Save Product"}</span>
          </button>
        </div>
      </form>
    </>
  );
}