"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useSales,
  SaleResponse,
  getSaleItemCount,
  getSaleCashierName,
  isCreditSale,
} from "@/features/sales/hooks/useSales";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import {
  RefreshCw,
  Calendar,
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

function statusLabel(status: string) {
  if (status === "PENDING_PAYMENT") return "Credit · due";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return status.replace(/_/g, " ");
}

function statusStyles(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-500/10 text-amber-700 border-amber-500/25";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25";
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-700 border-rose-500/25";
    default:
      return "bg-muted/15 text-muted-foreground border-border/40";
  }
}

interface SalesRowProps {
  sale: SaleResponse;
  onClick: () => void;
  previewHref: string;
}

function SalesRow({ sale, onClick, previewHref }: SalesRowProps) {
  const currency = (sale.currency as string) || "KES";
  const total = toNumber(sale.total_amount);
  const itemCount = getSaleItemCount(sale);
  const cashierName = getSaleCashierName(sale);
  const customerName =
    (sale.customer as { name?: string } | null | undefined)?.name || null;
  const timestamp =
    (sale.updated_at as string | undefined) || sale.created_at;
  const credit = isCreditSale(sale);

  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="link"
      className="
        group cursor-pointer border-b border-border/30
        hover:bg-brand-primary/[0.04] focus-visible:bg-brand-primary/[0.06]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/30
        transition-colors
      "
    >
      <td className="py-3.5 px-4 sm:px-5 w-[22%]">
        <div className="flex items-center gap-2 text-[13px] text-foreground/90 min-w-0">
          <Calendar size={13} className="opacity-40 shrink-0" />
          <span className="truncate tabular-nums">{formatDate(timestamp)}</span>
        </div>
      </td>

      <td className="py-3.5 px-3 w-[16%]">
        <span
          className={`
            inline-flex items-center rounded-full border px-2.5 py-0.5
            text-[10px] font-bold uppercase tracking-wide
            ${statusStyles(String(sale.status))}
          `}
        >
          {statusLabel(String(sale.status))}
        </span>
      </td>

      <td className="py-3.5 px-3 w-[12%]">
        <div className="flex items-center gap-1.5 text-[13px] text-foreground/80">
          <Package size={13} className="opacity-40 shrink-0" />
          <span className="tabular-nums">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-3 w-[16%]">
        <div className="flex items-center gap-1.5 text-[13px] text-foreground/80 min-w-0">
          <User size={13} className="opacity-40 shrink-0" />
          <span className="truncate">{cashierName}</span>
        </div>
      </td>

      <td className="py-3.5 px-3 w-[14%] hidden lg:table-cell">
        <span className="text-[13px] text-foreground/70 truncate block">
          {customerName || "—"}
        </span>
      </td>

      <td className="py-3.5 px-4 sm:px-5 w-[20%]">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono font-bold text-[13px] text-foreground tabular-nums">
            {formatMoney(total, currency)}
          </span>
          {credit && (
            <a
              href={previewHref}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-500 hover:text-white transition-colors"
            >
              Invoice
            </a>
          )}
          <RowChevron
            size={16}
            className="text-muted/40 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
            aria-hidden
          />
        </div>
      </td>
    </tr>
  );
}

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
    limit: Math.max(limit * 5, 50),
  });

  const processedSales = useMemo(() => {
    const sorted = [...sales].sort((a, b) => {
      const aTime = (a.updated_at as string) || a.created_at;
      const bTime = (b.updated_at as string) || b.created_at;
      const ta = aTime ? new Date(aTime).getTime() : 0;
      const tb = bTime ? new Date(bTime).getTime() : 0;
      return tb - ta;
    });
    if (statusFilter === "ALL") return sorted;
    return sorted.filter((s) => s.status === statusFilter);
  }, [sales, statusFilter]);

  const totalItems = processedSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSales = processedSales.slice(
    (safePage - 1) * limit,
    safePage * limit,
  );

  const goToDetail = (saleId: string) => {
    router.push(
      `/org/${organizationId}/${normalizedBusinessId}/sale-history/${saleId}`,
    );
  };

  const handlePageChange = (dir: "prev" | "next") => {
    setCurrentPage((p) => {
      if (dir === "prev") return Math.max(1, p - 1);
      return Math.min(totalPages, p + 1);
    });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border/40 bg-surface/10">
        <div className="flex items-center gap-2 min-w-0">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border/50 bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
            aria-label="Filter by status"
          >
            <option value="ALL">All transactions</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING_PAYMENT">Credit · due</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Rows
          </label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border/50 bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isFetching}
            className="h-9 px-3 rounded-lg border border-border/50 bg-background text-xs font-semibold text-foreground inline-flex items-center gap-1.5 hover:bg-muted/30 disabled:opacity-50 transition"
            aria-label="Refresh sales"
          >
            <RefreshCw
              size={13}
              className={isFetching ? "animate-spin" : ""}
            />
            Sync
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="shrink-0 overflow-x-auto border-b border-border/30 bg-surface/5">
        <table className="w-full min-w-[720px] table-fixed text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-4 sm:px-5 w-[22%]">When</th>
              <th className="py-2.5 px-3 w-[16%]">Status</th>
              <th className="py-2.5 px-3 w-[12%]">Items</th>
              <th className="py-2.5 px-3 w-[16%]">Cashier</th>
              <th className="py-2.5 px-3 w-[14%] hidden lg:table-cell">
                Customer
              </th>
              <th className="py-2.5 px-4 sm:px-5 w-[20%] text-right">Amount</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20">
            <Loader2 className="animate-spin text-brand-primary" size={22} />
            <p className="text-sm text-muted-foreground">Loading sales…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <AlertCircle className="text-destructive" size={22} />
            <p className="text-sm font-medium text-foreground">
              Couldn’t load sales history
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-1 h-9 px-4 rounded-lg bg-brand-primary text-white text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : paginatedSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
            <p className="text-sm font-medium text-foreground">No sales yet</p>
            <p className="text-xs text-muted-foreground">
              {sales.length === 0
                ? "Completed terminal sales will appear here."
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
                  previewHref={`/org/${organizationId}/${normalizedBusinessId}/sale/${sale.id}/preview`}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-border/40 bg-surface/10 text-[10px] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-brand-primary opacity-80" />
          <span>
            {totalItems} transaction{totalItems !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Page{" "}
            <span className="font-bold text-foreground font-mono">
              {safePage}
            </span>{" "}
            of{" "}
            <span className="font-bold text-foreground font-mono">
              {totalPages}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange("prev")}
              disabled={safePage <= 1}
              className="h-7 w-7 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition text-foreground"
              aria-label="Previous page"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange("next")}
              disabled={safePage >= totalPages}
              className="h-7 w-7 rounded-md border border-border/40 flex items-center justify-center disabled:opacity-30 hover:bg-background transition text-foreground"
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
