"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Package,
  Layers,
  Tag,
  DollarSign,
  Info,
  Loader2,
  Database,
} from "lucide-react";
import { useProducts, Product } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { cn } from "@/lib/utils";

interface AssetComposerProps {
  productId?: string;
}

export function AssetComposer({ productId }: AssetComposerProps) {
  const router = useRouter();
  const { businessId } = useBusinessContext();
  const {
    products,
    createProduct,
    updateProduct,
    isLoading: isFetching,
  } = useProducts(businessId as string);

  // Find product if in edit mode
  const existingProduct = products.find((p) => p.id === productId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Partial<Product>>({
    defaultValues: {
      name: "",
      price: 0,
      stock: 0,
      active: true,
      attributes: {
        unit_of_measure: "pcs",
        category: "General",
        unit_price: 0,
      },
    },
  });

  // Hydrate form when editing
  useEffect(() => {
    if (existingProduct) {
      reset(existingProduct);
    }
  }, [existingProduct, reset]);

  const onSubmit = (data: Partial<Product>) => {
    if (productId) {
      updateProduct.mutate(
        { ...data, product_id: productId },
        { onSuccess: () => router.push(`/terminal/${businessId}/inventory`) },
      );
    } else {
      createProduct.mutate(
        { ...data, business_id: businessId as string },
        { onSuccess: () => router.push(`/terminal/${businessId}/inventory`) },
      );
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (productId && isFetching) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-[1000px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Title */}
      <header className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Registry
        </button>

        <div>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Database size={20} className="stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Asset_Configuration / {productId ? "Update" : "Initialize"}
            </span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">
            {productId ? "Edit" : "New"}{" "}
            <span className="text-primary">Asset</span>
          </h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* Main Specs */}
        <section className="md:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                Asset Name
              </label>
              <input
                {...register("name", { required: true })}
                placeholder="Product Display Name"
                className={cn(
                  "w-full bg-background border-2 border-border rounded-2xl py-4 px-6 text-lg font-bold focus:border-primary outline-none transition-all",
                  errors.name && "border-red-500 ring-4 ring-red-500/10",
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Retail Price (Ksh)
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40"
                    size={18}
                  />
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 text-xl font-black italic tabular-nums focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Current Stock
                </label>
                <div className="relative">
                  <Layers
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40"
                    size={18}
                  />
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 text-xl font-black italic tabular-nums focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info size={14} className="text-primary" /> Technical Attributes
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Category
                </label>
                <input
                  {...register("attributes.category")}
                  className="w-full bg-background border-2 border-border rounded-2xl py-4 px-6 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1">
                  Unit of Measure
                </label>
                <select
                  {...register("attributes.unit_of_measure")}
                  className="w-full h-[60px] bg-background border-2 border-border rounded-2xl px-6 font-bold appearance-none"
                >
                  <option value="pcs">Pieces (PCS)</option>
                  <option value="kg">Kilograms (KG)</option>
                  <option value="l">Liters (L)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Actions */}
        <aside className="space-y-8">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40 mb-6">
              Status & Visibility
            </h3>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold uppercase tracking-tight">
                Active in POS
              </span>
              <input
                type="checkbox"
                {...register("active")}
                className="w-6 h-6 rounded-lg border-2 border-border checked:bg-primary transition-all"
              />
            </label>

            <hr className="my-8 border-border/40" />

            <button
              type="submit"
              disabled={isPending || (productId && !isDirty)}
              className="w-full py-6 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {productId ? "Update Record" : "Save Asset"}
            </button>
          </div>

          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
            <p className="text-[10px] leading-relaxed font-medium text-secondary/60 italic">
              Changes to pricing are reflected immediately in the Terminal
              Cockpit for all active sessions.
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}
