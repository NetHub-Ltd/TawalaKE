"use client";

import React from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Package,
  Tag,
  Layers,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Loader2,
    LayoutGrid,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { cn } from "@/lib/utils";
import { useCatalogOptions } from "@/features/catalog/useCatalogOptions";

/**
 * @Scribe_Audit
 * Focus: High-efficiency ERP-style entry.
 * UI/UX: Grid-table hybrid for technical metadata to minimize vertical scrolling.
 */

interface ProductFormValues {
  business_id: string;
  name: string;
  price: number;
  stock: number;
  attributes: {
    unit_of_measure: string;
    category: string;
    unit_price: number;
    sku: string;
  };
}

export function CreateProductForm() {
  const { businessId, businessName } = useBusinessContext();
  const businessIdStr = Array.isArray(businessId) ? businessId[0] : businessId;
  const { createProduct } = useProducts(businessIdStr as string);
  const { units, categories } = useCatalogOptions(businessIdStr ?? null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      business_id: businessId as string,
      name: "",
      price: 0,
      stock: 0,
      attributes: {
        unit_of_measure: "pcs",
        category: "hardware",
        unit_price: 0,
        sku: "",
      },
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    createProduct.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <main
      id="main-content"
      className="flex-1 flex flex-col min-h-screen bg-background text-foreground"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 flex flex-col p-6 md:p-10 gap-10 max-w-[1300px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {/* HEADER COMMAND CENTER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Package size={20} className="stroke-[2.5]" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Node_Inbound / v1.0.4
              </span>
            </div>
            <h1 className="text-5xl font-semibold uppercase tracking-tighter italic">
              New <span className="text-primary">Asset</span>
            </h1>
            <p className="text-muted text-xs uppercase tracking-wide font-bold mt-2 opacity-70">
              Auth: {businessName || "System_Root"}{" // "}
              {businessId?.toString().slice(0, 8)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-4 rounded-md text-xs font-semibold uppercase tracking-wide border border-border hover:bg-muted transition-all active:scale-95"
            >
              <RotateCcw size={14} /> Reset Buffer
            </button>
            <button
              type="submit"
              disabled={createProduct.isPending}
              className="flex items-center gap-3 px-10 py-4 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-md font-semibold text-xs uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {createProduct.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Initialize SKU
            </button>
          </div>
        </header>

        {/* PRIMARY IDENTITY */}
        <section className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <Tag size={18} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Primary Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Official Name
              </label>
              <input
                {...register("name", { required: true })}
                className={cn(
                  "w-full bg-background border-2 border-border rounded-md py-4 px-5 text-lg font-bold focus:border-primary outline-none transition-all",
                  errors.name &&
                    "border-destructive ring-4 ring-destructive/10",
                )}
                placeholder="e.g. Titanium Bolt M8"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Market Price (Retail)
              </label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  className="w-full bg-background border-2 border-border rounded-md py-4 pl-12 pr-5 text-xl font-semibold focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Opening Stock
              </label>
              <div className="relative">
                <Layers
                  size={16}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="number"
                  {...register("stock", { valueAsNumber: true })}
                  className="w-full bg-background border-2 border-border rounded-md py-4 pl-12 pr-5 text-xl font-semibold focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM PARAMETERS (TABULAR UX) */}
        <section className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
            <LayoutGrid size={18} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              System Parameters
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  {[
                    "SKU / Barcode",
                    "Classification",
                    "UOM",
                    "Procurement Cost",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-8 py-5 text-xs font-semibold uppercase tracking-[0.2em] border-r border-border/50"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-8 py-6 border-r border-border/50 align-top">
                    <input
                      {...register("attributes.sku")}
                      className="w-full bg-transparent font-mono text-sm tracking-tighter uppercase outline-none focus:text-primary"
                      placeholder="SYST-AUTO"
                    />
                  </td>
                  <td className="px-8 py-6 border-r border-border/50 align-top">
                    <select
                      {...register("attributes.category")}
                      className="w-full bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-6 border-r border-border/50 align-top">
                    <select
                      {...register("attributes.unit_of_measure")}
                      className="w-full bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer"
                    >
                      {units.map((u) => (
                        <option key={u.code} value={u.code}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-6 bg-[var(--success-soft)] align-top">
                    <input
                      type="number"
                      step="0.01"
                      {...register("attributes.unit_price", {
                        valueAsNumber: true,
                      })}
                      className="w-full bg-transparent text-lg font-semibold text-[var(--success)] outline-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FINANCIAL ALERT */}
        <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex items-start gap-4">
          <AlertCircle size={14} className="text-primary mt-0.5" />
          <p className="text-xs leading-relaxed text-muted font-medium max-w-2xl">
            <strong className="text-foreground tracking-wide block mb-1">
              Financial Integrity Check
            </strong>
            Ensure unit prices align with retail markup. Discrepancies will
            trigger margin deficit warnings in analytics.
          </p>
        </div>
      </form>
    </main>
  );
}
