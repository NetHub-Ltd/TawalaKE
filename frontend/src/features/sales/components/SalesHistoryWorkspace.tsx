"use client";

import React, { useState, useMemo } from "react";
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
  ChevronRight
} from "lucide-react";

/**
 * @Scribe_Audit
 * Aesthetic: High-density system token viewport terminal matching Silk & Slate specifications.
 * Layout: Fixes desktop-viewport leakage by locking the component height to its parent frame 
 * via rigid flex-col containment and precise min-h-0 layout squeezes.
 */
export default function SalesHistoryWorkspace() {
  const { businessId } = useBusinessContext();
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";

  const { sales, isLoading, isFetching, error, refresh } = useSales({
    businessId: normalizedBusinessId,
    limit: limit,
  });

  // Client-side filtration layer pass
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (statusFilter === "ALL") return true;
      return sale.status === statusFilter;
    });
  }, [sales, statusFilter]);

  return (
    /* ROOT WORKSPACE CONTAINER - Explicit h-full constraints prevent page-level vertical runaways */
    <div className="w-full h-full flex flex-col min-h-0 bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden">
      
      {/* INTEGRATED ACTION CONTROL BAR (Fixed Row) */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-border/40 bg-surface/20 shrink-0 select-none">
        
        {/* Status Category Matrix Filters */}
        <div className="flex items-center gap-2 max-w-xs w-full">
          <div className="relative w-full">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" size={13} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-background border border-border/40 rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-brand-primary/40 appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">All Transactions</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="COMPLETED">Completed Ledger</option>
              <option value="CANCELLED">Cancelled / Void</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-muted/60 w-0 h-0" />
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Dynamic Page Limits */}
          <div className="flex items-center gap-2">
            <label htmlFor="workspace-limit" className="text-[10px] font-black uppercase text-muted tracking-wider">Rows:</label>
            <select
              id="workspace-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 rounded-xl bg-background border border-border/40 text-xs font-bold text-foreground px-3 focus:outline-none focus:border-brand-primary/40 cursor-pointer transition-all"
            >
              <option value={10}>10 Entries</option>
              <option value={20}>20 Entries</option>
              <option value={50}>50 Entries</option>
              <option value={100}>100 Entries</option>
            </select>
          </div>

          {/* Manual Store Sync Trigger */}
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading || isFetching}
            className="h-9 px-4 rounded-xl bg-background border border-border/40 hover:border-brand-primary/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer text-foreground"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin text-brand-primary" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* CORE DATA SUB-GRID CONTAINER - Fills remaining viewport frame precisely */}
      <div className="flex-1 flex flex-col min-h-0 w-full relative">
        
        {/* STATIC TABLE HEADER LAYER (Always visible, stays fixed during scroll cascades) */}
        <div className="w-full overflow-x-auto no-scrollbar shrink-0 bg-surface/50 border-b border-border/40 z-10">
          <table className="w-full min-w-[650px] border-collapse text-left table-fixed">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-muted font-mono">
                <th className="py-3.5 px-6 w-[12%]">Index</th>
                <th className="py-3.5 px-4 w-[28%]">Created Timestamp</th>
                <th className="py-3.5 px-4 w-[20%]">Ledger Status</th>
                <th className="py-3.5 px-4 w-[15%] text-right">Subtotal</th>
                <th className="py-3.5 px-4 w-[10%] text-right">Dscnt/Tax</th>
                <th className="py-3.5 px-6 w-[15%] text-right">Net Payable</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* INDEPENDENT INTERNAL VERTICAL SCROLLPORT LAYER */}
        <div className="flex-1 overflow-y-auto w-full bg-card min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <Loader2 className="animate-spin text-brand-primary" size={20} />
                <p className="text-[11px] font-medium text-muted">Streaming transaction nodes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6">
              <div className="text-center max-w-sm space-y-2">
                <AlertCircle className="text-brand-accent mx-auto" size={18} />
                <p className="text-xs font-bold uppercase text-foreground">Sync Error</p>
                <p className="text-[11px] text-muted leading-relaxed">{error.message}</p>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 text-center">
              <Layers className="text-muted/30 mb-2" size={24} />
              <p className="text-xs font-black uppercase tracking-wide text-foreground">No Logs Found</p>
              <p className="text-[11px] text-muted max-w-xs mt-0.5">No matching transaction instances found for this filter.</p>
            </div>
          ) : (
            <table className="w-full min-w-[650px] border-collapse text-left table-fixed">
              <tbody className="divide-y divide-border/30 text-xs font-mono font-medium text-muted">
                {filteredSales.map((sale, index) => (
                  <SalesRow key={sale.id} sale={sale} index={index + 1} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FIXED TABLE SYSTEM FOOTER AND PAGINATION SHELL (Fixed Row) */}
      <div className="w-full bg-surface/20 px-6 py-4 border-t border-border/40 shrink-0 flex items-center justify-between text-[10px] font-medium text-muted z-10 select-none">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-brand-primary opacity-80" />
          <span>Ledger Partition Verified</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span>View Count: <span className="font-bold text-foreground font-mono">{filteredSales.length}</span> items</span>
          <div className="flex items-center gap-1">
            <button disabled className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer">
              <ChevronLeft size={12} />
            </button>
            <button disabled className="h-6 w-6 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition-all cursor-pointer">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// ISOLATED DATA ELEMENT ROW SUB-COMPONENT
// ============================================================================
interface SalesRowProps {
  sale: SaleResponse;
  index: number;
}

const SalesRow = React.memo(({ sale, index }: SalesRowProps) => {
  const getStatusStyle = (status: SaleResponse["status"]) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-muted/10 text-muted border-border/40";
    }
  };

  return (
    <tr className="hover:bg-surface/30 transition-colors group">
      {/* Sequential Line Counter Column */}
      <td className="py-3.5 px-6 text-foreground font-bold font-mono w-[12%]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-surface border border-border/40 flex items-center justify-center text-[10px] opacity-70 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all font-sans">
            #{index}
          </div>
        </div>
      </td>
      
      {/* Creation ISO Timestamp Formatting */}
      <td className="py-3.5 px-4 text-[11px] w-[28%] text-muted">
        <div className="flex items-center gap-1.5">
          <Calendar size={11} className="opacity-40" />
          <span>
            {new Date(sale.created_at).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </span>
        </div>
      </td>

      {/* Status Badge Mapping */}
      <td className="py-3.5 px-4 w-[20%]">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(sale.status)}`}>
          {sale.status.replace("_", " ")}
        </span>
      </td>

      {/* Raw Subtotal */}
      <td className="py-3.5 px-4 text-right text-foreground font-mono w-[15%]">
        {sale.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>

      {/* Adjustments Composite Stack (Discounts & Taxes) */}
      <td className="py-3.5 px-4 text-right text-[10px] font-mono w-[10%]">
        <div className="flex flex-col">
          <span className={sale.discount > 0 ? "text-brand-accent font-bold" : "opacity-40"}>
            -{sale.discount.toLocaleString()}
          </span>
          <span className="opacity-40">
            +{sale.tax_amount.toLocaleString()}
          </span>
        </div>
      </td>

      {/* Net Absolute Account Payable Amount */}
      <td className="py-3.5 px-6 text-right text-foreground font-black font-mono text-xs w-[15%]">
        KES {sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
    </tr>
  );
});

SalesRow.displayName = "SalesRow";