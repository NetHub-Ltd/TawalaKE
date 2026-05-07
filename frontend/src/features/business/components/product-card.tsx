"use client";

import { Package, Barcode, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * UI/UX: Fixed dimensions (w-full / h-64) to prevent grid collapse.
 * Layout: Utilized flex-1 on the middle section to push financials to the bottom regardless of text length.
 * Tactile: Increased shadow-depth on hover for clear interactive signaling.
 */

interface ProductAttributes {
  sku?: string;
  category?: string;
  unit_price?: number;
  unit_of_measure?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  attributes?: ProductAttributes;
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const { sku, category, unit_of_measure } = product.attributes || {};

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isOutOfStock || !product.active}
      aria-label={`Add ${product.name} to cart. SKU: ${sku || "N/A"}. ${product.stock} ${unit_of_measure || "units"} available.`}
      className={cn(
        "group relative flex flex-col text-left bg-card border border-border/60 rounded-[2.5rem] p-6 transition-all duration-300",
        // Force dimensions to prevent collapse in grid
        "w-full h-42 min-w-[240px] max-w-[340px] shrink-0",
        "hover:shadow-md hover:border-primary/40 hover:-translate-y-2 active:scale-[0.96] shadow-soft",
        (isOutOfStock || !product.active) &&
          "opacity-50 grayscale cursor-not-allowed shadow-none hover:translate-y-0",
      )}
    >
      {/* Header: Visual Identity & Stock Status */}
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div className="h-14 w-14 rounded-2xl bg-background border border-border/20 group-hover:bg-primary/5 flex items-center justify-center transition-colors shadow-inner">
          <Package
            size={24}
            className="group-hover:text-primary text-secondary/60 transition-colors"
          />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div
            className={cn(
              "text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border",
              isOutOfStock
                ? "bg-red-50 text-red-600 border-red-100"
                : "bg-background text-secondary/80 border-border/40",
            )}
          >
            {isOutOfStock
              ? "Depleted"
              : `${product.stock}${unit_of_measure || ""} In Stock`}
          </div>
          {category && (
            <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-secondary/40 px-2 flex items-center gap-1">
              <Tag size={8} /> {category}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Identification - Flex-1 ensures it takes available space */}
      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        <h3 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug uppercase tracking-tight">
          {product.name}
        </h3>
        {sku && (
          <div className="flex items-center gap-1.5 text-secondary/50">
            <Barcode size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-mono tracking-tighter uppercase">
              {sku}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Financials */}
      <div className="mt-4 pt-4 border-t border-border/10 shrink-0">
        <p className="text-2xl text-foreground font-black tracking-tighter italic flex items-baseline gap-1 leading-none">
          <span className="text-[10px] font-black text-secondary/30 uppercase tracking-widest not-italic">
            Ksh
          </span>
          {product.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
          {unit_of_measure && (
            <span className="text-[10px] font-bold text-secondary/30 lowercase ml-0.5 not-italic">
              /{unit_of_measure}
            </span>
          )}
        </p>
      </div>

      {/* Interactive Overlay Glow */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-primary/0 group-hover:bg-primary/[0.03] pointer-events-none transition-colors" />
    </button>
  );
}