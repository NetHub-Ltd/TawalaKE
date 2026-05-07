"use client";
import Link from "next/link";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * UI/UX: Dense tabular layout for ERP efficiency.
 * Logic: Integrated CRUD via useProducts hook.
 * Feedback: Real-time optimistic UI signals for stock status.
 */

export function InventoryRegistry() {
  const { businessId } = useBusinessContext();
  const { products, isLoading, updateProduct, deleteProduct } = useProducts(
    businessId as string,
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteProduct.mutate(id);
    }
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    updateProduct.mutate({ product_id: id, active: !currentStatus });
  };

  return (
    <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 max-w-[1600px] mx-auto w-full">
      {/* Header Command Strip */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <PackageSearch size={18} className="stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">
              Inventory_Master / v1.0.4
            </span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">
            Asset <span className="text-primary">Registry</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40 group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              placeholder="Search SKUs or Assets..."
              className="h-14 pl-12 pr-6 bg-card border border-border rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all outline-none w-64 lg:w-80"
            />
          </div>
          <Link href={`/terminal/${businessId}/inventory/manage`}>
            <button className="h-14 flex items-center gap-3 px-8 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all">
              <Plus size={16} /> Add New Asset
            </button>
          </Link>
        </div>
      </header>

      {/* Registry Table */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50">
                  Status
                </th>
                <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50">
                  Asset Information
                </th>
                <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50 text-right">
                  Retail Price
                </th>
                <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50 text-right">
                  Stock Level
                </th>
                <th className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-secondary/50 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6 h-20 bg-muted/5" />
                    </tr>
                  ))
                : products.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <button
                          onClick={() =>
                            toggleStatus(product.id, product.active)
                          }
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border transition-all",
                            product.active
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                              : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100",
                          )}
                        >
                          {product.active ? (
                            <CheckCircle2 size={10} />
                          ) : (
                            <AlertTriangle size={10} />
                          )}
                          {product.active ? "Active" : "Archived"}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                            {product.name}
                          </span>
                          <span className="text-[10px] font-mono text-secondary/40 uppercase mt-1">
                            {product.attributes?.sku || "NO-SKU-ASSIGNED"} •{" "}
                            {product.attributes?.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black italic tabular-nums">
                          Ksh{" "}
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span
                            className={cn(
                              "text-sm font-black tabular-nums",
                              product.stock <= 5
                                ? "text-red-500"
                                : "text-foreground",
                            )}
                          >
                            {product.stock}
                          </span>
                          <span className="text-[8px] font-black uppercase text-secondary/30 tracking-widest">
                            {product.attributes?.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/terminal/${businessId}/inventory/manage/${product.id}`}>
                            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                              <Edit3 size={16} />
                            </button>
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && products.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-secondary/20">
              <PackageSearch size={48} strokeWidth={1} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                No records found in registry
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
