// "use client";

// import React, { useEffect, useMemo } from "react";
// import { useForm } from "react-hook-form";
// import { useRouter } from "next/navigation";
// import { ProductResponse , ProductCreate} from "@/lib/api/generated/models";
// import {
//   Save,
//   ArrowLeft,
//   Layers,
//   DollarSign,
//   Info,
//   Loader2,
//   Database,
// } from "lucide-react";
// import { useProducts} from "@/features/business/hooks/useProducts";

// import { cn } from "@/lib/utils";

// /**
//  * @Scribe_Audit
//  * Logic: Fixed hydration bug by memoizing existingProduct and ensuring reset()
//  * triggers only when valid data arrives.
//  * UX: Added proper number handling for valueAsNumber to prevent "string-in-JSON" API errors.
//  */

// interface AssetComposerProps {
//   productId?: string;
//   businessId: string; // Passed from Server Page for immediate hydration
// }

// export function AssetComposer({ productId, businessId }: AssetComposerProps) {
//   const router = useRouter();

//   // Directly use the businessId passed from the server segment to avoid context lag
//   const {
//     products,
//     createProduct,
//     updateProduct,
//     isLoading: isFetching,
//   } = useProducts(businessId);

//   // Memoize lookup to prevent unnecessary recalculations during re-renders
//   const existingProduct = useMemo(() => {
//     if (!productId || !products) return null;
//     return products.find((p) => p.id === productId);
//   }, [products, productId]);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isDirty },
//   } = useForm<Partial<ProductCreate>>({
//     defaultValues: {
//       label: "",
//       selling_price: 0,
//       stock: 0,
//       category: "General",
//       // active: true,
//       attributes: {
//         unit_of_measure: "pcs",
//       },
//     },
//   });

//   // CRITICAL FIX: Ensure the form hydrates once the products are actually loaded
//   useEffect(() => {
//     if (existingProduct) {
//       reset({
//         name: existingProduct.label,
//         price: existingProduct.selling_price,
//         stock: existingProduct.stock,
//         active: existingProduct.active,
//         attributes: {
//           category: existingProduct.category || "General",
//           unit_of_measure: existingProduct.attributes?.unit_of_measure || "pcs",
//         },
//       });
//     }
//   }, [existingProduct, reset]);

//   const onSubmit = (data: Partial<ProductCreate>) => {
//     if (productId) {
//       updateProduct.mutate(
//         { ...data, id: productId },
//         { onSuccess: () => router.push(`/terminal/${businessId}/inventory`) },
//       );
//     } else {
//       createProduct.mutate(
//         { ...data, business_id: businessId },
//         { onSuccess: () => router.push(`/terminal/${businessId}/inventory`) },
//       );
//     }
//   };

//   const isPending = createProduct.isPending || updateProduct.isPending;

//   // UX: Show skeleton/loader only when we are strictly expecting a product that isn't here yet
//   if (productId && isFetching && !existingProduct) {
//     return (
//       <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
//         <Loader2 className="animate-spin text-primary" size={40} />
//         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/40">
//           Syncing Asset Data...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-250 mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
//       <header className="flex flex-col gap-6">
//         <button
//           onClick={() => router.back()}
//           className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors"
//         >
//           <ArrowLeft
//             size={14}
//             className="group-hover:-translate-x-1 transition-transform"
//           />
//           Back to Registry
//         </button>

//         <div>
//           <div className="flex items-center gap-2 mb-2 text-primary">
//             <Database size={20} className="stroke-[2.5]" />
//             <span className="text-[10px] font-black uppercase tracking-[0.4em]">
//               Asset_Configuration / {productId ? "Update" : "Initialize"}
//             </span>
//           </div>
//           <h1 className="text-5xl font-black uppercase tracking-tighter italic">
//             {productId ? "Edit" : "New"}{" "}
//             <span className="text-primary">Asset</span>
//           </h1>
//         </div>
//       </header>

//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="grid grid-cols-1 md:grid-cols-3 gap-8"
//       >
//         <section className="md:col-span-2 space-y-8">
//           <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft space-y-6">
//             <div className="space-y-2">
//               <label className="text-[10px] font-black uppercase tracking-widest ml-1">
//                 Product Name
//               </label>
//               <input
//                 {...register("label", { required: "Asset name is required" })}
//                 placeholder="Product Display Name"
//                 className={cn(
//                   "w-full bg-background border-2 border-border rounded-2xl py-4 px-6 text-lg font-bold focus:border-primary outline-none transition-all",
//                   errors.label && "border-red-500 ring-4 ring-red-500/10",
//                 )}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest ml-1">
//                   Retail Price (Ksh)
//                 </label>
//                 <div className="relative">
//                   <DollarSign
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40"
//                     size={18}
//                   />
//                   <input
//                     type="number"
//                     step="0.01"
//                     {...register("selling_price", {
//                       valueAsNumber: true,
//                       required: true,
//                     })}
//                     className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 text-xl font-black italic tabular-nums focus:border-emerald-500 outline-none transition-all"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest ml-1">
//                   Current Stock
//                 </label>
//                 <div className="relative">
//                   <Layers
//                     className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40"
//                     size={18}
//                   />
//                   <input
//                     type="number"
//                     {...register("stock", {
//                       valueAsNumber: true,
//                       required: true,
//                     })}
//                     className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 text-xl font-black italic tabular-nums focus:border-primary outline-none transition-all"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-soft">
//             <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
//               <Info size={14} className="text-primary" /> Technical Attributes
//             </h3>
//             <div className="grid grid-cols-2 gap-8">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest ml-1">
//                   Category
//                 </label>
//                 <input
//                   {...register("attributes.category")}
//                   className="w-full bg-background border-2 border-border rounded-2xl py-4 px-6 font-bold focus:border-primary outline-none transition-all"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest ml-1">
//                   Unit of Measure
//                 </label>
//                 <select
//                   {...register("attributes.unit_of_measure")}
//                   className="w-full h-[60px] bg-background border-2 border-border rounded-2xl px-6 font-bold appearance-none focus:border-primary outline-none transition-all"
//                 >
//                   <option value="pcs">Pieces (PCS)</option>
//                   <option value="kg">Kilograms (KG)</option>
//                   <option value="l">Liters (L)</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </section>

//       </form>
//     </main>
//   );
// }


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
  Loader2 
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { cn } from "@/lib/utils";

interface AssetCreatorProps {
  businessId: string;
}

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
    <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <header className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Registry
        </button>
        <h1 className="text-5xl font-black uppercase tracking-tighter italic">
          New <span className="text-primary">Asset</span>
        </h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Core Identity Section */}
          <section className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                Label (Required)
              </label>
              <input
                {...register("label", { required: "Product label is mandatory" })}
                placeholder="e.g. Premium Arabica Coffee"
                className={cn(
                  "w-full bg-background border-2 border-border rounded-2xl py-4 px-6 text-lg font-bold focus:border-primary outline-none transition-all",
                  errors.label && "border-red-500 ring-4 ring-red-500/10"
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
                  <input
                    {...register("category")}
                    placeholder="General"
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  Stock Level
                </label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true, required: true })}
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 text-xl font-black italic tabular-nums focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & Financials */}
          <section className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-primary">
              <DollarSign size={14} /> Financial Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  Buying Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("attributes.buying_price", { valueAsNumber: true })}
                  className="w-full bg-background border-2 border-border rounded-2xl py-4 px-6 text-xl font-black italic tabular-nums focus:border-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("selling_price", { valueAsNumber: true, required: true })}
                  className="w-full bg-background border-2 border-border rounded-2xl py-4 px-6 text-xl font-black italic tabular-nums focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Attributes Section */}
          <section className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-primary">
              <Package size={14} /> Base Attributes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  SKU (Stock Keeping Unit)
                </label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
                  <input
                    {...register("attributes.sku")}
                    placeholder="AUTO-GEN-001"
                    className="w-full bg-background border-2 border-border rounded-2xl py-4 pl-12 pr-6 font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-secondary/60">
                  Unit of Measure
                </label>
                <select
                  {...register("attributes.unit_of_measure")}
                  className="w-full h-[64px] bg-background border-2 border-border rounded-2xl px-6 font-bold appearance-none focus:border-primary outline-none transition-all"
                >
                  <option value="pcs">Pieces (PCS)</option>
                  <option value="kg">Kilograms (KG)</option>
                  <option value="l">Liters (L)</option>
                  <option value="box">Boxes</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Action Sidebar */}
        <aside className="space-y-6">
          <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-8 flex flex-col gap-8 shadow-xl shadow-primary/20 sticky top-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Registry Summary</p>
              <h4 className="text-2xl font-black leading-tight italic">Initialize Product In System</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase border-b border-primary-foreground/20 pb-2">
                <span>Operation</span>
                <span>CREATE_ASSET</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase border-b border-primary-foreground/20 pb-2">
                <span>Scope</span>
                <span className="truncate ml-4">{businessId.split('-')[0]}...</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={createProduct.isPending}
              className="w-full bg-white text-primary rounded-2xl py-6 font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary-foreground transition-all disabled:opacity-50 active:scale-95"
            >
              {createProduct.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Plus size={20} strokeWidth={4} />
                  Confirm & Create
                </>
              )}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}