// "use client";

// import React, { useState, useMemo } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { useSales, SaleResponse } from "@/features/sales/hooks/useSales";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import {
//   RefreshCw,
//   Calendar,
//   Layers,
//   AlertCircle,
//   Loader2,
//   ShieldCheck,
//   Filter,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// /* -------------------------------------------------------------------------- */
// /* Helpers                                                                    */
// /* -------------------------------------------------------------------------- */

// function formatDate(value?: string | null) {
//   if (!value) return "—";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return "—";
//   return d.toLocaleString(undefined, {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function formatMoney(amount: number, currency = "KES") {
//   const n = Number(amount) || 0;
//   return `${currency} ${n.toLocaleString(undefined, {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// }

// function shortRef(id?: string) {
//   if (!id) return "—";
//   return id.slice(0, 8).toUpperCase();
// }

// function toNumber(value: unknown) {
//   const n = Number(value);
//   return Number.isFinite(n) ? n : 0;
// }

// /* -------------------------------------------------------------------------- */
// /* Main component                                                             */
// /* -------------------------------------------------------------------------- */

// export default function SalesHistoryWorkspace() {
//   const router = useRouter();
//   const params = useParams();
//   const { businessId } = useBusinessContext();

//   const organizationId =
//     (params?.organizationId as string) ||
//     (params?.orgId as string) ||
//     "default";

//   const normalizedBusinessId = Array.isArray(businessId)
//     ? businessId[0]
//     : businessId || (params?.businessId as string) || "";

//   const [limit, setLimit] = useState(10);
//   const [statusFilter, setStatusFilter] = useState("ALL");
//   const [currentPage, setCurrentPage] = useState(1);

//   const { sales, isLoading, isFetching, error, refresh } = useSales({
//     businessId: normalizedBusinessId,
//     limit,
//   });

//   // Debug – remove later if you want
//   console.debug("[SalesHistory] businessId:", normalizedBusinessId);
//   console.debug("[SalesHistory] raw sales:", sales);

//   const processedSales = useMemo(() => {
//     const sorted = [...sales].sort((a, b) => {
//       const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
//       const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
//       // Invalid dates become 0 so they sink to the bottom
//       const safeA = Number.isNaN(ta) ? 0 : ta;
//       const safeB = Number.isNaN(tb) ? 0 : tb;
//       return safeB - safeA;
//     });

//     return sorted.filter((sale) => {
//       if (statusFilter === "ALL") return true;
//       return sale.status === statusFilter;
//     });
//   }, [sales, statusFilter]);

//   const totalItems = processedSales.length;
//   const totalPages = Math.ceil(totalItems / limit) || 1;

//   const paginatedSales = useMemo(() => {
//     const start = (currentPage - 1) * limit;
//     return processedSales.slice(start, start + limit);
//   }, [processedSales, currentPage, limit]);

//   const handlePageChange = (direction: "prev" | "next") => {
//     setCurrentPage((prev) => {
//       if (direction === "prev") return Math.max(prev - 1, 1);
//       return Math.min(prev + 1, totalPages);
//     });
//   };

//   const goToDetail = (saleId: string) => {
//     if (!saleId) return;
//     router.push(
//       `/org/${organizationId}/${normalizedBusinessId}/sale-history/${saleId}`,
//     );
//   };

//   // Guard: no businessId means the query never runs
//   if (!normalizedBusinessId) {
//     return (
//       <div className="w-full h-full flex items-center justify-center p-8">
//         <div className="text-center space-y-2">
//           <AlertCircle className="mx-auto text-amber-500" size={20} />
//           <p className="text-sm font-semibold">No business selected</p>
//           <p className="text-xs text-muted">
//             businessId is missing – the sales query is disabled.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-full flex flex-col min-h-0 bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden">
//       {/* Toolbar */}
//       <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-border/40 bg-surface/20 shrink-0">
//         <div className="relative w-full max-w-xs">
//           <Filter
//             className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60"
//             size={13}
//           />
//           <select
//             value={statusFilter}
//             onChange={(e) => {
//               setStatusFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//             className="w-full h-9 pl-9 pr-8 bg-background border border-border/40 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
//           >
//             <option value="ALL">All Transactions</option>
//             <option value="PENDING_PAYMENT">Pending Payment</option>
//             <option value="COMPLETED">Completed</option>
//             <option value="CANCELLED">Cancelled</option>
//           </select>
//         </div>

//         <div className="flex items-center gap-3 self-end sm:self-auto">
//           <div className="flex items-center gap-2">
//             <label
//               htmlFor="workspace-limit"
//               className="text-[10px] font-black uppercase text-muted tracking-wider"
//             >
//               Rows:
//             </label>
//             <select
//               id="workspace-limit"
//               value={limit}
//               onChange={(e) => {
//                 setLimit(Number(e.target.value));
//                 setCurrentPage(1);
//               }}
//               className="h-9 rounded-xl bg-background border border-border/40 text-xs font-bold text-foreground px-3 focus:outline-none focus:border-brand-primary/40 cursor-pointer"
//             >
//               <option value={10}>10 Entries</option>
//               <option value={20}>20 Entries</option>
//               <option value={50}>50 Entries</option>
//               <option value={100}>100 Entries</option>
//             </select>
//           </div>

//           <button
//             type="button"
//             onClick={refresh}
//             disabled={isLoading || isFetching}
//             className="h-9 px-4 rounded-xl bg-background border border-border/40 hover:border-brand-primary/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer text-foreground"
//           >
//             <RefreshCw
//               size={12}
//               className={isFetching ? "animate-spin text-brand-primary" : ""}
//             />
//             <span>Sync</span>
//           </button>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="flex-1 flex flex-col min-h-0 w-full relative">
//         <div className="w-full overflow-x-auto no-scrollbar shrink-0 bg-surface/50 border-b border-border/40 z-10">
//           <table className="w-full min-w-[720px] border-collapse text-left table-fixed">
//             <thead>
//               <tr className="text-[10px] font-black uppercase tracking-wider text-muted font-mono">
//                 <th className="py-3.5 px-6 w-[22%]">Date</th>
//                 <th className="py-3.5 px-4 w-[12%]">Ref</th>
//                 <th className="py-3.5 px-4 w-[16%]">Status</th>
//                 <th className="py-3.5 px-4 w-[14%] text-right">Subtotal</th>
//                 <th className="py-3.5 px-4 w-[14%] text-right">Tax / Disc</th>
//                 <th className="py-3.5 px-6 w-[22%] text-right">Net Payable</th>
//               </tr>
//             </thead>
//           </table>
//         </div>

//         <div className="flex-1 overflow-y-auto w-full bg-card min-h-0 relative">
//           {isLoading ? (
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="flex flex-col items-center gap-2">
//                 <Loader2 className="animate-spin text-brand-primary" size={20} />
//                 <p className="text-[11px] font-medium text-muted">
//                   Loading transactions...
//                 </p>
//               </div>
//             </div>
//           ) : error ? (
//             <div className="absolute inset-0 flex items-center justify-center p-6">
//               <div className="text-center max-w-sm space-y-2">
//                 <AlertCircle className="text-brand-accent mx-auto" size={18} />
//                 <p className="text-xs font-bold uppercase text-foreground">
//                   Sync Error
//                 </p>
//                 <p className="text-[11px] text-muted leading-relaxed">
//                   {error.message}
//                 </p>
//               </div>
//             </div>
//           ) : paginatedSales.length === 0 ? (
//             <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
//               <Layers className="text-muted/30 mb-2" size={24} />
//               <p className="text-xs font-black uppercase tracking-wide text-foreground">
//                 No sales found
//               </p>
//               <p className="text-[11px] text-muted max-w-xs mt-0.5">
//                 {sales.length === 0
//                   ? "The API returned no sales for this business."
//                   : "No matching transactions for this filter."}
//               </p>
//             </div>
//           ) : (
//             <table className="w-full min-w-[720px] border-collapse text-left table-fixed">
//               <tbody className="divide-y divide-border/30">
//                 {paginatedSales.map((sale) => (
//                   <SalesRow
//                     key={sale.id}
//                     sale={sale}
//                     onClick={() => goToDetail(sale.id)}
//                   />
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="w-full bg-surface/20 px-6 py-4 border-t border-border/40 shrink-0 flex items-center justify-between text-[10px] font-medium text-muted">
//         <div className="flex items-center gap-1.5">
//           <ShieldCheck size={13} className="text-brand-primary opacity-80" />
//           <span>
//             {totalItems} transaction{totalItems !== 1 ? "s" : ""}
//           </span>
//         </div>

//         <div className="flex items-center gap-4">
//           <span>
//             Page{" "}
//             <span className="font-bold text-foreground font-mono">
//               {currentPage}
//             </span>{" "}
//             of{" "}
//             <span className="font-bold text-foreground font-mono">
//               {totalPages}
//             </span>
//           </span>
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => handlePageChange("prev")}
//               disabled={currentPage === 1}
//               className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer text-foreground"
//               aria-label="Previous page"
//             >
//               <ChevronLeft size={12} />
//             </button>
//             <button
//               onClick={() => handlePageChange("next")}
//               disabled={currentPage === totalPages}
//               className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer text-foreground"
//               aria-label="Next page"
//             >
//               <ChevronRight size={12} />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* -------------------------------------------------------------------------- */
// /* Row                                                                        */
// /* -------------------------------------------------------------------------- */

// interface SalesRowProps {
//   sale: SaleResponse;
//   onClick: () => void;
// }

// const SalesRow = React.memo(({ sale, onClick }: SalesRowProps) => {
//   const statusStyles: Record<string, string> = {
//     PENDING_PAYMENT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
//     COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
//     CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
//   };

//   const currency = (sale.currency as string) || "KES";
//   const subtotal = toNumber(sale.subtotal);
//   const discount = toNumber(sale.discount);
//   const taxAmount = toNumber(sale.tax_amount);
//   const total = toNumber(sale.total_amount);

//   return (
//     <tr
//       onClick={onClick}
//       className="hover:bg-surface/40 transition-colors cursor-pointer group"
//     >
//       <td className="py-3.5 px-6 text-[11px] text-muted w-[22%]">
//         <div className="flex items-center gap-1.5">
//           <Calendar size={11} className="opacity-40 shrink-0" />
//           <span>{formatDate(sale.created_at)}</span>
//         </div>
//       </td>

//       <td className="py-3.5 px-4 w-[12%] font-mono text-[11px] text-foreground/80">
//         {shortRef(sale.id)}
//       </td>

//       <td className="py-3.5 px-4 w-[16%]">
//         <span
//           className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
//             statusStyles[sale.status] ??
//             "bg-muted/10 text-muted border-border/40"
//           }`}
//         >
//           {String(sale.status || "UNKNOWN").replace(/_/g, " ")}
//         </span>
//       </td>

//       <td className="py-3.5 px-4 text-right font-mono text-[12px] text-foreground w-[14%]">
//         {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//       </td>

//       <td className="py-3.5 px-4 text-right text-[10px] font-mono w-[14%]">
//         <div className="flex flex-col items-end leading-tight">
//           <span className={discount > 0 ? "text-emerald-600" : "opacity-40"}>
//             −{discount.toLocaleString()}
//           </span>
//           <span className="opacity-50">+{taxAmount.toLocaleString()}</span>
//         </div>
//       </td>

//       <td className="py-3.5 px-6 text-right font-mono font-bold text-[12px] text-foreground w-[22%]">
//         {formatMoney(total, currency)}
//       </td>
//     </tr>
//   );
// });

// SalesRow.displayName = "SalesRow";

"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSales, SaleResponse } from "@/features/sales/hooks/useSales";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import {
  RefreshCw,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronRight as RowChevron,
  Package,
  User,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount: number, currency = "KES") {
  const n = Number(amount) || 0;
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getItemCount(sale: SaleResponse) {
  if (Array.isArray(sale.items)) return sale.items.length;
  return 0;
}

function getCashierName(sale: SaleResponse) {
  return sale.cashier?.full_name || "—";
}

/* -------------------------------------------------------------------------- */
/* SalesRow (separate component)                                              */
/* -------------------------------------------------------------------------- */

interface SalesRowProps {
  sale: SaleResponse;
  onClick: () => void;
}

function SalesRow({ sale, onClick }: SalesRowProps) {
  const statusStyles: Record<string, string> = {
    PENDING_PAYMENT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  const currency = (sale.currency as string) || "KES";
  const total = toNumber(sale.total_amount);
  const itemCount = getItemCount(sale);
  const cashierName = getCashierName(sale);

  // Prefer updated_at (more accurate), fall back to created_at
  const timestamp =
    (sale.updated_at as string | undefined) || sale.created_at;

  return (
    <tr
      onClick={onClick}
      className="
        group cursor-pointer
        border-b border-border/30
        hover:bg-brand-primary/[0.04]
        active:bg-brand-primary/[0.07]
        transition-colors duration-150
      "
    >
      {/* Date */}
      <td className="py-4 px-6 w-[22%]">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <Calendar size={13} className="opacity-50 shrink-0" />
          <span className="leading-tight">{formatDate(timestamp)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-4 w-[16%]">
        <span
          className={`
            inline-flex items-center px-2.5 py-1 rounded-full
            text-[10px] font-bold uppercase tracking-wider border
            ${statusStyles[sale.status] ?? "bg-muted/10 text-muted border-border/40"}
          `}
        >
          {String(sale.status || "UNKNOWN").replace(/_/g, " ")}
        </span>
      </td>

      {/* Items count */}
      <td className="py-4 px-4 w-[12%]">
        <div className="flex items-center gap-1.5 text-[12px] text-foreground/80">
          <Package size={13} className="opacity-40 shrink-0" />
          <span className="font-medium tabular-nums">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </td>

      {/* Cashier */}
      <td className="py-4 px-4 w-[18%]">
        <div className="flex items-center gap-1.5 text-[12px] text-foreground/80 min-w-0">
          <User size={13} className="opacity-40 shrink-0" />
          <span className="truncate">{cashierName}</span>
        </div>
      </td>

      {/* Amount + affordance */}
      <td className="py-4 px-6 w-[32%]">
        <div className="flex items-center justify-end gap-3">
          <span className="font-mono font-bold text-[13px] text-foreground tabular-nums">
            {formatMoney(total, currency)}
          </span>
          <RowChevron
            size={16}
            className="
              text-muted/40
              group-hover:text-brand-primary
              group-hover:translate-x-0.5
              transition-all duration-150
              shrink-0
            "
          />
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Main workspace                                                             */
/* -------------------------------------------------------------------------- */

export default function SalesHistoryWorkspace() {
  const router = useRouter();
  const params = useParams();
  const { businessId } = useBusinessContext();

  const organizationId =
    (params?.organizationId as string) ||
    (params?.orgId as string) ||
    "default";

  const normalizedBusinessId = Array.isArray(businessId)
    ? businessId[0]
    : businessId || (params?.businessId as string) || "";

  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const { sales, isLoading, isFetching, error, refresh } = useSales({
    businessId: normalizedBusinessId,
    limit,
  });

  const processedSales = useMemo(() => {
    const sorted = [...sales].sort((a, b) => {
      const aTime = (a.updated_at as string) || a.created_at;
      const bTime = (b.updated_at as string) || b.created_at;
      const ta = aTime ? new Date(aTime).getTime() : 0;
      const tb = bTime ? new Date(bTime).getTime() : 0;
      const safeA = Number.isNaN(ta) ? 0 : ta;
      const safeB = Number.isNaN(tb) ? 0 : tb;
      return safeB - safeA;
    });

    return sorted.filter((sale) => {
      if (statusFilter === "ALL") return true;
      return sale.status === statusFilter;
    });
  }, [sales, statusFilter]);

  const totalItems = processedSales.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return processedSales.slice(start, start + limit);
  }, [processedSales, currentPage, limit]);

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(prev - 1, 1);
      return Math.min(prev + 1, totalPages);
    });
  };

  const goToDetail = (saleId: string) => {
    if (!saleId) return;
    router.push(
      `/org/${organizationId}/${normalizedBusinessId}/sale-history/${saleId}`,
    );
  };

  if (!normalizedBusinessId) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <AlertCircle className="mx-auto text-amber-500" size={20} />
          <p className="text-sm font-semibold">No business selected</p>
          <p className="text-xs text-muted">
            businessId is missing – the sales query is disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden">
      {/* Toolbar */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-border/40 bg-surface/20 shrink-0">
        <div className="relative w-full max-w-xs">
          <Filter
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60"
            size={13}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-9 pl-9 pr-8 bg-background border border-border/40 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer"
          >
            <option value="ALL">All Transactions</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <label
              htmlFor="workspace-limit"
              className="text-[10px] font-black uppercase text-muted tracking-wider"
            >
              Rows:
            </label>
            <select
              id="workspace-limit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl bg-background border border-border/40 text-xs font-bold text-foreground px-3 focus:outline-none focus:border-brand-primary/40 cursor-pointer"
            >
              <option value={10}>10 Entries</option>
              <option value={20}>20 Entries</option>
              <option value={50}>50 Entries</option>
              <option value={100}>100 Entries</option>
            </select>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading || isFetching}
            className="h-9 px-4 rounded-xl bg-background border border-border/40 hover:border-brand-primary/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer text-foreground"
          >
            <RefreshCw
              size={12}
              className={isFetching ? "animate-spin text-brand-primary" : ""}
            />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0 w-full relative">
        {/* Header */}
        <div className="w-full overflow-x-auto no-scrollbar shrink-0 bg-surface/50 border-b border-border/40 z-10">
          <table className="w-full min-w-[720px] border-collapse text-left table-fixed">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-muted">
                <th className="py-3.5 px-6 w-[22%]">When</th>
                <th className="py-3.5 px-4 w-[16%]">Status</th>
                <th className="py-3.5 px-4 w-[12%]">Items</th>
                <th className="py-3.5 px-4 w-[18%]">Cashier</th>
                <th className="py-3.5 px-6 w-[32%] text-right">Amount</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto w-full bg-card min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-brand-primary" size={20} />
                <p className="text-[11px] font-medium text-muted">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-sm space-y-2">
                <AlertCircle className="text-brand-accent mx-auto" size={18} />
                <p className="text-xs font-bold uppercase text-foreground">
                  Sync Error
                </p>
                <p className="text-[11px] text-muted leading-relaxed">
                  {error.message}
                </p>
              </div>
            </div>
          ) : paginatedSales.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <Layers className="text-muted/30 mb-2" size={24} />
              <p className="text-xs font-black uppercase tracking-wide text-foreground">
                No sales found
              </p>
              <p className="text-[11px] text-muted max-w-xs mt-0.5">
                {sales.length === 0
                  ? "The API returned no sales for this business."
                  : "No matching transactions for this filter."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left table-fixed">
              <tbody>
                {paginatedSales.map((sale) => (
                  <SalesRow
                    key={sale.id}
                    sale={sale}
                    onClick={() => goToDetail(sale.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-surface/20 px-6 py-4 border-t border-border/40 shrink-0 flex items-center justify-between text-[10px] font-medium text-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-brand-primary opacity-80" />
          <span>
            {totalItems} transaction{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Page{" "}
            <span className="font-bold text-foreground font-mono">
              {currentPage}
            </span>{" "}
            of{" "}
            <span className="font-bold text-foreground font-mono">
              {totalPages}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
              className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer text-foreground"
              aria-label="Previous page"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => handlePageChange("next")}
              disabled={currentPage === totalPages}
              className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer text-foreground"
              aria-label="Next page"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}