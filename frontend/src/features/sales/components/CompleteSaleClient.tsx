"use client";

/**
 * Post-finalize confirmation — professional success card.
 * Presentational polish only; data from existing useSales.
 */
import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSales, SaleResponse } from "@/features/sales/hooks/useSales";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Zap,
  Package,
  User,
  Calendar,
  Hash,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

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

function isCreditSale(sale: SaleResponse): boolean {
  if (sale.status === "PENDING_PAYMENT") return true;

  const payments = (
    sale as { payments?: Array<{ method?: string; amount?: number }> }
  ).payments;
  if (Array.isArray(payments)) {
    const hasInvoiceMethod = payments.some(
      (p) => String(p?.method || "").toUpperCase() === "INVOICE",
    );
    const collected = payments.reduce(
      (sum, p) => sum + (Number(p?.amount) || 0),
      0,
    );
    if (hasInvoiceMethod && collected <= 0) return true;
  }

  const method = String(
    (sale as { payment_method?: string }).payment_method ||
      (sale as { method?: string }).method ||
      "",
  ).toUpperCase();
  return method === "INVOICE";
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

function customerId(sale: SaleResponse): string | null {
  const c = sale.customer as { id?: string } | undefined;
  if (c?.id) return String(c.id);
  const top = (sale as { customer_id?: string }).customer_id;
  return top ? String(top) : null;
}

function paymentMethodLabel(sale: SaleResponse, credit: boolean): string {
  if (credit) return "Credit";
  const payments = (
    sale as { payments?: Array<{ method?: string }> }
  ).payments;
  if (Array.isArray(payments) && payments[0]?.method) {
    const m = String(payments[0].method).toUpperCase();
    if (m === "CASH") return "Cash";
    if (m === "MPESA") return "M-Pesa";
    return m;
  }
  return "Cash";
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

  const sale = useMemo(() => sales[0] ?? null, [sales]);
  const terminalHref = `/org/${organizationId}/${businessId}/terminal`;
  const previewHref = `/org/${organizationId}/${businessId}/sale/${saleId}/preview`;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Sale not found</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            We could not load this sale summary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(terminalHref)}
          className="inline-flex h-11 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
        >
          Back to terminal
        </button>
      </div>
    );
  }

  const credit = isCreditSale(sale);
  const currency = (sale.currency as string) || "KES";
  const total = Number(sale.total_amount) || 0;
  const items = (sale.items as unknown[]) || [];
  const itemCount = items.length;
  const cust = customerLabel(sale);
  const method = paymentMethodLabel(sale, credit);
  const shortRef = String(sale.id).slice(0, 8);
  const cid = customerId(sale);
  const collectHref = cid
    ? `/org/${organizationId}/${businessId}/customers/${cid}/collect`
    : null;

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(String(sale!.id));
      toast.success("Reference copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-card sm:p-8">
        {/* Hero */}
        <div className="text-center">
          <div
            className={
              credit
                ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700"
                : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700"
            }
          >
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {credit ? "Credit recorded" : "Sale recorded"}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {credit ? "Credit sale recorded" : "Payment complete"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {method} · {cust} · {formatMoney(total, currency)}
            {credit ? " · collect later" : ""}
          </p>
        </div>

        {/* Detail card */}
        <div className="mt-6 rounded-xl border border-border/50 bg-surface/30 px-4 py-4">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Total</dt>
              <dd
                className={
                  credit
                    ? "font-mono text-lg font-bold tabular-nums text-amber-700"
                    : "font-mono text-lg font-bold tabular-nums text-emerald-700"
                }
              >
                {formatMoney(total, currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span
                  className={
                    credit
                      ? "inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"
                      : "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                  }
                >
                  {credit ? "PENDING PAYMENT" : "COMPLETED"}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <User size={14} /> Customer
              </dt>
              <dd className="truncate font-medium text-foreground">{cust}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar size={14} /> When
              </dt>
              <dd className="text-foreground">
                {formatDate(
                  (sale.updated_at as string | undefined) || sale.created_at,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Hash size={14} /> Reference
              </dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-foreground">
                  {shortRef}
                </span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground"
                  aria-label="Copy full reference"
                >
                  <Copy size={13} />
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Package size={14} /> Items
              </dt>
              <dd className="text-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(terminalHref)}
            className="inline-flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Zap size={16} />
            Quick sale
          </button>
          <Link
            href={previewHref}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-sm font-semibold text-foreground transition hover:bg-surface"
          >
            <Receipt size={16} />
            {credit ? "View invoice" : "View receipt"}
          </Link>
        </div>

        {credit && collectHref && (
          <Link
            href={collectHref}
            className="mt-3 block text-center text-xs font-semibold text-brand-primary hover:underline"
          >
            Collect credit for this customer
          </Link>
        )}
      </div>
    </div>
  );
}
