"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useSales,
  SaleResponse,
  getSaleItemCount,
  getSaleCashierName,
  getSaleBusinessName,
  isCreditSale,
} from "@/features/sales/hooks/useSales";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import {
  ArrowLeft,
  Calendar,
  Package,
  User,
  AlertCircle,
  Loader2,
  Receipt,
  Building2,
  Phone,
  Hash,
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

function statusStyles(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-500/10 text-amber-700 border-amber-500/25";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25";
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-700 border-rose-500/25";
    default:
      return "bg-muted/10 text-muted-foreground border-border/40";
  }
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { businessId } = useBusinessContext();

  const organizationId =
    (params?.organizationId as string) ||
    (params?.orgId as string) ||
    "default";

  const saleId = (params?.saleId as string) || "";

  const normalizedBusinessId = Array.isArray(businessId)
    ? businessId[0]
    : businessId || (params?.businessId as string) || "";

  const { sales, isLoading, error } = useSales({
    businessId: normalizedBusinessId,
    saleId,
  });

  const sale: SaleResponse | null = sales[0] ?? null;

  const backHref = `/org/${organizationId}/${normalizedBusinessId}/sale-history`;

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-brand-primary" size={22} />
          <p className="text-sm text-muted">Loading sale details...</p>
        </div>
      </div>
    );
  }

  /* ---------- Error / not found ---------- */
  if (error || !sale) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle size={22} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Couldn’t load this sale
          </h2>
          <p className="text-sm text-muted mt-1 max-w-xs">
            {error?.message || "Sale not found or no longer available."}
          </p>
        </div>
        <Link
          href={backHref}
          className="mt-2 h-10 px-5 rounded-xl bg-brand-primary text-white text-sm font-medium flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to history
        </Link>
      </div>
    );
  }

  /* ---------- Derived values ---------- */
  const currency = (sale.currency as string) || "KES";
  const subtotal = toNumber(sale.subtotal);
  const discount = toNumber(sale.discount);
  const taxAmount = toNumber(sale.tax_amount);
  const total = toNumber(sale.total_amount);
  const lineItems = Array.isArray(sale.items) ? sale.items : [];
  const itemCount = getSaleItemCount(sale);
  const timestamp =
    (sale.updated_at as string | undefined) || sale.created_at;
  const cashierName = getSaleCashierName(sale);
  const businessName = getSaleBusinessName(sale);
  const credit = isCreditSale(sale);
  const customerName =
    (sale.customer as { name?: string } | undefined)?.name || null;
  const customerPhone =
    (sale.customer as { phone?: string } | undefined)?.phone || null;
  const statusDisplay = credit
    ? "Credit · payment due"
    : String(sale.status).replace(/_/g, " ");

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-border/40 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="h-9 w-9 rounded-xl border border-border/40 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Back to sale history"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-muted truncate">Sale detail</p>
            <h1 className="text-sm font-semibold text-foreground truncate font-mono">
              {sale.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusStyles(
            sale.status,
          )}`}
        >
          {statusDisplay}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Amount hero */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8">
            <p className="text-sm text-muted mb-1">Net payable</p>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatMoney(total, currency)}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="opacity-50" />
                {formatDate(timestamp)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package size={13} className="opacity-50" />
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User size={13} className="opacity-50" />
                {cashierName}
              </span>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetaCard
              icon={<Building2 size={14} />}
              label="Business"
              value={businessName}
            />
            <MetaCard
              icon={<User size={14} />}
              label="Cashier"
              value={cashierName}
            />
            <MetaCard
              icon={<Hash size={14} />}
              label="Sale ID"
              value={sale.id}
              mono
            />
            <MetaCard
              icon={<Calendar size={14} />}
              label="Last updated"
              value={formatDate(timestamp)}
            />
            {customerName && (
              <MetaCard
                icon={<User size={14} />}
                label="Customer"
                value={customerName}
              />
            )}
            {customerPhone && (
              <MetaCard
                icon={<Phone size={14} />}
                label="Customer phone"
                value={customerPhone}
              />
            )}
          </div>

          {/* Line items */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Line items
            </h2>
            {lineItems.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card px-5 py-8 text-center text-sm text-muted">
                No line items on this sale.
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <ul className="divide-y divide-border/30">
                  {lineItems.map((item, idx) => {
                    const qty = toNumber(item.quantity);
                    const unit = toNumber(item.unit_price);
                    const lineTotal = toNumber(item.subtotal) || qty * unit;
                    return (
                      <li
                        key={`${item.name}-${idx}`}
                        className="flex items-start justify-between gap-4 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name || "Item"}
                          </p>
                          <p className="text-xs text-muted tabular-nums mt-0.5">
                            {qty} × {formatMoney(unit, currency)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                          {formatMoney(lineTotal, currency)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Totals */}
          <section className="rounded-xl border border-border/40 bg-card p-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums text-foreground">
                {formatMoney(subtotal, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span className="tabular-nums text-foreground">
                {formatMoney(taxAmount, currency)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums">
                  −{formatMoney(discount, currency)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-border/50 flex justify-between items-baseline">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatMoney(total, currency)}
              </span>
            </div>
          </section>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={backHref}
              className="h-11 px-5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to history
            </Link>
            {(sale.status === "COMPLETED" ||
              sale.status === "PENDING_PAYMENT") && (
              <button
                type="button"
                className="h-11 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                onClick={() => {
                  router.push(
                    `/org/${organizationId}/${normalizedBusinessId}/sale/${sale.id}/preview`,
                  );
                }}
              >
                <Receipt size={16} />
                {sale.status === "PENDING_PAYMENT"
                  ? "View invoice"
                  : "View receipt"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small presentational piece                                                 */
/* -------------------------------------------------------------------------- */

function MetaCard({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-muted mb-1">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`text-sm text-foreground truncate ${
          mono ? "font-mono text-xs" : "font-medium"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}