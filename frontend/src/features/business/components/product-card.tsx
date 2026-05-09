"use client";

import React from "react";
import { Package, Barcode, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Aesthetic: "Soft-Native" refactor. Reduced border weight, enhanced shadow depth.
 * Interaction: Scale-down active state and hover lift for tactile feedback.
 * Typography: Fluid sizing for price to ensure visibility on high-res displays.
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
        "group relative flex flex-col text-left bg-card rounded-[2.5rem] p-6 transition-all duration-500",
        "w-full h-full min-w-[220px] shadow-soft hover:shadow-xl border border-transparent hover:border-primary/10",
        "hover:-translate-y-2 active:scale-[0.97]",
        (isOutOfStock || !product.active) &&
          "opacity-50 grayscale cursor-not-allowed shadow-none hover:translate-y-0",
      )}
    >
      {/* Visual Identity Area */}
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div className="h-14 w-14 rounded-[1.25rem] bg-background flex items-center justify-center text-secondary/40 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-inner">
          <Package size={24} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div
            className={cn(
              "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-colors",
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
      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className="font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-primary transition-colors text-base">
          {product.label}
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/40 flex items-center gap-1">
              <Tag size={10} strokeWidth={3} /> {category}
            </span>
          )}
          {sku && (
            <div className="flex items-center gap-1 text-secondary/30">
              <Barcode size={12} />
              <span className="text-[10px] font-mono tracking-tighter uppercase">
                {sku}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="mt-6 pt-5 border-t border-color-border/5 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-black text-secondary/30 uppercase tracking-tighter">
            Ksh
          </span>
          <span className="text-2xl font-black tracking-tighter leading-none text-foreground">
            {formattedPrice}
          </span>
          {unit_of_measure && (
            <span className="text-[10px] font-bold text-secondary/30 lowercase not-italic">
              /{unit_of_measure}
            </span>
          )}
        </div>

        {/* Rapid-Add Indicator */}
        {/* <div className="h-8 w-8 rounded-full bg-primary/0 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
          <Plus size={16} strokeWidth={3} />
        </div> */}
      </div>

      {/* Interactive Surface Glow */}
      <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-foreground/[0.03] group-hover:ring-primary/20 transition-all pointer-events-none" />
    </button>
  );
}