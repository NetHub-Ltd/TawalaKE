"use client";

import React from "react";
import { Trash2, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BaseAttributes {
  unit_of_measure?: string | null;
  buying_price?: number | null;
  sku?: string | null;
}

export interface ProductResponse {
  id: string;
  label: string;
  selling_price: number;
  track_stock: boolean;
  /** ISO timestamp of last physical count / stock take when API provides it */
  last_stock_take?: string | null;
  stock: number;
  popularity_score?: number | null;
  active: boolean;
  category?: string;
  attributes: BaseAttributes;
}

interface ProductSmartRowProps {
  product: ProductResponse;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

type StockAlertState = "normal" | "low" | "crisis" | "untracked";

function auditFreshness(lastStockTake: string | null | undefined): {
  borderClass: string;
  title: string;
} {
  if (!lastStockTake) {
    return {
      borderClass: "border-l-4 border-l-red-500",
      title: "Never counted — open workspace and run Count stock",
    };
  }
  const days =
    (Date.now() - new Date(lastStockTake).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) {
    return {
      borderClass: "border-l-4 border-l-emerald-500",
      title: `Last count within a month (${new Date(lastStockTake).toLocaleDateString()})`,
    };
  }
  return {
    borderClass: "border-l-4 border-l-amber-500",
    title: `Last count over a month ago (${new Date(lastStockTake).toLocaleDateString()})`,
  };
}

export function ProductSmartRow({ product, onOpen, onDelete }: ProductSmartRowProps) {
  const {
    label,
    selling_price,
    track_stock,
    stock,
    active,
    id,
    last_stock_take,
    popularity_score,
  } = product;
  const { sku, unit_of_measure } = product.attributes || {};

  const displaySku = sku && sku.trim() !== "" ? sku : "No SKU";
  const displayUom =
    unit_of_measure && unit_of_measure.trim() !== "" ? unit_of_measure : "Pcs";

  const { borderClass: auditBorder, title: auditTitle } =
    auditFreshness(last_stock_take);

  let stockAlertState: StockAlertState = "normal";
  if (!track_stock) {
    stockAlertState = "untracked";
  } else if (stock === 0) {
    stockAlertState = "crisis";
  } else if (stock <= 5) {
    stockAlertState = "low";
  }

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(selling_price);

  return (
    <tr
      data-active={active}
      data-alert={stockAlertState}
      role="link"
      tabIndex={0}
      title={auditTitle}
      onClick={() => onOpen(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(id);
        }
      }}
      className={cn(
        "group cursor-pointer border-b border-border bg-card/40 transition-all duration-200 ease-in-out",
        auditBorder,
        "hover:bg-brand-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-inset",
        "data-[active=false]:bg-secondary/5 data-[active=false]:opacity-50",
        "data-[alert=crisis]:bg-red-500/5 dark:data-[alert=crisis]:bg-red-500/10",
        "data-[alert=low]:bg-amber-500/5 dark:data-[alert=low]:bg-amber-500/10"
      )}
    >
      <td className="px-6 py-4 align-middle">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            {label}
            {!active && (
              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Inactive
              </span>
            )}
          </span>
          <span className="mt-0.5 font-mono text-xs tracking-tight text-secondary">
            {displaySku}
          </span>
          {last_stock_take ? (
            <span
              className="mt-1 text-[11px] text-muted"
              title="Last physical count or stock adjustment recorded for this product"
            >
              Last count: {new Date(last_stock_take).toLocaleDateString()}
            </span>
          ) : track_stock ? (
            <span
              className="mt-1 text-[11px] text-muted"
              title="No stock count recorded yet"
            >
              Not counted yet
            </span>
          ) : null}
        </div>
      </td>

      <td className="px-6 py-4 align-middle text-right font-mono">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-extrabold text-foreground">
            {formattedPrice}
          </span>
          <span
            className="text-[11px] text-muted"
            title="Relative sales activity score for this product"
          >
            Sales activity:{" "}
            {popularity_score != null
              ? Number(popularity_score).toFixed(1)
              : "—"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex items-center justify-start">
          {stockAlertState === "untracked" && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
              <Infinity size={12} aria-hidden="true" />
              <span>Service</span>
            </div>
          )}

          {stockAlertState === "normal" && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span>
                {stock} {displayUom}
              </span>
            </div>
          )}

          {stockAlertState === "low" && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 motion-safe:animate-pulse dark:text-amber-400">
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                aria-hidden="true"
              />
              <span>
                Low: {stock} {displayUom}
              </span>
            </div>
          )}

          {stockAlertState === "crisis" && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-600 dark:text-red-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:hidden" />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"
                  aria-hidden="true"
                />
              </span>
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </td>

      <td
        className="px-6 py-4 align-middle text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpen(id)}
            title="Open stock workspace — receive, count, adjust, history"
            aria-label={`Open stock workspace for ${label}`}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => onDelete(id)}
            title="Delete product from catalogue"
            aria-label={`Delete ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
