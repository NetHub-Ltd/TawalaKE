"use client";

/**
 * Collect Credit — pick an open PENDING_PAYMENT sale and record CASH/MPESA payment.
 * Uses existing POST /business/sales/{id}/collect (full sale amount).
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowLeft, Banknote, Loader2 } from "lucide-react";
import {
  type CustomerDetail,
  type CustomerSaleRow,
  formatKES,
} from "@/features/customers/types";

type Method = "CASH" | "MPESA";

export function CollectCreditForm({
  organizationId,
  businessId,
  customerId,
}: {
  organizationId: string;
  businessId: string;
  customerId: string;
}) {
  const router = useRouter();
  const workspacePath = `/org/${organizationId}/${businessId}/customers/${customerId}`;
  const listPath = `/org/${organizationId}/${businessId}/customers`;

  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("MPESA");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/customers/${customerId}?businessId=${businessId}`,
        { cache: "no-store" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = body.error || body.detail || body.message;
        throw new Error(typeof d === "string" ? d : "Failed to load customer");
      }
      const data = (body.data ?? body) as CustomerDetail;
      setDetail(data);
      const open =
        data.open_credit_sales?.filter((s) => s.status === "PENDING_PAYMENT") ||
        data.recent_sales?.filter((s) => s.status === "PENDING_PAYMENT") ||
        [];
      setSelectedId((prev) => prev ?? (open[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSales: CustomerSaleRow[] =
    detail?.open_credit_sales?.filter((s) => s.status === "PENDING_PAYMENT") ||
    detail?.recent_sales?.filter((s) => s.status === "PENDING_PAYMENT") ||
    [];

  const selected = openSales.find((s) => s.id === selectedId) || openSales[0];
  const outstanding = detail?.open_credit_total ?? 0;
  const collectAmount = selected?.total_amount ?? 0;
  const after = Math.max(0, outstanding - collectAmount);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/v1/org/stores/sales/${selected.id}/collect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_method: method,
            payment_reference: reference.trim() || null,
            customer_name: detail?.name ?? null,
            customer_phone: detail?.phone ?? null,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = body.error || body.detail || body.message;
        throw new Error(
          typeof d === "string"
            ? d
            : `Collection failed (${res.status})`
        );
      }
      setSuccess(
        `Collected ${formatKES(collectAmount)} via ${method}. Open credit updated.`
      );
      // Refresh then return to overview
      setTimeout(() => {
        router.push(workspacePath);
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
        <Link
          href={listPath}
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <Link
          href={workspacePath}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {detail.name}
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Banknote className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          Collect Credit
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {detail.name}
          {detail.phone ? ` · ${detail.phone}` : ""}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Outstanding" value={formatKES(outstanding)} tone="warn" />
        <SummaryCard label="Collecting" value={formatKES(collectAmount)} tone="ok" />
        <SummaryCard label="After" value={formatKES(after)} />
      </div>

      {openSales.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-5 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">No open credit sales</p>
          <p className="mt-1 text-sm text-muted">
            This customer has no PENDING_PAYMENT invoices to collect.
          </p>
          <Link
            href={workspacePath}
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-border/60 px-4 text-sm font-medium"
          >
            Back to workspace
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-border/50 bg-card p-5 shadow-card">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Open sale to collect
            </legend>
            <ul className="space-y-2">
              {openSales.map((s) => {
                const active = (selected?.id || selectedId) === s.id;
                return (
                  <li key={s.id}>
                    <label
                      className={clsx(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
                        active
                          ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30"
                          : "border-border/60 hover:border-border"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="sale"
                          value={s.id}
                          checked={active}
                          onChange={() => setSelectedId(s.id)}
                          className="h-4 w-4 accent-[var(--brand-primary,#4F46E5)]"
                        />
                        <span>
                          <span className="block text-sm font-medium text-foreground">
                            {s.created_at
                              ? new Date(s.created_at).toLocaleString("en-KE")
                              : "Sale"}
                          </span>
                          <span className="text-xs text-muted">{s.status}</span>
                        </span>
                      </span>
                      <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                        {formatKES(s.total_amount)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Collection settles the full sale amount (API does not support partial pay yet).
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Payment method
            </legend>
            <div className="flex flex-wrap gap-2">
              {(["MPESA", "CASH"] as Method[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={clsx(
                    "h-10 min-w-[96px] rounded-xl border px-4 text-sm font-semibold transition-colors",
                    method === m
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-border/60 bg-background text-foreground hover:border-border"
                  )}
                >
                  {m === "MPESA" ? "M-Pesa" : "Cash"}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="ref" className="mb-1 block text-xs font-medium text-muted">
              Reference / M-Pesa code {method === "CASH" ? "(optional)" : ""}
            </label>
            <input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === "MPESA" ? "e.g. QHB72KL9" : "Optional note"}
              className="h-11 w-full rounded-xl border border-border/60 px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selected}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Collecting…
              </>
            ) : (
              <>Collect {formatKES(collectAmount)}</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "ok";
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-card">
      <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-mono text-lg font-bold tabular-nums",
          tone === "warn" && "text-rose-600",
          tone === "ok" && "text-emerald-700",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
