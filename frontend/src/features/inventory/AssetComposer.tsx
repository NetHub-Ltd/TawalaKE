"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ProductCreate } from "@/lib/api/generated/models";
import { 
  Plus, 
  ArrowLeft, 
  Layers, 
  DollarSign, 
  Tag, 
  Barcode,
  Package,
  Loader2,
  ChevronDown
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { cn } from "@/lib/utils";

interface AssetCreatorProps {
  businessId: string;
}

// B2B/Retail Industry standard preset values
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

export function AssetCreator({ businessId }: AssetCreatorProps) {
  const router = useRouter();
  const { createProduct } = useProducts(businessId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductCreate>({
    defaultValues: {
      business_id: businessId,
      label: "",
      selling_price: 0,
      stock: 0,
      category: "General",
      attributes: {
        unit_of_measure: "pcs",
        buying_price: 0,
        sku: "",
      },
    },
  });

  const onSubmit = (data: ProductCreate) => {
    createProduct.mutate(data, {
      onSuccess: () => router.push(`/terminal/${businessId}/inventory`),
    });
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:px-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation & Context Header */}
      <header className="mb-10 space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Inventory Registry
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Create System Asset
          </h1>
          <p className="text-sm text-muted-foreground">
            Initialize a physical or logistical product record inside inventory business cluster <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{businessId.split('-')[0]}...</code>
          </p>
        </div>
      </header>

      {/* Unified Registration-Style Form Frame */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Section 1: Core Definitions */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Package size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Core Identification</h2>
          </div>

          <div className="space-y-2">
            <label htmlFor="label" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Label <span className="text-destructive">*</span>
            </label>
            <input
              id="label"
              type="text"
              {...register("label", { required: "Product label is mandatory" })}
              placeholder="e.g., Premium Roasted Arabica Coffee (Dark Blend)"
              className={cn(
                "w-full bg-background border border-input rounded-lg h-12 px-4 text-base font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all",
                errors.label && "border-destructive focus:border-destructive focus:ring-destructive"
              )}
            />
            {errors.label && (
              <p className="text-xs font-semibold text-destructive mt-1">{errors.label.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Category Placement
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <select
                  id="category"
                  {...register("category")}
                  className="w-full bg-background border border-input rounded-lg h-12 pl-10 pr-10 text-base font-medium appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="stock" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Initial Stock Unit Count
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  id="stock"
                  type="number"
                  min="0"
                  {...register("stock", { valueAsNumber: true, required: true })}
                  className="w-full bg-background border border-input rounded-lg h-12 pl-10 pr-4 text-base font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Operational Pricing Metrics */}
        <div className="p-6 md:p-8 bg-muted/30 border-t border-border space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <DollarSign size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Financial Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="buying_price" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Unit Cost Price (Buying)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
                <input
                  id="buying_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("attributes.buying_price", { valueAsNumber: true })}
                  className="w-full bg-background border border-input rounded-lg h-12 pl-8 pr-4 text-base font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="selling_price" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Unit Base Retail Price (Selling) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
                <input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("selling_price", { valueAsNumber: true, required: true })}
                  className="w-full bg-background border border-input rounded-lg h-12 pl-8 pr-4 text-base font-medium tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Logistics Logistics & Metadata */}
        <div className="p-6 md:p-8 border-t border-border space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Barcode size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Logistical Tracking</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="sku" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SKU / Barcode Identifier
              </label>
              <input
                id="sku"
                type="text"
                {...register("attributes.sku")}
                placeholder="Leave blank to auto-generate tracking token"
                className="w-full bg-background border border-input rounded-lg h-12 px-4 text-base font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit_of_measure" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Unit of Measure (UoM)
              </label>
              <div className="relative">
                <select
                  id="unit_of_measure"
                  {...register("attributes.unit_of_measure")}
                  className="w-full bg-background border border-input rounded-lg h-12 pl-4 pr-10 text-base font-medium appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  {UNIT_PRESETS.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Global Structural Form Actions bar */}
        <div className="px-6 py-4 md:px-8 bg-muted/50 border-t border-border flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-5 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="h-11 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-98"
          >
            {createProduct.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Initializing Record...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Confirm & Create Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}