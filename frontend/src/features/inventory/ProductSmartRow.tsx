// "use client";

// import React from "react";
// import { Trash2, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

// export interface BaseAttributes {
//   unit_of_measure?: string | null;
//   buying_price?: number | null;
//   sku?: string | null;
// }

// export interface ProductResponse {
//   id: string;
//   label: string;
//   selling_price: number;
//   track_stock: boolean;
//   stock: number;
//   active: boolean;
//   attributes: BaseAttributes;
// }

// interface ProductSmartRowProps {
//   product: ProductResponse;
//   onOpen: (id: string) => void;
//   onDelete: (id: string) => void;
// }

// export function ProductSmartRow({ product, onOpen, onDelete }: ProductSmartRowProps) {
//   const { label, selling_price, track_stock, stock, active, id, last_stock_take, popularity_score } = product;
//   const { sku, unit_of_measure } = product.attributes || {};

//   // 1. Flatten Data Representation for Noise Reduction
//   const displaySku = sku && sku.trim() !== "" ? sku : "No SKU";
//   const displayUom = unit_of_measure && unit_of_measure.trim() !== "" ? unit_of_measure : "Pcs";

  // Audit freshness: green < 30d, amber older, red never
  let auditBorder = "border-l-4 border-l-red-500";
  let auditTitle = "Never counted — open workspace and run Count stock";
  if (last_stock_take) {
    const days = (Date.now() - new Date(last_stock_take).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) {
      auditBorder = "border-l-4 border-l-emerald-500";
      auditTitle = `Last count within a month (${new Date(last_stock_take).toLocaleDateString()})`;
    } else {
      auditBorder = "border-l-4 border-l-amber-500";
      auditTitle = `Last count over a month ago (${new Date(last_stock_take).toLocaleDateString()})`;
    }
  }



//   // 2. Compute Stock Alert Matrix
//   let stockAlertState: "normal" | "low" | "crisis" | "untracked" = "normal";
//   if (!track_stock) {
//     stockAlertState = "untracked";
//   } else if (stock === 0) {
//     stockAlertState = "crisis";
//   } else if (stock <= 5) {
//     stockAlertState = "low";
//   }

//   // 3. Format Currency securely (Kenyan SME Context - KES)
//   const formattedPrice = new Intl.NumberFormat("en-KE", {
//     style: "currency",
//     currency: "KES",
//     minimumFractionDigits: 2,
//   }).format(selling_price);

//   return (
//     <tr
//       data-active={active}
//       data-alert={stockAlertState}
//       className="
//         group border-b border-border bg-card/40 transition-all duration-200 ease-in-out
//         hover:bg-primary/5
//         data-[active=false]:opacity-40 data-[active=false]:pointer-events-none data-[active=false]:bg-secondary/5
//         data-[alert=crisis]:bg-red-500/5 dark:data-[alert=crisis]:bg-red-500/10
//         data-[alert=low]:bg-amber-500/5 dark:data-[alert=low]:bg-amber-500/10
//       "
//     >
//       {/* COLUMN 1: CORE PRODUCT IDENTITY */}
//       <td className="px-6 py-4 align-middle">
//         <div className="flex flex-col min-w-0">
//           <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
//             {label}
//           </span>
//           <span className="text-xs text-secondary font-mono tracking-tight mt-0.5">
//             {displaySku}
//           </span>
//         </div>
//       </td>

//       {/* COLUMN 2: FINANCIAL MATRIX */}
//       <td className="px-6 py-4 align-middle text-right font-mono">
//         <span className="text-sm font-extrabold text-foreground">
//           {formattedPrice}
//         </span>
//         </span>
//       </td>

//       {/* COLUMN 3: LIVE INVENTORY STATUS (BETTING-INSPIRED SMART FLASH MATRIX) */}
//       <td className="px-6 py-4 align-middle">
//         <div className="flex items-center justify-start">
//           {stockAlertState === "untracked" && (
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary border border-border">
//               <Infinity size={12} aria-hidden="true" />
//               <span>Service</span>
//             </div>
//           )}

//           {stockAlertState === "normal" && (
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
//               <span>{stock} {displayUom}</span>
//             </div>
//           )}

//           {stockAlertState === "low" && (
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
//               <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
//               <span>Low: {stock} {displayUom}</span>
//             </div>
//           )}

//           {stockAlertState === "crisis" && (
//             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
//               <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" aria-hidden="true" />
//               <span>Out of Stock</span>
//             </div>
//           )}
//         </div>
//       </td>

//       {/* COLUMN 4: CONTEXTUAL ACTIONS */}
//       <td className="px-6 py-4 align-middle text-right">
//         <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
//           <button
//             onClick={() => onOpen(id)}
//             type="button"
//             aria-label={`Edit ${label}`}
//             className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all duration-150 hover:border-primary hover:text-primary active:scale-95"
//           >
//             <Edit2 size={14} />
//           </button>

          
          
//           <button
//             onClick={() => onDelete(id)}
//             type="button"
//             aria-label={`Delete ${label}`}
//             className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-secondary transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 active:scale-95"
//           >
//             <Trash2 size={14} />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// }

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

export function ProductSmartRow({ product, onOpen, onDelete }: ProductSmartRowProps) {
  const { label, selling_price, track_stock, stock, active, id, last_stock_take, popularity_score } = product;
  const { sku, unit_of_measure } = product.attributes || {};

  // 1. Flatten Data Representation for Noise Reduction
  const displaySku = sku && sku.trim() !== "" ? sku : "No SKU";
  const displayUom = unit_of_measure && unit_of_measure.trim() !== "" ? unit_of_measure : "Pcs";

  // Audit freshness: green < 30d, amber older, red never
  let auditBorder = "border-l-4 border-l-red-500";
  let auditTitle = "Never counted — open workspace and run Count stock";
  if (last_stock_take) {
    const days = (Date.now() - new Date(last_stock_take).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) {
      auditBorder = "border-l-4 border-l-emerald-500";
      auditTitle = `Last count within a month (${new Date(last_stock_take).toLocaleDateString()})`;
    } else {
      auditBorder = "border-l-4 border-l-amber-500";
      auditTitle = `Last count over a month ago (${new Date(last_stock_take).toLocaleDateString()})`;
    }
  }



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
        "group border-b border-border bg-card/40 transition-all duration-200 ease-in-out cursor-pointer",
        auditBorder,
        "hover:bg-brand-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-inset",
        "data-[active=false]:opacity-50 data-[active=false]:bg-secondary/5",
        "data-[alert=crisis]:bg-red-500/5 dark:data-[alert=crisis]:bg-red-500/10",
        "data-[alert=low]:bg-amber-500/5 dark:data-[alert=low]:bg-amber-500/10"
      )}
    >
      {/* COLUMN 1: CORE PRODUCT IDENTITY */}
      <td className="px-6 py-4 align-middle">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {label} {!active && <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-1.5">Inactive</span>}
          </span>
          <span className="text-xs text-secondary font-mono tracking-tight mt-0.5">
            {displaySku}
          </span>
          {last_stock_take ? (
            <span
              className="text-[11px] text-muted mt-1"
              title="Last physical count or stock adjustment recorded for this product"
            >
              Last count: {new Date(last_stock_take).toLocaleDateString()}
            </span>
          ) : track_stock ? (
            <span className="text-[11px] text-muted mt-1" title="No stock count recorded yet">
              Not counted yet
            </span>
          ) : null}
        </div>
      </td>

      {/* COLUMN 2: FINANCIAL MATRIX */}
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
            {popularity_score != null ? Number(popularity_score).toFixed(1) : "—"}
          </span>
        </div>
      </td>

      {/* COLUMN 3: LIVE INVENTORY STATUS */}
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 motion-safe:animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span>Low: {stock} {displayUom}</span>
            </div>
          )}

          {stockAlertState === "crisis" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" aria-hidden="true" />
              </span>
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </td>

      {/* COLUMN 4: ACTIONS — always visible primary Open */}
      <td className="px-6 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onOpen(id)}
            type="button"
            title="Open stock workspace — receive, count, adjust, history"
            aria-label={`Open stock workspace for ${label}`}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            Open
          </button>
          <button
            onClick={() => onDelete(id)}
            type="button"
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