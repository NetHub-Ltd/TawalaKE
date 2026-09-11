"use client";

/**
 * Customer workspace — Overview | History | Settings.
 * Phase 1: reuses existing customer detail + PATCH APIs only.
 * Collect Credit UI is Phase 2 (API already exists).
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Loader2,
  History as HistoryIcon,
  Settings2,
  LayoutDashboard,
  Banknote,
  ShoppingCart,
} from "lucide-react";
import {
  type CustomerDetail,
  formatKES,
} from "@/features/customers/types";

type Tab = "overview" | "history" | "settings";

export function CustomerWorkspace({
  organizationId,
  businessId,
  customerId,
}: {
  organizationId: string;
  businessId: string;
  customerId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(
    ["overview", "history", "settings"].includes(tabParam) ? tabParam : "overview"
  );
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const listPath = `/org/${organizationId}/${businessId}/customers`;
  const basePath = `${listPath}/${customerId}`;

  const syncUrl = useCallback(
    (next: Tab) => {
      setTab(next);
      const url = next === "overview" ? basePath : `${basePath}?tab=${next}`;
      router.replace(url, { scroll: false });
    },
    [basePath, router]
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/customers/${customerId}?businessId=${businessId}`,
        { cache: "no-store" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body.error || body.detail || body.message;
        const msg =
          typeof detail === "string"
            ? detail
            : detail && typeof detail === "object" && "message" in detail
              ? String((detail as { message?: string }).message)
              : `Failed to load customer (${res.status})`;
        throw new Error(msg);
      }
      const data = (body.data ?? body) as CustomerDetail;
      setDetail(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customer");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, customerId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (["overview", "history", "settings"].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  async function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/customers/${customerId}?businessId=${businessId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.detail || body.message || "Update failed");
      }
      setSaveMsg("Saved");
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading workspace…
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

  const hasCredit = (detail.open_credit_total ?? 0) > 0;
  const sales = detail.recent_sales || [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "settings", label: "Settings", icon: Settings2 },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={listPath}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to customers
          </Link>
          <h1 className="text-xl font-semibold text-foreground">{detail.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {[detail.phone, detail.email].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/org/${organizationId}/${businessId}/terminal`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            New sale
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <nav
        className="flex gap-1 border-b border-border/60"
        aria-label="Customer workspace"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => syncUrl(id)}
              className={clsx(
                "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {saveMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {saveMsg}
        </div>
      )}

      {/* Overview */}
      {tab === "overview" && (
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              label="Open credit"
              value={formatKES(detail.open_credit_total)}
              warn={hasCredit}
            />
            <Kpi
              label="Open sales"
              value={String(detail.open_credit_sales_count ?? 0)}
              warn={hasCredit}
            />
            <Kpi label="Lifetime revenue" value={formatKES(detail.lifetime_revenue)} />
            <Kpi
              label="Orders"
              value={String(detail.completed_orders_count ?? 0)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              title="Collect Credit ships in Phase 2"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-muted opacity-70"
            >
              <Banknote className="h-4 w-4" />
              Collect Credit
            </button>
            <button
              type="button"
              onClick={() => syncUrl("settings")}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium"
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={() => syncUrl("history")}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium"
            >
              View history
            </button>
          </div>

          <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
              Recent activity
            </h2>
            {sales.length === 0 ? (
              <p className="rounded-xl border border-border/50 bg-card px-4 py-6 text-center text-sm text-muted">
                No sales linked yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50 bg-card">
                {sales.slice(0, 8).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.status}</p>
                      <p className="text-xs text-muted">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleString("en-KE")
                          : "—"}
                      </p>
                    </div>
                    <span className="font-mono font-semibold">
                      {formatKES(s.total_amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="min-h-0 flex-1 overflow-auto">
          {sales.length === 0 ? (
            <p className="rounded-xl border border-border/50 bg-card px-4 py-10 text-center text-sm text-muted">
              No sales history for this customer yet.
            </p>
          ) : (
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 bg-background/95 text-[10px] font-semibold tracking-wider text-muted uppercase backdrop-blur">
                <tr className="border-b border-border/50">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-muted">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString("en-KE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.status}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatKES(s.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/org/${organizationId}/${businessId}/sale-history/${s.id}`}
                        className="text-xs font-medium text-brand-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-muted">
            Showing sales linked to this customer. Credit collections appear here
            when allocated on the sale record.
          </p>
        </div>
      )}

      {/* Settings */}
      {tab === "settings" && (
        <form
          onSubmit={onSaveSettings}
          className="max-w-xl space-y-4 rounded-xl border border-border/50 bg-card p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor="cust-name">
              Customer name
            </label>
            <input
              id="cust-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted" htmlFor="cust-phone">
                Phone
              </label>
              <input
                id="cust-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-10 w-full rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted" htmlFor="cust-email">
                Email
              </label>
              <input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-10 w-full rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  name: detail.name || "",
                  phone: detail.phone || "",
                  email: detail.email || "",
                })
              }
              className="inline-flex h-10 items-center rounded-xl border border-border/60 px-4 text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card px-3 py-3 shadow-card">
      <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-mono text-base font-semibold sm:text-lg",
          warn ? "text-rose-600" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
