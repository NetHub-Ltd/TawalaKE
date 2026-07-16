// "use client";

// import React from "react";
// import { Package, Barcode, Tag } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Ultra-high-density micro layout optimized for rapid cashiers.
//  * UX: Compressed vertical spacing, stripped ambient badge padding, and downscaled stock metric.
//  * Architecture: Inline conditional typography configurations that eliminate system-level style leakages.
//  */

// interface ProductCardProps {
//   product: ProductResponse;
//   onAdd: (product: ProductResponse) => void;
// }

// export function ProductCard({ product, onAdd }: ProductCardProps) {
//   const isOutOfStock = product.stock <= 0;

//   // Safely extract from Orval's BaseAttributes
//   const { sku, unit_of_measure } = product.attributes || {};
//   const category = (product.attributes as any)?.category;

//   const formattedPrice = new Intl.NumberFormat("en-KE", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(product.selling_price);

//   return (
//     <button
//       type="button"
//       onClick={() => onAdd(product)}
//       disabled={isOutOfStock || !product.active}
//       aria-label={`Add ${product.label || "item"} to checkout tray.`}
//       className={`group relative flex flex-col text-left bg-card rounded-xl p-3.5 transition-all duration-200 w-full min-h-[11rem] border border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
//         isOutOfStock || !product.active
//           ? "opacity-40 grayscale cursor-not-allowed"
//           : "hover:border-brand-primary/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
//       }`}
//     >
//       {/* Visual Identity Area */}
//       <div className="flex justify-between items-center mb-2 shrink-0 w-full gap-2">
//         <div className="h-8 w-8 rounded-lg bg-surface/60 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/20">
//           <Package size={14} strokeWidth={2} aria-hidden="true" />
//         </div>

//         {/* Cashier Telemetry: High-density Micro Stock Tracker Indicator */}
//         <div className="flex items-center font-mono text-[10px] font-bold">
//           {isOutOfStock ? (
//             <span className="text-brand-accent uppercase tracking-wider">Out</span>
//           ) : (
//             <span className="text-muted">
//               Stock: <strong className="text-foreground font-black">{product.stock}</strong>
//             </span>
//           )}
//         </div>
//       </div>

//       {/* Info Cluster: Clamped margins to fix white space gap above pricing footer */}
//       <div className="flex flex-col gap-0.5 flex-1 w-full min-w-0 justify-start">
//         <h3 className="font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors text-xs truncate w-full">
//           {product.label}
//         </h3>

//         <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 w-full">
//           {category && (
//             <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-0.5 truncate max-w-[50%]">
//               <Tag size={8} strokeWidth={3} aria-hidden="true" /> {category}
//             </span>
//           )}
//           {sku && (
//             <div className="flex items-center gap-0.5 text-muted/60 truncate max-w-[50%]">
//               <Barcode size={10} aria-hidden="true" />
//               <span className="text-[9px] font-mono tracking-wider uppercase truncate">
//                 {sku}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Pricing Footer: Tightly anchored close to product name */}
//       <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between w-full shrink-0">
//         <div className="flex items-baseline gap-0.5 flex-wrap min-w-0 font-mono">
//           <span className="text-[9px] font-black text-muted uppercase tracking-tighter mr-0.5">
//             KES
//           </span>
//           <span className="text-base font-black tracking-tight leading-none text-foreground break-all">
//             {formattedPrice}
//           </span>
//           {unit_of_measure && (
//             <span className="text-[9px] font-bold text-muted lowercase not-italic ml-0.5">
//               /{unit_of_measure}
//             </span>
//           )}
//         </div>
//       </div>
//     </button>
//   );
// }

"use client";

import React from "react";
import { Package, Barcode, Tag } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Aesthetic: Ultra-high-density micro layout optimized for rapid cashiers.
 * UX: Adaptive dual-mode structural configuration support (Card/Row). Handles long string wraps elegantly.
 * Architecture: Inline conditional typography configurations that eliminate system-level style leakages.
 */

interface ProductCardProps {
  product: ProductResponse;
  onAdd: (product: ProductResponse) => void;
  viewMode?: "card" | "row"; // Prop injection to control layout format
}

export function ProductCard({ product, onAdd, viewMode = "card" }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isCard = viewMode === "card";

  // Safely extract from Orval's BaseAttributes
  const { sku, unit_of_measure } = product.attributes || {};
  const category = (product.attributes as any)?.category;

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.selling_price);

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={isOutOfStock || !product.active}
      aria-label={`Add ${product.label || "item"} to checkout tray.`}
      className={`group relative flex text-left bg-card rounded-xl transition-all duration-200 w-full border border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
        isCard 
          ? "flex-col p-3.5 min-h-[11rem]" 
          : "flex-row items-center justify-between p-2.5 min-h-[4.25rem] gap-4"
      } ${
        isOutOfStock || !product.active
          ? "opacity-40 grayscale cursor-not-allowed"
          : "hover:border-brand-primary/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
      }`}
    >
      {/* --- CORE CONTENT ZONE --- */}
      <div className={`flex min-w-0 flex-1 ${isCard ? "flex-col w-full" : "items-center gap-3"}`}>
        
        {/* Visual Identity Frame */}
        <div className={`flex items-center shrink-0 ${isCard ? "justify-between mb-2 w-full gap-2" : "gap-3"}`}>
          <div className="h-8 w-8 rounded-lg bg-surface/60 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/20 shrink-0">
            <Package size={14} strokeWidth={2} aria-hidden="true" />
          </div>

          {/* Cashier Telemetry: High-density Micro Stock Tracker (Card Only Positioning) */}
          {isCard && (
            <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
              {isOutOfStock ? (
                <span className="text-brand-accent uppercase tracking-wider">Out</span>
              ) : (
                <span className="text-muted">
                  Stock: <strong className="text-foreground font-black">{product.stock}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info Cluster: Handles long labels cleanly */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0 justify-start w-full">
          <h3 className={`font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors text-xs w-full ${
            isCard ? "line-clamp-2 min-h-[2rem]" : "truncate"
          }`}>
            {product.label}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 w-full">
            {category && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-0.5 truncate max-w-[110px]">
                <Tag size={8} strokeWidth={3} aria-hidden="true" /> {category}
              </span>
            )}
            {sku && (
              <div className="flex items-center gap-0.5 text-muted/60 truncate max-w-[110px]">
                <Barcode size={10} aria-hidden="true" />
                <span className="text-[9px] font-mono tracking-wider uppercase truncate">
                  {sku}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TELEMETRY FOOTER & PRICING METRICS ZONE --- */}
      <div className={`shrink-0 flex items-center ${
        isCard 
          ? "mt-2 pt-2 border-t border-border/30 justify-between w-full" 
          : "gap-6 text-right pl-2 justify-end"
      }`}>
        
        {/* Cashier Telemetry: High-density Micro Stock Tracker (Row Only Positioning) */}
        {!isCard && (
          <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
            {isOutOfStock ? (
              <span className="text-brand-accent uppercase tracking-wider">Out</span>
            ) : (
              <span className="text-muted">
                Stock: <strong className="text-foreground font-black">{product.stock}</strong>
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-0.5 min-w-0 font-mono tracking-tight justify-end shrink-0">
          <span className="text-[9px] font-black text-muted uppercase tracking-tighter mr-0.5">
            KES
          </span>
          <span className="text-base font-black leading-none text-foreground">
            {formattedPrice}
          </span>
          {unit_of_measure && (
            <span className="text-[9px] font-bold text-muted lowercase not-italic ml-0.5">
              /{unit_of_measure}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}