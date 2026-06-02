"use client";

import React from "react";
import { Package, Barcode, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Aesthetic: High-density layout optimize. Compresses padding and structural margins.
 * Grid Optimization: Fits 4 clean units in the core viewport without horizontal overflow.
 * Typography: Scales price and label elements cleanly to prevent wrapping clipping.
 */

interface ProductCardProps {
  product: ProductResponse;
  onAdd: (product: ProductResponse) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  // Safely extract from Orval's BaseAttributes
  const { sku, unit_of_measure } = product.attributes || {};
  const category = (product.attributes as any)?.category;

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.selling_price);

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isOutOfStock || !product.active}
      aria-label={`Add ${product.label} to cart.`}
      className={cn(
        "group relative flex flex-col text-left bg-card rounded-2xl p-4 transition-all duration-300",
        "w-full h-full shadow-soft hover:shadow-lg border border-transparent hover:border-primary/10",
        "hover:-translate-y-1 active:scale-[0.98]",
        (isOutOfStock || !product.active) &&
          "opacity-50 grayscale cursor-not-allowed shadow-none hover:translate-y-0",
      )}
    >
      {/* Visual Identity Area */}
      <div className="flex justify-between items-start mb-3 shrink-0 w-full">
        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-secondary/40 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-inner">
          <Package size={18} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-end">
          <div
            className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors",
              isOutOfStock
                ? "bg-red-500 text-white"
                : "bg-muted text-secondary/60 group-hover:bg-primary group-hover:text-white",
            )}
          >
            {isOutOfStock ? "Out" : `${product.stock} In Stock`}
          </div>
        </div>
      </div>

      {/* Info Cluster */}
      <div className="flex flex-col gap-1 flex-1 w-full min-w-0">
        <h3 className="font-bold text-foreground leading-snug uppercase tracking-tight group-hover:text-primary transition-colors text-sm truncate w-full">
          {product.label}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 w-full">
          {category && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-secondary/40 flex items-center gap-0.5 truncate max-w-[50%]">
              <Tag size={8} strokeWidth={3} /> {category}
            </span>
          )}
          {sku && (
            <div className="flex items-center gap-0.5 text-secondary/30 truncate max-w-[50%]">
              <Barcode size={10} />
              <span className="text-[9px] font-mono tracking-tighter uppercase truncate">
                {sku}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="mt-4 pt-3 border-t border-color-border/5 flex items-center justify-between w-full shrink-0">
        <div className="flex items-baseline gap-0.5 flex-wrap min-w-0">
          <span className="text-[9px] font-black text-secondary/30 uppercase tracking-tighter mr-0.5">
            Ksh
          </span>
          <span className="text-xl font-black tracking-tighter leading-none text-foreground break-all">
            {formattedPrice}
          </span>
          {unit_of_measure && (
            <span className="text-[9px] font-bold text-secondary/30 lowercase not-italic ml-0.5">
              /{unit_of_measure}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Surface Glow */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/[0.03] group-hover:ring-primary/20 transition-all pointer-events-none" />
    </button>
  );
}