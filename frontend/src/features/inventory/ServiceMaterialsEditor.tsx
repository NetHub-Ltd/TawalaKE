"use client";

/**
 * Service material binding: at most **one** product per service.
 * Size/colour = separate products (pick one SKU).
 * Category must match the service when the service has a real category.
 */
import React, { useMemo, useState } from "react";
import { Plus, Trash2, Package, Search } from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import type { ProductMaterialIn } from "@/lib/api/generated/models/productCreate";
import type { ProductResponse } from "@/lib/api/generated/models/productResponse";
import { cn } from "@/lib/utils";

export type MaterialLine = ProductMaterialIn & {
  material_label?: string | null;
  material_category?: string | null;
};

type Props = {
  businessId: string;
  excludeProductId?: string | null;
  value: MaterialLine[];
  onChange: (next: MaterialLine[]) => void;
  disabled?: boolean;
  className?: string;
  serviceReady?: boolean;
  serviceCategory?: string | null;
};

function isProductKind(p: ProductResponse): boolean {
  return p.item_type !== "SERVICE";
}

function productCategory(p: ProductResponse): string {
  return (p.category || "General").trim() || "General";
}

function categoryUnrestricted(cat: string | null | undefined): boolean {
  const c = (cat || "").trim().toLowerCase();
  return (
    !c ||
    c === "general" ||
    c === "other" ||
    c === "other / miscellaneous" ||
    c === "services" ||
    c === "services & labor"
  );
}

export function ServiceMaterialsEditor({
  businessId,
  excludeProductId,
  value,
  onChange,
  disabled = false,
  className,
  serviceReady = true,
  serviceCategory = null,
}: Props) {
  const { products = [], isLoading } = useProducts(businessId);
  const [query, setQuery] = useState("");
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [localError, setLocalError] = useState<string | null>(null);

  const locked = disabled || !serviceReady;
  const hasBinding = value.length > 0;
  const enforceCat = !categoryUnrestricted(serviceCategory);

  const candidates = useMemo(() => {
    const taken = new Set(value.map((v) => v.material_id));
    return (products as ProductResponse[])
      .filter((p) => p.active !== false)
      .filter(isProductKind)
      .filter((p) => p.id !== excludeProductId)
      .filter((p) => !taken.has(p.id))
      .filter((p) => {
        if (!enforceCat || !serviceCategory) return true;
        return productCategory(p).toLowerCase() === serviceCategory.trim().toLowerCase();
      })
      .filter((p) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        const sku = String(p.attributes?.sku || "").toLowerCase();
        return p.label.toLowerCase().includes(q) || sku.includes(q);
      })
      .slice(0, 80);
  }, [products, value, excludeProductId, query, enforceCat, serviceCategory]);

  const labelFor = (id: string, fallback?: string | null) => {
    const fromList = (products as ProductResponse[]).find((p) => p.id === id);
    return fromList?.label || fallback || id.slice(0, 8);
  };

  const stockFor = (id: string) => {
    const p = (products as ProductResponse[]).find((x) => x.id === id);
    if (!p) return null;
    if (!p.track_stock) return "Not tracked";
    return String(p.stock ?? 0);
  };

  const addOrReplace = () => {
    setLocalError(null);
    if (!serviceReady) {
      setLocalError("Save this item as a service first, then add a material.");
      return;
    }
    if (!pickId) {
      setLocalError("Choose a product to use as the material.");
      return;
    }
    const qty = Number(pickQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setLocalError("Quantity must be greater than zero.");
      return;
    }
    const p = (products as ProductResponse[]).find((x) => x.id === pickId);
    if (!p || !isProductKind(p)) {
      setLocalError("Materials must be products, not services.");
      return;
    }
    if (enforceCat && serviceCategory) {
      if (productCategory(p).toLowerCase() !== serviceCategory.trim().toLowerCase()) {
        setLocalError(
          `Only products in category "${serviceCategory}" can be bound to this service.`
        );
        return;
      }
    }
    onChange([
      {
        material_id: pickId,
        quantity: qty,
        material_label: p.label || null,
        material_category: productCategory(p),
      },
    ]);
    setPickId("");
    setPickQty("1");
    setQuery("");
  };

  const updateQty = (materialId: string, raw: string) => {
    const qty = Number(raw);
    onChange(
      value.slice(0, 1).map((v) =>
        v.material_id === materialId
          ? { ...v, quantity: Number.isFinite(qty) && qty > 0 ? qty : v.quantity }
          : v
      )
    );
  };

  const removeLine = () => onChange([]);

  if (!serviceReady) {
    return (
      <div
        className={cn(
          "space-y-2 rounded-xl border border-dashed border-border/80 bg-background/40 p-4",
          className
        )}
        role="status"
      >
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-muted" aria-hidden />
          Material used
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Save this item as a <strong className="text-foreground">service</strong> first. Then bind{" "}
          <strong className="text-foreground">one</strong> product it consumes (e.g. one tee size or
          one paper type). Different sizes are different products — pick the SKU you need, or create
          separate services.
        </p>
      </div>
    );
  }

  const line = value[0];

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border border-border/70 bg-background/40 p-4",
        className
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="h-4 w-4 text-brand-primary" aria-hidden />
          Material used
        </h3>
        <p className="text-xs leading-relaxed text-muted">
          One material product per service. When sold, that product&apos;s stock decreases by qty ×
          line quantity. Size and colour are separate products — choose one SKU.
          {enforceCat && serviceCategory
            ? ` Only products in category "${serviceCategory}" can be bound.`
            : " Set a specific service category to restrict materials to that category."}
        </p>
      </div>

      {!line ? (
        <p
          className="rounded-lg border border-dashed border-border/80 bg-card/50 px-3 py-4 text-center text-xs text-muted"
          role="status"
        >
          No material bound yet. The service can still be sold; nothing leaves stock until you bind a
          product.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {labelFor(line.material_id, line.material_label)}
            </p>
            <p className="text-[11px] text-muted">
              On hand: {stockFor(line.material_id) ?? "—"}
              {line.material_category ? ` · ${line.material_category}` : ""}
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span className="sr-only">Quantity per service</span>
            <span aria-hidden>Qty</span>
            <input
              type="number"
              min={0.01}
              step="any"
              disabled={locked}
              value={line.quantity}
              onChange={(e) => updateQty(line.material_id, e.target.value)}
              className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm font-mono tabular-nums text-foreground outline-none focus:ring-2 focus:ring-brand-primary/25"
            />
          </label>
          <button
            type="button"
            disabled={locked}
            onClick={removeLine}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-red-500/40 hover:text-[var(--error)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:opacity-50"
            aria-label="Remove material"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {hasBinding ? "Replace material" : "Bind material"}
        </p>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            disabled={locked}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or SKU…"
            className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:opacity-60"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-1">
            <span className="text-xs text-muted">Product</span>
            <select
              value={pickId}
              disabled={locked || isLoading}
              onChange={(e) => setPickId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:opacity-60"
            >
              <option value="">
                {isLoading ? "Loading products…" : "Select a product…"}
              </option>
              {candidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.track_stock ? ` · stock ${p.stock ?? 0}` : " · untracked"}
                  {` · ${productCategory(p)}`}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full space-y-1 sm:w-28">
            <span className="text-xs text-muted">Qty / unit</span>
            <input
              type="number"
              min={0.01}
              step="any"
              disabled={locked}
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm font-mono tabular-nums outline-none focus:ring-2 focus:ring-brand-primary/25"
            />
          </label>
          <button
            type="button"
            disabled={locked || isLoading}
            onClick={addOrReplace}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {hasBinding ? "Replace" : "Bind"}
          </button>
        </div>
        {localError && (
          <p className="text-xs font-medium text-[var(--error)]" role="alert">
            {localError}
          </p>
        )}
        {!isLoading && candidates.length === 0 && (
          <p className="text-xs text-muted">
            {enforceCat
              ? `No products in category "${serviceCategory}". Create one, or change the service category.`
              : "No product candidates. Create a stocked product first."}
          </p>
        )}
      </div>
    </div>
  );
}
