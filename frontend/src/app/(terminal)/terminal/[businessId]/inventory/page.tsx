"use client";

import React from "react";
import { Metadata } from "next";
import { useForm } from "react-hook-form";
import {
  Save,
  Package,
  Tag,
  Hash,
  Layers,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Loader2,
  Info,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
// import { useBusinessContext } from "../layout";
import { cn } from "@/lib/utils";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

/**
 * REVENUE BLUEPRINT: Transactional
 * Focus: High-efficiency ERP-style entry with micro-guidance.
 */

// SEO Metadata (Note: In Next.js 13+, this should typically be in a separate layout or non-client file,
// but provided here for logic completeness per spec).
// export const metadata: Metadata = {
//   title: "Add New Product | Inventory Management System",
//   description:
//     "Register new assets and products into the inventory node. Secure SKU initialization.",
//   alternates: { canonical: "/inventory/create" },
// };

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

const CATEGORIES = [
  "Raw Materials",
  "Electronics",
  "Hardware",
  "Consumables",
  "Furniture",
  "Apparel",
  "Food & Beverage",
  "Services",
];

const UNITS = [
  { val: "pcs", label: "Pieces (PCS)" },
  { val: "kg", label: "Kilograms (KG)" },
  { val: "g", label: "Grams (G)" },
  { val: "l", label: "Liters (L)" },
  { val: "ml", label: "Milliliters (ML)" },
  { val: "m", label: "Meters (M)" },
  { val: "box", label: "Box (BX)" },
  { val: "set", label: "Set (ST)" },
];

export default function CreateProductPage() {
  const { businessId, businessName } = useBusinessContext();
  const { createProduct } = useProducts(businessId as string);

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
        category: "Hardware",
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
      className="flex-1 flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20"
    >
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inventory",
                item: `${process.env.NEXT_PUBLIC_BASE_URL}/inventory`,
              },
              { "@type": "ListItem", position: 2, name: "Register Asset" },
            ],
          }),
        }}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 flex flex-col p-6 md:p-10 gap-10 max-w-[1300px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {/* HEADER COMMAND CENTER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Package size={20} className="stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                Node_Inbound / v1.0.4
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">
              New <span className="text-primary">Asset</span>
            </h1>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mt-2 opacity-70">
              Authorized Business: {businessName || "System_Root"} //{" "}
              {businessId?.toString().slice(0, 8)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="group flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border hover:bg-muted transition-all active:scale-95"
            >
              <RotateCcw
                size={14}
                className="group-hover:rotate-[-120deg] transition-transform duration-500"
              />
              Reset Buffer
            </button>
            <button
              type="submit"
              disabled={createProduct.isPending}
              className="flex items-center gap-3 px-10 py-4 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50"
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

        <div className="grid grid-cols-1 gap-8">
          {/* PRIMARY IDENTITY SECTION */}
          <section className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-focus-within:bg-primary transition-colors" />

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Tag size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">
                  Primary Identity
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Core identifiers for customer-facing displays.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Official Name
                </label>
                <input
                  {...register("name", { required: true })}
                  className={cn(
                    "w-full bg-background border-2 border-border rounded-2xl py-4 px-5 text-lg font-bold focus:border-primary outline-none transition-all",
                    errors.name &&
                      "border-destructive ring-4 ring-destructive/10",
                  )}
                  placeholder="e.g. Titanium Bolt M8"
                />
                <p className="text-[9px] text-muted-foreground leading-relaxed px-1">
                  How the product appears on invoices and the digital
                  storefront.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Market Price (Retail)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-5 text-xl font-black focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed px-1">
                  Final selling price to customers including markup.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Opening Stock
                </label>
                <div className="relative">
                  <Layers
                    size={16}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-5 text-xl font-black focus:border-primary outline-none transition-all"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed px-1">
                  Current physical quantity available in the warehouse.
                </p>
              </div>
            </div>
          </section>

          {/* TABULAR TECHNICAL METADATA */}
          <section className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center gap-3 bg-muted/30">
              <div className="p-2 bg-foreground/5 rounded-lg">
                <LayoutGrid size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">
                  System Parameters
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Internal logistics and procurement data.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/10 border-b border-border">
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-border/50">
                      SKU / Barcode
                    </th>
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-border/50">
                      Classification
                    </th>
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-border/50">
                      UOM
                    </th>
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                      Procurement Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="group hover:bg-muted/5 transition-colors">
                    <td className="px-8 py-6 border-r border-border/50 align-top max-w-[200px]">
                      <input
                        {...register("attributes.sku")}
                        className="w-full bg-transparent font-mono text-sm tracking-tighter uppercase outline-none focus:text-primary placeholder:opacity-30"
                        placeholder="SYST-AUTO"
                      />
                      <p className="text-[8px] mt-2 text-muted-foreground uppercase font-bold tracking-tighter">
                        Unique system identifier.
                      </p>
                    </td>
                    <td className="px-8 py-6 border-r border-border/50 align-top">
                      <div className="relative">
                        <select
                          {...register("attributes.category")}
                          className="w-full bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer pr-8"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                        />
                      </div>
                      <p className="text-[8px] mt-2 text-muted-foreground uppercase font-bold tracking-tighter">
                        Inventory group.
                      </p>
                    </td>
                    <td className="px-8 py-6 border-r border-border/50 align-top">
                      <div className="relative">
                        <select
                          {...register("attributes.unit_of_measure")}
                          className="w-full bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer pr-8"
                        >
                          {UNITS.map((u) => (
                            <option key={u.val} value={u.val}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                        />
                      </div>
                      <p className="text-[8px] mt-2 text-muted-foreground uppercase font-bold tracking-tighter">
                        Measurement base.
                      </p>
                    </td>
                    <td className="px-8 py-6 bg-emerald-500/5 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-600">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          {...register("attributes.unit_price", {
                            valueAsNumber: true,
                          })}
                          className="w-full bg-transparent text-lg font-black text-emerald-600 outline-none"
                        />
                      </div>
                      <p className="text-[8px] mt-2 text-emerald-700/60 uppercase font-bold tracking-tighter">
                        Internal cost per unit.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-primary/5 border-t border-border flex items-start gap-4">
              <div className="p-2 bg-primary/20 rounded-full text-primary mt-0.5">
                <AlertCircle size={14} />
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground font-medium max-w-2xl">
                <strong className="text-foreground uppercase tracking-wider block mb-1">
                  Financial Integrity Check
                </strong>
                Registering a procurement cost higher than the retail price will
                trigger a margin deficit warning in the analytics module. Ensure
                all UOM conversions are standardized to the base unit for
                accurate stock valuation.
              </p>
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}
