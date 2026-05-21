"use client";

import React from "react";
import { Edit2, Trash2, Infinity } from "lucide-react";

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
  stock: number;
  active: boolean;
  attributes: BaseAttributes;
}

interface ProductSmartRowProps {
  product: ProductResponse;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductSmartRow({ product, onEdit, onDelete }: ProductSmartRowProps) {
  const { label, selling_price, track_stock, stock, active, id } = product;
  const { sku, unit_of_measure } = product.attributes || {};

  // 1. Flatten Data Representation for Noise Reduction
  const displaySku = sku && sku.trim() !== "" ? sku : "No SKU";
  const displayUom = unit_of_measure && unit_of_measure.trim() !== "" ? unit_of_measure : "Pcs";

  // 2. Compute Stock Alert Matrix
  let stockAlertState: "normal" | "low" | "crisis" | "untracked" = "normal";
  if (!track_stock) {
    stockAlertState = "untracked";
  } else if (stock === 0) {
    stockAlertState = "crisis";
  } else if (stock <= 5) {
    stockAlertState = "low";
  }

  // 3. Format Currency securely (Kenyan SME Context - KES)
  const formattedPrice = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(selling_price);

  return (
    <tr
      data-active={active}
      data-alert={stockAlertState}
      className="
        group border-b border-border bg-card/40 transition-all duration-200 ease-in-out
        hover:bg-primary/5
        data-[active=false]:opacity-40 data-[active=false]:pointer-events-none data-[active=false]:bg-secondary/5
        data-[alert=crisis]:bg-red-500/5 dark:data-[alert=crisis]:bg-red-500/10
        data-[alert=low]:bg-amber-500/5 dark:data-[alert=low]:bg-amber-500/10
      "
    >
      {/* COLUMN 1: CORE PRODUCT IDENTITY */}
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {label}
          </span>
          <span className="text-xs text-secondary font-mono tracking-tight mt-0.5">
            {displaySku}
          </span>
        </div>
      </td>

      {/* COLUMN 2: FINANCIAL MATRIX */}
      <td className="px-6 py-4 align-middle text-right font-mono">
        <span className="text-sm font-extrabold text-foreground">
          {formattedPrice}
        </span>
      </td>

      {/* COLUMN 3: LIVE INVENTORY STATUS (BETTING-INSPIRED SMART FLASH MATRIX) */}
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center justify-start">
          {stockAlertState === "untracked" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary border border-border">
              <Infinity size={12} aria-hidden="true" />
              <span>Service</span>
            </div>
          )}

          {stockAlertState === "normal" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{stock} {displayUom}</span>
            </div>
          )}

          {stockAlertState === "low" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span>Low: {stock} {displayUom}</span>
            </div>
          )}

          {stockAlertState === "crisis" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" aria-hidden="true" />
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </td>

      {/* COLUMN 4: CONTEXTUAL ACTIONS */}
      <td className="px-6 py-4 align-middle text-right">
        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(id)}
            type="button"
            aria-label={`Edit ${label}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-150 hover:border-primary hover:text-primary active:scale-95"
          >
            <Edit2 size={14} />
          </button>
          
          <button
            onClick={() => onDelete(id)}
            type="button"
            aria-label={`Delete ${label}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-secondary transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 active:scale-95"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}