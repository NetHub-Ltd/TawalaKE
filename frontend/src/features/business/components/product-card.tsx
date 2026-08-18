// "use client";

// import React from "react";
// import { Package, Barcode, Tag } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Ultra-high-density micro layout optimized for rapid cashiers.
//  * UX: Adaptive dual-mode structural configuration support (Card/Row). Handles long string wraps elegantly.
//  * Architecture: Inline conditional typography configurations that eliminate system-level style leakages.
//  */

// interface ProductCardProps {
//   product: ProductResponse;
//   onAdd: (product: ProductResponse) => void;
//   viewMode?: "card" | "row"; // Prop injection to control layout format
// }

// export function ProductCard({ product, onAdd, viewMode = "card" }: ProductCardProps) {
//   const isOutOfStock = product.stock <= 0;
//   const isCard = viewMode === "card";

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
//       className={`group relative flex text-left bg-card rounded-xl transition-all duration-200 w-full border border-border/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
//         isCard 
//           ? "flex-col p-3.5 min-h-[11rem]" 
//           : "flex-row items-center justify-between p-2.5 min-h-[4.25rem] gap-4"
//       } ${
//         isOutOfStock || !product.active
//           ? "opacity-40 grayscale cursor-not-allowed"
//           : "hover:border-brand-primary/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
//       }`}
//     >
//       {/* --- CORE CONTENT ZONE --- */}
//       <div className={`flex min-w-0 flex-1 ${isCard ? "flex-col w-full" : "items-center gap-3"}`}>
        
//         {/* Visual Identity Frame */}
//         <div className={`flex items-center shrink-0 ${isCard ? "justify-between mb-2 w-full gap-2" : "gap-3"}`}>
//           <div className="h-8 w-8 rounded-lg bg-surface/60 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/20 shrink-0">
//             <Package size={14} strokeWidth={2} aria-hidden="true" />
//           </div>

//           {/* Cashier Telemetry: High-density Micro Stock Tracker (Card Only Positioning) */}
//           {isCard && (
//             <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
//               {isOutOfStock ? (
//                 <span className="text-brand-accent uppercase tracking-wider">Out</span>
//               ) : (
//                 <span className="text-muted">
//                   Stock: <strong className="text-foreground font-black">{product.stock}</strong>
//                 </span>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Info Cluster: Handles long labels cleanly */}
//         <div className="flex flex-col gap-0.5 flex-1 min-w-0 justify-start w-full">
//           <h3 className={`font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors text-xs w-full ${
//             isCard ? "line-clamp-2 min-h-[2rem]" : "truncate"
//           }`}>
//             {product.label}
//           </h3>

//           <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 w-full">
//             {category && (
//               <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-0.5 truncate max-w-[110px]">
//                 <Tag size={8} strokeWidth={3} aria-hidden="true" /> {category}
//               </span>
//             )}
//             {sku && (
//               <div className="flex items-center gap-0.5 text-muted/60 truncate max-w-[110px]">
//                 <Barcode size={10} aria-hidden="true" />
//                 <span className="text-[9px] font-mono tracking-wider uppercase truncate">
//                   {sku}
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* --- TELEMETRY FOOTER & PRICING METRICS ZONE --- */}
//       <div className={`shrink-0 flex items-center ${
//         isCard 
//           ? "mt-2 pt-2 border-t border-border/30 justify-between w-full" 
//           : "gap-6 text-right pl-2 justify-end"
//       }`}>
        
//         {/* Cashier Telemetry: High-density Micro Stock Tracker (Row Only Positioning) */}
//         {!isCard && (
//           <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
//             {isOutOfStock ? (
//               <span className="text-brand-accent uppercase tracking-wider">Out</span>
//             ) : (
//               <span className="text-muted">
//                 Stock: <strong className="text-foreground font-black">{product.stock}</strong>
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

// "use client";

// import React from "react";
// import { Package, Tag } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Elevated micro-elevation card floating cleanly off document surface.
//  * UX: Low-stock telemetry trigger (<= 10 units) displaying a soft amber visual pulse.
//  * Telemetry: Excised SKU noise to prioritize high-speed label scanning for cashiers.
//  */

// interface ProductCardProps {
//   product: ProductResponse;
//   onAdd: (product: ProductResponse) => void;
//   viewMode?: "card" | "row";
// }

// export function ProductCard({ product, onAdd, viewMode = "card" }: ProductCardProps) {
//   const isOutOfStock = product.stock <= 0;
//   const isLowStock = product.stock > 0 && product.stock <= 10;
//   const isCard = viewMode === "card";

//   // Extract category attribute safely without SKU dependencies
//   const { unit_of_measure } = product.attributes || {};
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
//       aria-label={`Add ${product.label || "item"} to checkout. Stock: ${product.stock}`}
//       className={`group relative flex text-left bg-card rounded-2xl transition-all duration-300 w-full border border-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
//         isCard
//           ? "flex-col p-3.5 min-h-[10rem]"
//           : "flex-row items-center justify-between p-3 min-h-[4.25rem] gap-4"
//       } ${
//         isOutOfStock || !product.active
//           ? "opacity-45 grayscale cursor-not-allowed bg-card/60"
//           : "hover:border-brand-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs cursor-pointer"
//       }`}
//     >
//       {/* --- CORE CONTENT ZONE --- */}
//       <div className={`flex min-w-0 flex-1 ${isCard ? "flex-col w-full" : "items-center gap-3"}`}>
        
//         {/* Visual Identity Frame */}
//         <div className={`flex items-center shrink-0 ${isCard ? "justify-between mb-2 w-full gap-2" : "gap-3"}`}>
//           <div className="h-8 w-8 rounded-xl bg-surface/80 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/30 shrink-0 shadow-2xs">
//             <Package size={15} strokeWidth={2} aria-hidden="true" />
//           </div>

//           {/* Cashier Telemetry: High-density Micro Stock Tracker (Card Position) */}
//           {isCard && (
//             <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
//               {isOutOfStock ? (
//                 <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-mono uppercase tracking-wider">
//                   Out
//                 </span>
//               ) : isLowStock ? (
//                 <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
//                   Low: <strong className="font-black">{product.stock}</strong>
//                 </span>
//               ) : (
//                 <span className="text-muted text-[10px]">
//                   Stock: <strong className="text-foreground font-black">{product.stock}</strong>
//                 </span>
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

//       {/* --- TELEMETRY FOOTER & PRICING METRICS ZONE --- */}
//       <div className={`shrink-0 flex items-center ${
//         isCard
//           ? "mt-2.5 pt-2 border-t border-border/40 justify-between w-full"
//           : "gap-6 text-right pl-2 justify-end"
//       }`}>
        
//         {/* Cashier Telemetry: High-density Micro Stock Tracker (Row Position) */}
//         {!isCard && (
//           <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
//             {isOutOfStock ? (
//               <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-mono uppercase tracking-wider">
//                 Out
//               </span>
//             ) : isLowStock ? (
//               <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
//                 Low: <strong className="font-black">{product.stock}</strong>
//               </span>
//             ) : (
//               <span className="text-muted text-[10px]">
//                 Stock: <strong className="text-foreground font-black">{product.stock}</strong>
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

// "use client";

// import React from "react";
// import { Package, Tag, Flame } from "lucide-react";
// import { ProductResponse } from "@/lib/api/generated/models";

// /**
//  * @Scribe_Audit
//  * Aesthetic: Elevated micro-elevation card floating cleanly off document surface canvas.
//  * Telemetry: Tri-tier soft stock status indicators (Green > 10 | Amber 5-10 | Soft Red < 5).
//  * Metrics: Popularity score micro-badge integration for high-speed cashier telemetry.
//  */

// interface ProductCardProps {
//   product: ProductResponse;
//   onAdd: (product: ProductResponse) => void;
//   viewMode?: "card" | "row";
// }

// export function ProductCard({
//   product,
//   onAdd,
//   viewMode = "card",
// }: ProductCardProps) {
//   const isOutOfStock = product.track_stock && product.stock <= 0;
//   const isCard = viewMode === "card";

//   const stock = product.stock;
//   const isHealthyStock = !product.track_stock || stock > 10;
//   const isModerateStock = product.track_stock && stock >= 5 && stock <= 10;
//   const isCriticalStock = product.track_stock && stock > 0 && stock < 5;

//   // Extract top-level category and attribute metrics safely
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
//       onClick={() => onAdd(product)}
//       disabled={isOutOfStock || !product.active}
//       aria-label={`Add ${product.label || "item"} to checkout. Stock: ${
//         product.track_stock ? product.stock : "Unlimited"
//       }`}
//       className={`group relative flex text-left bg-card rounded-2xl transition-all duration-300 w-full border border-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
//         isCard
//           ? "flex-col p-3.5 min-h-[10.5rem]"
//           : "flex-row items-center justify-between p-3 min-h-[4.25rem] gap-4"
//       } ${
//         isOutOfStock || !product.active
//           ? "opacity-45 grayscale cursor-not-allowed bg-card/60"
//           : "hover:border-brand-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs cursor-pointer"
//       }`}
//     >
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
//                     <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-mono uppercase tracking-wider">
//                       Out
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

//       {/* --- TELEMETRY FOOTER & PRICING METRICS ZONE --- */}
//       <div className={`shrink-0 flex items-center ${
//         isCard
//           ? "mt-2.5 pt-2 border-t border-border/40 justify-between w-full"
//           : "gap-4 text-right pl-2 justify-end"
//       }`}>
        
//         {/* Popularity & Soft Stock Indicators (Row View) */}
//         {!isCard && (
//           <div className="flex items-center gap-2 shrink-0">
//             {popularity != null && popularity > 0 && (
//               <span 
//                 className="px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-mono font-bold flex items-center gap-1"
//                 title={`Popularity Score: ${popularity}`}
//               >
//                 <Flame size={10} className="fill-brand-primary/30" />
//                 {Math.round(popularity)}
//               </span>
//             )}

//             {product.track_stock && (
//               <div className="flex items-center font-mono text-[10px] font-bold">
//                 {isOutOfStock ? (
//                   <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] uppercase tracking-wider">
//                     Out
//                   </span>
//                 ) : isCriticalStock ? (
//                   <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
//                     Stock: <strong className="font-black">{stock}</strong>
//                   </span>
//                 ) : isModerateStock ? (
//                   <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
//                     Stock: <strong className="font-black">{stock}</strong>
//                   </span>
//                 ) : (
//                   <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1.5 font-mono">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                     Stock: <strong className="font-black">{stock}</strong>
//                   </span>
//                 )}
//               </div>
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

import React from "react";
import { Package, Tag, Flame } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * @Scribe_Audit
 * Keyboard Telemetry: Supports Ctrl+Click / Cmd+Click gesture for high-speed cart eviction.
 * Accessibility: Replaced HTML disabled attribute with aria-disabled to keep click handlers 
 * active for keyboard/click modifier events while maintaining screen-reader state.
 * Visual Indicator: Micro hotkey legend prompt for cashier onboarding.
 */

interface ProductCardProps {
  product: ProductResponse;
  onInteract: (product: ProductResponse, event: React.MouseEvent) => void;
  viewMode?: "card" | "row";
}

export function ProductCard({
  product,
  onInteract,
  viewMode = "card",
}: ProductCardProps) {
  const isOutOfStock = product.track_stock && product.stock <= 0;
  const isCard = viewMode === "card";

  const stock = product.stock;
  const isModerateStock = product.track_stock && stock >= 5 && stock <= 10;
  const isCriticalStock = product.track_stock && stock > 0 && stock < 5;

  const { unit_of_measure } = product.attributes || {};
  const category = product.category || (product.attributes as any)?.category;
  const popularity = product.popularity_score;

  const formattedPrice = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.selling_price);

  return (
    <button
      type="button"
      onClick={(e) => onInteract(product, e)}
      aria-disabled={isOutOfStock || !product.active}
      aria-label={`${product.label}. Price: KES ${formattedPrice}. Stock: ${
        product.track_stock ? product.stock : "Unlimited"
      }. Hold Ctrl and click to remove from cart.`}
      className={`group relative flex text-left rounded-2xl transition-all duration-200 w-full border border-border/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ${
        isCard
          ? "flex-col p-3.5 min-h-[10.5rem]"
          : "flex-row items-center justify-between p-3 min-h-[4.25rem] gap-4"
      } ${
        isOutOfStock || !product.active
          ? "opacity-55 grayscale-[40%] bg-card/40 hover:border-rose-500/40 cursor-pointer"
          : "bg-card hover:border-brand-primary/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-xs cursor-pointer"
      }`}
    >
      {/* Shortcut Visual Chip (Hover State) */}
      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/90 text-background text-[9px] font-mono px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-20">
        Ctrl + Click to Remove
      </span>

      {/* --- CORE CONTENT ZONE --- */}
      <div className={`flex min-w-0 flex-1 ${isCard ? "flex-col w-full" : "items-center gap-3"}`}>
        {/* Visual Header Node & Metrics */}
        <div className={`flex items-center shrink-0 ${isCard ? "justify-between mb-2 w-full gap-2" : "gap-3"}`}>
          <div className="h-8 w-8 rounded-xl bg-surface/80 flex items-center justify-center text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-200 border border-border/30 shrink-0 shadow-2xs">
            <Package size={15} strokeWidth={2} aria-hidden="true" />
          </div>

          {/* Popularity Badge & Soft Stock Indicators (Card View) */}
          {isCard && (
            <div className="flex items-center gap-1.5 shrink-0">
              {popularity != null && popularity > 0 && (
                <span 
                  className="px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-mono font-bold flex items-center gap-1"
                  title={`Popularity Score: ${popularity}`}
                >
                  <Flame size={10} className="fill-brand-primary/30" />
                  {Math.round(popularity)}
                </span>
              )}

              {product.track_stock && (
                <div className="flex items-center font-mono text-[10px] font-bold">
                  {isOutOfStock ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-mono uppercase tracking-wider font-extrabold">
                      Out of Stock
                    </span>
                  ) : isCriticalStock ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Stock: <strong className="font-black">{stock}</strong>
                    </span>
                  ) : isModerateStock ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Stock: <strong className="font-black">{stock}</strong>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Stock: <strong className="font-black">{stock}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Cluster */}
        <div className="flex flex-col gap-1 flex-1 min-w-0 justify-start w-full">
          <h3 className={`font-bold text-foreground leading-tight uppercase tracking-tight group-hover:text-brand-primary transition-colors text-xs w-full ${
            isCard ? "line-clamp-2 min-h-[2rem]" : "truncate"
          }`}>
            {product.label}
          </h3>

          {category && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1 truncate max-w-[140px]">
              <Tag size={9} strokeWidth={2.5} aria-hidden="true" /> {category}
            </span>
          )}
        </div>
      </div>

      {/* --- PRICING METRICS ZONE --- */}
      <div className={`shrink-0 flex items-center ${
        isCard
          ? "mt-2.5 pt-2 border-t border-border/40 justify-between w-full"
          : "gap-4 text-right pl-2 justify-end"
      }`}>
        {!isCard && product.track_stock && (
          <div className="flex items-center font-mono text-[10px] font-bold shrink-0">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] uppercase tracking-wider font-extrabold">
                Out of Stock
              </span>
            ) : isCriticalStock ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Stock: <strong className="font-black">{stock}</strong>
              </span>
            ) : isModerateStock ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Stock: <strong className="font-black">{stock}</strong>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Stock: <strong className="font-black">{stock}</strong>
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