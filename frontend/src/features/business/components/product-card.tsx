// "use client";

// import React from "react";
// import { Package, Tag, Flame } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Keyboard Telemetry: Supports Ctrl+Click / Cmd+Click gesture for high-speed cart eviction.
//  * Accessibility: Replaced HTML disabled attribute with aria-disabled to keep click handlers 
//  * active for keyboard/click modifier events while maintaining screen-reader state.
//  * Visual Indicator: Micro hotkey legend prompt for cashier onboarding.
//  */

// interface ProductCardProps {
//   product: ProductResponse;
//   onInteract: (product: ProductResponse, event: React.MouseEvent) => void;
//   viewMode?: "card" | "row";
// }

// export function ProductCard({
//   product,
//   onInteract,
//   viewMode = "card",
// }: ProductCardProps) {
//   const isOutOfStock = product.track_stock && product.stock <= 0;
//   const isCard = viewMode === "card";

//   const stock = product.stock;
//   const isModerateStock = product.track_stock && stock >= 5 && stock <= 10;
//   const isCriticalStock = product.track_stock && stock > 0 && stock < 5;

//   const { unit_of_measure } = product.attributes || {};
//   const category = product.category || (product.attributes as any)?.category;
//   const popularity = product.popularity_score;

//   const formattedPrice = new Intl.NumberFormat("en-KE", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(product.selling_price);

//   return (
//     <button
//       type="button"
//       onClick={(e) => onInteract(product, e)}
//       aria-disabled={isOutOfStock || !product.active}
//       aria-label={`${product.label}. Price: KES ${formattedPrice}. Stock: ${
//         product.track_stock ? product.stock : "Unlimited"
//       }. Hold Ctrl and click to remove from cart.`}
//       className={`group relative flex text-left rounded-2xl transition-all duration-200 w-full border border-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
//         isCard
//           ? "flex-col p-3.5 min-h-[10.5rem]"
//           : "flex-row items-center justify-between p-3 min-h-[4.25rem] gap-4"
//       } ${
//         isOutOfStock || !product.active
//           ? "opacity-55 grayscale-[40%] bg-card/40 hover:border-rose-500/40 cursor-pointer"
//           : "bg-card hover:border-brand-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs cursor-pointer"
//       }`}
//     >
//       {/* Shortcut Visual Chip (Hover State) */}
//       <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/90 text-background text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-20">
//         Ctrl + Click to Remove
//       </span>

//       {/* --- CORE CONTENT ZONE --- */}
//       <div className={`flex min-w-0 flex-1 ${isCard ? "flex-col w-full" : "items-center gap-3"}`}>
//         {/* Visual Header Node & Metrics */}
//         <div className={`flex items-center shrink-0 ${isCard ? "justify-between mb-2 w-full gap-2" : "gap-3"}`}>
//           {/* <div className="h-8 w-8 rounded-xl bg-surface/80 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/30 shrink-0 shadow-2xs">
//             <Package size={15} strokeWidth={2} aria-hidden="true" />
//           </div> */}

//           {/* Popularity Badge & Soft Stock Indicators (Card View) */}
//           {isCard && (
//             <div className="flex items-center gap-1.5 shrink-0">
//               {popularity != null && popularity > 0 && (
//                 <span 
//                   className="px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-mono font-bold flex items-center gap-1"
//                   title={`Popularity Score: ${popularity}`}
//                 >
//                   <Flame size={10} className="fill-brand-primary/30" />
//                   {Math.round(popularity)}
//                 </span>
//               )}

//               {product.track_stock && (
//                 <div className="flex items-center font-mono text-[10px] font-bold">
//                   {isOutOfStock ? (
//                     <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-mono uppercase tracking-wider font-extrabold">
//                       Out of Stock
//                     </span>
//                   ) : isCriticalStock ? (
//                     <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                       <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
//                       Stock: <strong className="font-black">{stock}</strong>
//                     </span>
//                   ) : isModerateStock ? (
//                     <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
//                       Stock: <strong className="font-black">{stock}</strong>
//                     </span>
//                   ) : (
//                     <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                       Stock: <strong className="font-black">{stock}</strong>
//                     </span>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Info Cluster */}
//         <div className="flex flex-col gap-1 flex-1 min-w-0 justify-start w-full">
//           <h3 className={`font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors text-xs w-full ${
//             isCard ? "line-clamp-2 min-h-[2rem]" : "truncate"
//           }`}>
//             {product.label}
//           </h3>

//           {category && (
//             <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1 truncate max-w-[140px]">
//               <Tag size={9} strokeWidth={2.5} aria-hidden="true" /> {category}
//             </span>
//           )}
//         </div>
//       </div>

//       {/* --- PRICING METRICS ZONE --- */}
//       <div className={`shrink-0 flex items-center ${
//         isCard
//           ? "mt-2.5 pt-2 border-t border-border/40 justify-between w-full"
//           : "gap-4 text-right pl-2 justify-end"
//       }`}>
//         {!isCard && product.track_stock && (
//           <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
//             {isOutOfStock ? (
//               <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] uppercase tracking-wider font-extrabold">
//                 Out of Stock
//               </span>
//             ) : isCriticalStock ? (
//               <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
//                 Stock: <strong className="font-black">{stock}</strong>
//               </span>
//             ) : isModerateStock ? (
//               <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
//                 Stock: <strong className="font-black">{stock}</strong>
//               </span>
//             ) : (
//               <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                 Stock: <strong className="font-black">{stock}</strong>
//               </span>
//             )}
//           </div>
//         )}

//         <div className="flex items-baseline gap-0.5 min-w-0 font-mono tracking-tight justify-end shrink-0">
//           <span className="text-[9px] font-black text-muted uppercase tracking-tighter mr-0.5">
//             KES
//           </span>
//           <span className="text-base font-black leading-none text-foreground">
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

import React, { forwardRef } from "react";
import { Tag, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Keyboard Telemetry: Supports Ctrl+Click / Cmd+Click gesture for high-speed cart eviction.
 * Accessibility: Replaced HTML disabled attribute with aria-disabled to keep click handlers 
 * active for keyboard/click modifier events while maintaining screen-reader state.
 * Visual Indicator: Micro hotkey legend prompt for cashier onboarding.
 */

export interface ProductCardProps {
  /** The product data object from the API */
  product: ProductResponse;
  /** Interaction handler triggered on click or modifier-click */
  onInteract: (product: ProductResponse, event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Layout style: 'card' for grids, 'row' for dense lists */
  viewMode?: "card" | "row";
  /** Optional standard className override */
  className?: string;
}

/**
 * A highly interactive, theme-aware product display component.
 * Supports fluid layout modes, stock metrics, and keyboard-modifier interactions.
 */
export const ProductCard = forwardRef<HTMLButtonElement, ProductCardProps>(
  ({ product, onInteract, viewMode = "card", className }, ref) => {
    const isCard = viewMode === "card";
    const stock = product.stock;
    
    // Core Logic Flags
    const isOutOfStock = product.track_stock && stock <= 0;
    const isModerateStock = product.track_stock && stock >= 5 && stock <= 10;
    const isCriticalStock = product.track_stock && stock > 0 && stock < 5;
    const isInactive = !product.active;

    // Safe Attribute Extraction (No 'any' type)
    const attributes = product.attributes as Record<string, unknown> | undefined;
    const unit_of_measure = attributes?.unit_of_measure as string | undefined;
    const category = product.category || (attributes?.category as string | undefined);
    const popularity = product.popularity_score;

    const formattedPrice = new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(product.selling_price);

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => onInteract(product, e)}
        aria-disabled={isOutOfStock || isInactive}
        aria-label={`${product.label}. Price: KES ${formattedPrice}. Stock: ${
          product.track_stock ? stock : "Unlimited"
        }. Hold Ctrl and click to remove from cart.`}
        className={cn(
          "group relative flex w-full text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
          // View Mode Styling
          isCard
            ? "card-layered flex-col p-4 min-h-[11rem]"
            : "flex-row items-center justify-between p-3 min-h-[4.5rem] gap-4 rounded-2xl bg-card border border-border/60 hover:border-brand-primary/30 hover:shadow-sm active:scale-[0.99]",
          // Disabled / Out of Stock Styling
          (isOutOfStock || isInactive)
            ? "opacity-60 grayscale-[40%] bg-card/40 hover:border-rose-500/40 cursor-pointer"
            : "cursor-pointer",
          className
        )}
      >
        {/* Shortcut Visual Chip (Hover State) */}
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-mono font-medium px-2 py-0.5 rounded-md shadow-sm pointer-events-none z-20">
          Ctrl + Click to Remove
        </span>

        {/* --- CORE CONTENT ZONE --- */}
        <div className={cn("flex min-w-0 flex-1", isCard ? "flex-col w-full" : "items-center gap-3")}>
          
          {/* Visual Header Node & Metrics (Card View Only) */}
          <div className={cn("flex items-center shrink-0", isCard ? "justify-between mb-3 w-full gap-2" : "hidden")}>
            <div className="flex items-center gap-2 shrink-0">
              {popularity != null && popularity > 0 && (
                <span
                  className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs"
                  title={`Popularity Score: ${popularity}`}
                >
                  <Flame size={12} className="fill-brand-primary/30" />
                  {Math.round(popularity)}
                </span>
              )}
              {product.track_stock && <StockIndicator stock={stock} status={{ isOutOfStock, isCriticalStock, isModerateStock }} />}
            </div>
          </div>

          {/* Info Cluster */}
          <div className="flex flex-col gap-1 flex-1 min-w-0 justify-start w-full">
            <h3
              className={cn(
                "font-bold text-foreground leading-tight tracking-tight transition-colors group-hover:text-brand-primary",
                isCard ? "text-sm line-clamp-2 min-h-[2.5rem]" : "text-base truncate"
              )}
            >
              {product.label}
            </h3>

            {category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 truncate max-w-[160px]">
                <Tag size={10} strokeWidth={2.5} aria-hidden="true" /> {category}
              </span>
            )}
          </div>
        </div>

        {/* --- PRICING & METRICS ZONE --- */}
        <div
          className={cn(
            "shrink-0 flex items-center",
            isCard
              ? "mt-4 pt-3 border-t border-border/40 justify-between w-full"
              : "gap-4 text-right pl-3 justify-end"
          )}
        >
          {/* Stock Indicator for Row View */}
          {!isCard && product.track_stock && (
            <div className="shrink-0">
              <StockIndicator stock={stock} status={{ isOutOfStock, isCriticalStock, isModerateStock }} />
            </div>
          )}

          {/* Pricing Block */}
          <div className="flex items-baseline gap-1 min-w-0 font-mono tracking-tight justify-end shrink-0">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              KES
            </span>
            <span className="text-lg font-black leading-none text-foreground">
              {formattedPrice}
            </span>
            {unit_of_measure && (
              <span className="text-[10px] font-semibold text-muted lowercase">
                /{unit_of_measure}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }
);

ProductCard.displayName = "ProductCard";

// --- Subcomponents ---

/**
 * Internal helper component to render standardized stock badges.
 * Utilizes standard Tailwind colors for universal states (rose/amber) and theme accent for positive.
 */
function StockIndicator({
  stock,
  status,
}: {
  stock: number;
  status: { isOutOfStock: boolean; isCriticalStock: boolean; isModerateStock: boolean };
}) {
  if (status.isOutOfStock) {
    return (
      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-mono uppercase tracking-wider font-extrabold shadow-xs">
        Out of Stock
      </span>
    );
  }
  
  if (status.isCriticalStock) {
    return (
      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] flex items-center gap-1.5 font-mono shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Stock: <strong className="font-black">{stock}</strong>
      </span>
    );
  }
  
  if (status.isModerateStock) {
    return (
      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] flex items-center gap-1.5 font-mono shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Stock: <strong className="font-black">{stock}</strong>
      </span>
    );
  }

  // Using the requested --brand-accent for standard positive stock state
  return (
    <span className="px-2 py-0.5 rounded-md bg-brand-accent/10 text-brand-accent border border-brand-accent/20 text-[10px] flex items-center gap-1.5 font-mono shadow-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
      Stock: <strong className="font-black">{stock}</strong>
    </span>
  );
}