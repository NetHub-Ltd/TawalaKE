"use client";

/**
 * Fixed recipe editor: service → product materials + qty per 1 unit of service.
 *
 * Rules:
 * - Only usable after the catalogue item is persisted as SERVICE.
 * - Multiple physically different products may belong to one service (e.g. paper + tee).
 * - Each line is one product SKU (size/colour = separate products).
 * - Category filter lays foundation for tighter same-category constraints later.
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
  /** Current service id — excluded from material candidates */
  excludeProductId?: string | null;
  value: MaterialLine[];
  onChange: (next: MaterialLine[]) => void;
  disabled?: boolean;
  className?: string;
  /**
   * When false, editor is locked: convert/save as service first.
   * Default true for callers that already gate visibility.
   */
  serviceReady?: boolean;
  /** Service catalogue category — used as default filter (foundation for same-category rules). */
  serviceCategory?: string | null;
  /**
   * Foundation: when true, only products in `categoryFilter` (or serviceCategory) can be added.
   * Soft default false until we harden; UI still offers category filtering.
   */
  requireCategoryMatch?: boolean;
};

function isProductKind(p: ProductResponse): boolean {
  return p.item_type !== "SERVICE";
}

function productCategory(p: ProductResponse): string {
  return (p.category || "General").trim() || "General";
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
  requireCategoryMatch = false,
}: Props) {
  const { products = [], isLoading } = useProducts(businessId);
  const [query, setQuery] = useState("");
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [localError, setLocalError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(() =>
    serviceCategory && serviceCategory !== "other" && serviceCategory !== "General"
      ? serviceCategory
      : "ALL"
  );

  const locked = disabled || !serviceReady;

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products as ProductResponse[]) {
      if (!isProductKind(p) || p.active === false) continue;
      if (p.id === excludeProductId) continue;
      set.add(productCategory(p));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, excludeProductId]);

  const candidates = useMemo(() => {
    const taken = new Set(value.map((v) => v.material_id));
    return (products as ProductResponse[])
      .filter((p) => p.active !== false)
      .filter(isProductKind)
      .filter((p) => p.id !== excludeProductId)
      .filter((p) => !taken.has(p.id))
      .filter((p) => {
        if (categoryFilter === "ALL") {
          if (requireCategoryMatch && serviceCategory) {
            return productCategory(p) === serviceCategory;
          }
          return true;
        }
        return productCategory(p) === categoryFilter;
      })
      .filter((p) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        const sku = String(p.attributes?.sku || "").toLowerCase();
        return p.label.toLowerCase().includes(q) || sku.includes(q);
      })
      .slice(0, 80);
  }, [
    products,
    value,
    excludeProductId,
    query,
    categoryFilter,
    requireCategoryMatch,
    serviceCategory,
  ]);

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

  const categoryFor = (id: string) => {
    const p = (products as ProductResponse[]).find((x) => x.id === id);
    return p ? productCategory(p) : null;
  };

  const addLine = () => {
    setLocalError(null);
    if (!serviceReady) {
      setLocalError("Save this item as a service first, then add materials.");
      return;
    }
    if (!pickId) {
      setLocalError("Choose a product to use as a material.");
      return;
    }
    const qty = Number(pickQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setLocalError("Quantity must be greater than zero.");
      return;
    }
    if (value.some((v) => v.material_id === pickId)) {
      setLocalError("That product is already in the recipe.");
      return;
    }
    const p = (products as ProductResponse[]).find((x) => x.id === pickId);
    if (!p || !isProductKind(p)) {
      setLocalError("Materials must be products, not services.");
      return;
    }
    // Foundation for same-category hardening (soft when requireCategoryMatch)
    if (requireCategoryMatch && serviceCategory) {
      if (productCategory(p) !== serviceCategory) {
        setLocalError(
          `Only products in category “${serviceCategory}” can be added to this service for now.`
        );
        return;
      }
    }
    onChange([
      ...value,
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
      value.map((v) =>
        v.material_id === materialId
          ? { ...v, quantity: Number.isFinite(qty) && qty > 0 ? qty : v.quantity }
          : v
      )
    );
  };

  const removeLine = (materialId: string) => {
    onChange(value.filter((v) => v.material_id !== materialId));
  };

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
          Materials used
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          Save this item as a <strong className="text-foreground">service</strong> first. After it
          is a service, you can attach one or more products it consumes (e.g. different tee sizes,
          paper types). Physically different goods stay separate products in the recipe.
        </p>
      </div>
    );
  }

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
          Materials used
        </h3>
        <p className="text-xs leading-relaxed text-muted">
          One service can use several products (paper, blank tee M, blank tee L, …). Each line is
          one SKU — size and colour are different products, not attributes. Filter by category to
          narrow the list (foundation for stricter same-category rules later).
        </p>
      </div>

      {value.length === 0 ? (
        <p
          className="rounded-lg border border-dashed border-border/80 bg-card/50 px-3 py-4 text-center text-xs text-muted"
          role="status"
        >
          No materials yet. The service can still be sold; nothing leaves stock until you add
          products here.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Material recipe">
          {value.map((line) => (
            <li
              key={line.material_id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {labelFor(line.material_id, line.material_label)}
                </p>
                <p className="text-[11px] text-muted">
                  On hand: {stockFor(line.material_id) ?? "—"}
                  {(line.material_category || categoryFor(line.material_id)) && (
                    <>
                      {" "}
                      · {line.material_category || categoryFor(line.material_id)}
                    </>
                  )}
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
                onClick={() => removeLine(line.material_id)}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-red-500/40 hover:text-[var(--error)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 disabled:opacity-50"
                aria-label={`Remove ${labelFor(line.material_id, line.material_label)}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Add material</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-muted">Category filter</span>
            <select
              value={categoryFilter}
              disabled={locked}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPickId("");
              }}
              className="h-10 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:opacity-60"
            >
              <option value="ALL">All product categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="relative self-end">
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
              aria-label="Search products to add as materials"
            />
          </div>
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
            onClick={addLine}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
        </div>
        {localError && (
          <p className="text-xs font-medium text-[var(--error)]" role="alert">
            {localError}
          </p>
        )}
        {!isLoading && candidates.length === 0 && (
          <p className="text-xs text-muted">
            {query.trim() || categoryFilter !== "ALL"
              ? "No matching products in this filter. Try another category or search, or create the material product first."
              : "No product candidates left. Create stocked products first, then attach them here."}
          </p>
        )}
      </div>
    </div>
  );
}
