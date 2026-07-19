"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";
import { 
  Plus, 
  Layers, 
  DollarSign, 
  Tag, 
  Barcode,
  Package,
  Loader2,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductCategory = ProductCreate["category"];

export interface CategoryItem {
  id: Exclude<ProductCategory, undefined | null>;
  label: string;
}

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

export const UNITS: UnitItem[] = [
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
];

type ProductForm = ProductCreate;

interface AssetComposerProps {
  initialData?: Partial<ProductForm> | null;
  onSubmit: (data: ProductForm) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  submitButtonText?: string;
}

export function AssetComposer({ 
  initialData,
  onSubmit, 
  onCancel, 
  isPending = false,
  submitButtonText
}: AssetComposerProps) {
  const { businessId } = useBusinessContext();
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const isEditMode = !!initialData?.label;

  const businessChunk = useMemo(() => {
    const businessIdString = Array.isArray(businessId) ? businessId[0] : businessId;
    return businessIdString 
      ? businessIdString.replace(/-/g, "").slice(0, 8).toUpperCase() 
      : "UNKNOWN";
  }, [businessId]);

  const businessIdString = useMemo(() => {
    return (Array.isArray(businessId) ? businessId[0] : businessId) || "";
  }, [businessId]);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm<ProductForm>({
    defaultValues: {
      label: "",
      selling_price: undefined,
      stock: undefined,
      category: "other",
      attributes: {
        unit_of_measure: "pcs",
        buying_price: undefined,
        sku: "",
      },
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        label: initialData.label || "",
        selling_price: initialData.selling_price,
        stock: initialData.stock,
        category: initialData.category || "other",
        attributes: {
          unit_of_measure: initialData.attributes?.unit_of_measure || "pcs",
          buying_price: initialData.attributes?.buying_price,
          sku: initialData.attributes?.sku || "",
        },
      });
    } else {
      reset({
        label: "",
        selling_price: undefined,
        stock: undefined,
        category: "other",
        attributes: {
          unit_of_measure: "pcs",
          buying_price: undefined,
          sku: "",
        },
      });
    }
    setTimeout(() => setFocus("label"), 0);
  }, [initialData, reset, setFocus]);

  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => setSuccessBanner(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  const onInvalidSubmit = (formErrors: any) => {
    console.warn("Form validation blocked submission:", formErrors);
  };

  const handleFormSubmit = async (data: ProductForm) => {
    const trimmedLabel = data.label.trim();
    if (!trimmedLabel) return;

    const parsedSellingPrice = Number(data.selling_price);
    const parsedStock = Number(data.stock) || 0;
    const parsedBuyingPrice = Number(data?.attributes?.buying_price) || 0;

    if (Number.isNaN(parsedSellingPrice)) {
      console.error("Runtime verification failed: Price conversions resulted in NaN values.");
      return;
    }

    const computedSku = data?.attributes?.sku?.trim() !== "" 
      ? data?.attributes?.sku?.trim() 
      : `TWL-AUTO-${businessChunk}-${Date.now()}`;

    const structuredPayload: ProductForm = {
      business_id: businessIdString,
      label: trimmedLabel,
      selling_price: parsedSellingPrice,
      stock: parsedStock,
      category: data.category,
      attributes: {
        unit_of_measure: data?.attributes?.unit_of_measure,
        buying_price: parsedBuyingPrice,
        sku: computedSku
      }
    };

    try {
      await onSubmit(structuredPayload);
      setSuccessBanner(trimmedLabel);

      if (!isEditMode) {
        const currentCategory = getValues("category");
        const currentUnit = getValues("attributes.unit_of_measure");

        reset({
          label: "",
          selling_price: undefined,
          stock: undefined,
          category: currentCategory,
          attributes: {
            unit_of_measure: currentUnit,
            buying_price: undefined,
            sku: "",
          },
        });
        setTimeout(() => setFocus("label"), 0);
      }
    } catch (error) {
      console.error("Mutation failed: Input dataset preserved safely.", error);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div 
        className={cn(
          "w-full bg-brand-accent/10 border-2 border-brand-accent/20 text-brand-accent rounded-[1.25rem] p-4 flex items-center gap-3 transition-all duration-300 transform origin-top scale-y-0 opacity-0 h-0 overflow-hidden",
          successBanner && "scale-y-100 opacity-100 h-auto"
        )}
        aria-live="polite"
      >
        <CheckCircle2 size={18} className="shrink-0" />
        <p className="text-sm font-bold tracking-wide">
          ✓ Product <span className="underline decoration-wavy px-0.5 font-black">"{successBanner}"</span> successfully {isEditMode ? "updated" : "saved"}.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit(handleFormSubmit, onInvalidSubmit)} 
        className="w-full card-layered overflow-hidden flex flex-col bg-card"
        noValidate
      >
        <fieldset disabled={isPending} className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 disabled:opacity-75 disabled:pointer-events-none transition-opacity">
          
          {/* LEFT COLUMN: IDENTITY */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
              <Package size={18} className="text-brand-primary" />
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider my-0!">
                {isEditMode ? "Modify Properties" : "Identity & Parameters"}
              </h3>
            </div>

            {/* Label Input Field */}
            <div className="space-y-2">
              <label htmlFor="label" className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                <span>Product Label / Title <span className="text-brand-primary">*</span></span>
                {focusedField === "label" && <span className="text-[10px] text-muted-foreground font-normal lowercase tracking-normal">Visible to clients on receipts</span>}
              </label>
              <input
                id="label"
                type="text"
                {...register("label", { 
                  required: "Product name or catalog title is required",
                  validate: v => v.trim().length > 0 || "Title cannot be composed purely of empty spaces"
                })}
                onFocus={() => setFocusedField("label")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., Premium Roasted Arabica Coffee"
                className={cn(
                  "w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold h-12 px-4 text-foreground placeholder:text-muted/50 transition-all focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
                  errors.label && "border-brand-primary focus:ring-brand-primary/20"
                )}
              />
              {errors.label && (
                <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5 animate-pulse">
                  ⚠ {errors.label.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Category Field */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-3.5 text-muted" size={16} />
                  <select
                    id="category"
                    {...register("category")}
                    className="w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold pl-11 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={String(cat.id)} value={String(cat.id)}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 text-muted pointer-events-none" size={16} />
                </div>
              </div>

              {/* Initial Stock Field */}
              <div className="space-y-2">
                <label htmlFor="stock" className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                  <span>Initial Stock</span>
                  <span className="text-[10px] text-muted font-mono lowercase tracking-normal">Defaults to 0</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-3.5 text-muted/40" size={16} />
                  <input
                    id="stock"
                    type="number"
                    {...register("stock", { 
                      valueAsNumber: true,
                      validate: v => v === undefined || Number.isNaN(v) || v >= 0 || "Inventory cannot drop beneath absolute zero metrics"
                    })}
                    placeholder="0"
                    className={cn(
                      "w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
                      errors.stock && "border-brand-primary focus:ring-brand-primary/20"
                    )}
                    min="0"
                  />
                </div>
                {errors.stock && (
                  <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
                    ⚠ {errors.stock.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FINANCIALS */}
          <div className="space-y-6 lg:border-l-2 lg:border-border/60 lg:pl-10">
            <div className="flex items-center gap-2.5 pb-4 border-b-2 border-border/60">
              <DollarSign size={18} className="text-brand-secondary" />
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider my-0!">
                Financial & Logistics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Buying Price Field */}
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
                    placeholder="0.00"
                    {...register("attributes.buying_price", { 
                      valueAsNumber: true,
                      validate: v => v === undefined || v === null || Number.isNaN(v) || v >= 0 || "Buying base cost parameters must be positive"
                    })}
                    className={cn(
                      "w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
                      errors.attributes?.buying_price && "border-brand-primary"
                    )}
                  />
                </div>
                {errors.attributes?.buying_price && (
                  <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
                    ⚠ {errors.attributes.buying_price.message}
                  </p>
                )}
              </div>

              {/* Selling Price Field */}
              <div className="space-y-2">
                <label htmlFor="selling_price" className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                  <span>Unit Retail Price (Selling) <span className="text-brand-primary">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-black text-muted font-mono">KES</span>
                  <input
                    id="selling_price"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...register("selling_price", { 
                      required: "A valid selling retail layout price is mandatory",
                      valueAsNumber: true, 
                      min: { value: 0.01, message: "Retail price must be greater than zero KES" }
                    })}
                    className={cn(
                      "w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold font-mono pl-14 pr-4 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10",
                      errors.selling_price && "border-brand-primary focus:ring-brand-primary/20"
                    )}
                  />
                </div>
                {errors.selling_price && (
                  <p className="text-xs font-bold text-brand-primary tracking-wide mt-1.5">
                    ⚠ {errors.selling_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* SKU Field */}
              <div className="space-y-2">
                <label htmlFor="sku" className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                  <span>SKU / Barcode</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted font-normal lowercase tracking-normal">
                    <HelpCircle size={10} /> Leave empty to auto-generate
                  </span>
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-3.5 text-muted" size={16} />
                  <input
                    id="sku"
                    type="text"
                    {...register("attributes.sku")}
                    placeholder="e.g., CN-48201"
                    className="w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold font-mono pl-11 pr-4 h-12 text-foreground placeholder:text-muted/50 placeholder:font-sans focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  />
                </div>
              </div>

              {/* Unit of Measure Field */}
              <div className="space-y-2">
                <label htmlFor="unit_of_measure" className="block text-xs font-extrabold uppercase tracking-wide text-foreground/90">
                  Unit of Measure
                </label>
                <div className="relative">
                  <select
                    id="unit_of_measure"
                    {...register("attributes.unit_of_measure")}
                    className="w-full bg-background/50 border-2 border-border rounded-xl text-sm font-bold pl-4 pr-10 h-12 text-foreground focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 appearance-none cursor-pointer"
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
        </fieldset>

        {/* FOOTER ACTION BAR */}
        <div className="px-6 py-5 bg-surface border-t border-border/60 flex items-center justify-end gap-4">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="inline-flex items-center justify-center font-black uppercase text-xs tracking-wider text-muted hover:text-foreground h-11 px-5 transition-colors focus:outline-none focus:underline disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "inline-flex items-center justify-center font-black uppercase text-xs tracking-wider h-11 px-6 transition-all rounded-xl select-none text-white focus:outline-none focus:ring-4 focus:ring-brand-primary/30 disabled:opacity-50 disabled:pointer-events-none",
              "bg-brand-primary hover:bg-brand-primary/90"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={14} />
                Processing...
              </>
            ) : isEditMode ? (
              <>
                <RefreshCw size={14} className="mr-2" />
                {submitButtonText || "Update Product"}
              </>
            ) : (
              <>
                <Plus size={14} className="mr-2" />
                {submitButtonText || "Save Product"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}