"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSales, SaleResponse } from "@/features/sales/hooks/useSales";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Zap,
  Package,
  User,
  Calendar,
  Hash,
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

function customerLabel(sale: SaleResponse): string {
  const c = sale.customer as
    | { name?: string; full_name?: string; phone?: string }
    | undefined;
  if (c?.name) return c.name;
  if (c?.full_name) return c.full_name;
  const name = sale.customer_name as string | undefined;
  if (name) return name;
  return "—";
}

function itemCount(sale: SaleResponse): number {
  if (Array.isArray(sale.items)) return sale.items.length;
  return 0;
}

type Props = {
  organizationId: string;
  businessId: string;
  saleId: string;
};

export default function CompleteSaleClient({
  organizationId,
  businessId,
  saleId,
}: Props) {
  const router = useRouter();
  const { sales, isLoading, error } = useSales({
    businessId,
    saleId,
    limit: 1,
  });

  const sale = useMemo(() => {
    if (!sales?.length) return null;
    return sales.find((s) => s.id === saleId) ?? sales[0] ?? null;
  }, [sales, saleId]);

  const terminalHref = `/org/${organizationId}/${businessId}/terminal`;
  const previewHref = `/org/${organizationId}/${businessId}/sale/${saleId}/preview`;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-brand-primary" size={22} />
        <p className="text-sm text-muted">Loading sale summary…</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
        <AlertCircle className="text-brand-accent" size={22} />
        <p className="text-sm font-medium text-foreground">
          {error?.message || "Sale could not be loaded."}
        </p>
        <Link
          href={terminalHref}
          className="mt-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to terminal
        </Link>
      </div>
    );
  }

  const status = String(sale.status || "").toUpperCase();
  const isPending = status === "PENDING_PAYMENT";
  const isCompleted = status === "COMPLETED";
  const currency = (sale.currency as string) || "KES";
  const count = itemCount(sale);
  const shortId = sale.id.slice(0, 8).toUpperCase();

  const shellClass = isPending
    ? "rounded-2xl border-2 border-amber-500/40 bg-card p-6 shadow-lift sm:p-8"
    : "rounded-2xl border-2 border-emerald-500/35 bg-card p-6 shadow-lift sm:p-8";

  const iconWrap = isPending
    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600"
    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600";

  const badgeClass = isPending
    ? "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700"
    : "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-10">
      <div className={shellClass}>
        <div className="mb-6 flex items-start gap-3">
          <div className={iconWrap}>
            {isPending ? <Clock size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={
                isPending
                  ? "text-xs font-semibold uppercase tracking-wide text-amber-600"
                  : "text-xs font-semibold uppercase tracking-wide text-emerald-600"
              }
            >
              {isPending ? "Awaiting payment" : "Sale recorded"}
            </p>
            <h1 className="text-xl font-semibold text-foreground">
              {isPending ? "Invoice ready" : "Payment complete"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isPending
                ? "This sale is unpaid. Open the invoice or start the next sale."
                : "Payment received. Open the receipt or start the next sale."}
            </p>
          </div>
        </div>

        <dl className="space-y-3 rounded-xl border border-border/60 bg-background/50 px-4 py-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Hash size={14} /> Reference
            </dt>
            <dd className="font-mono font-medium text-foreground">{shortId}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar size={14} /> When
            </dt>
            <dd className="text-foreground">
              {formatDate(
                (sale.updated_at as string | undefined) || sale.created_at,
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Status</dt>
            <dd>
              <span className={badgeClass}>
                {status.replace(/_/g, " ") || "UNKNOWN"}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <User size={14} /> Customer
            </dt>
            <dd className="truncate text-foreground">{customerLabel(sale)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Package size={14} /> Items
            </dt>
            <dd className="text-foreground">
              {count} {count === 1 ? "item" : "items"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {formatMoney(Number(sale.total_amount) || 0, currency)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(terminalHref)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Zap size={16} />
            Quick sale
          </button>
          <Link
            href={previewHref}
            className={
              isPending
                ? "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-amber-600 bg-transparent text-sm font-semibold text-amber-700 transition hover:bg-amber-600 hover:text-white"
                : "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-transparent text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            }
          >
            <Receipt size={16} />
            {isPending ? "View invoice" : isCompleted ? "View receipt" : "View document"}
          </Link>
        </div>
      </div>
    </div>
  );
}
