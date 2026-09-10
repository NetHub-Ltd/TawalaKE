"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Loader2, Plus, RefreshCw, Search, Users } from "lucide-react";

export type CustomerRow = {
  id: string;
  business_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  open_credit_total?: number;
  open_credit_sales_count?: number;
  lifetime_revenue?: number;
  completed_orders_count?: number;
};

export type CustomerDetail = CustomerRow & {
  recent_sales?: {
    id: string;
    status: string;
    total_amount: number;
    created_at?: string | null;
  }[];
};

function formatKES(n?: number) {
  const v = Number(n || 0);
  return `Ksh ${v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function CustomersWorkspace({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const [q, setQ] = useState("");
  const [creditOnly, setCreditOnly] = useState(false);
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ businessId, limit: "50" });
      if (q.trim()) params.set("q", q.trim());
      if (creditOnly) params.set("has_open_credit", "true");
      const res = await fetch(`/api/v1/customers?${params}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.detail || body.message || "Failed to load");
      }
      const data = body.data ?? body;
      const list = data.items || [];
      setItems(list);
      setTotal(data.total ?? list.length);
      setSelectedId((prev) => prev ?? (list[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [businessId, q, creditOnly]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadList();
    }, 200);
    return () => clearTimeout(t);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(
          `/api/v1/customers/${selectedId}?businessId=${businessId}`,
          { cache: "no-store" }
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || body.detail || "Failed to load customer");
        }
        if (!cancelled) setDetail((body.data ?? body) as CustomerDetail);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, businessId]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body.error || body.detail || body.message || "Create failed"
        );
      }
      const created = (body.data ?? body) as CustomerRow;
      setShowCreate(false);
      setForm({ name: "", phone: "", email: "" });
      setSelectedId(created.id);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const empty = !loading && items.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-6 pt-2 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-primary" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">Customers</h1>
          <span className="text-xs text-muted">{total} total</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone…"
              className="h-9 w-48 rounded-full border border-border/60 bg-card pl-8 pr-3 text-sm outline-none focus:border-brand-primary sm:w-56"
              aria-label="Search customers"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreditOnly((v) => !v)}
            className={clsx(
              "h-9 rounded-full border px-3 text-xs font-medium",
              creditOnly
                ? "border-amber-500/40 bg-amber-50 text-amber-800"
                : "border-border/60 bg-card text-muted"
            )}
          >
            Open credit
          </button>
          <button
            type="button"
            onClick={() => void loadList()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card"
            aria-label="Refresh"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-brand-primary px-3 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" className="ml-3 underline" onClick={() => void loadList()}>
            Retry
          </button>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={onCreate}
          className="rounded-xl border border-border/50 bg-card p-4 shadow-card"
        >
          <p className="mb-3 text-sm font-semibold">New customer</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name *"
              className="h-9 rounded-lg border border-border/60 px-3 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone"
              className="h-9 rounded-lg border border-border/60 px-3 text-sm"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="h-9 rounded-lg border border-border/60 px-3 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* List */}
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-card">
          <div className="border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Directory
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-border/40" />
                ))}
              </div>
            )}
            {empty && (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-muted">
                <p>No customers yet.</p>
                <p className="text-xs">
                  They appear from credit sales or when you add one here.
                </p>
              </div>
            )}
            {items.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={clsx(
                    "flex w-full flex-col gap-0.5 border-b border-border/30 px-3 py-3 text-left transition-colors",
                    active ? "bg-brand-primary/5" : "hover:bg-background"
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <span className="text-xs text-muted">
                    {c.phone || "No phone"}
                    {(c.open_credit_total || 0) > 0 && (
                      <span className="ml-2 text-amber-700">
                        · {formatKES(c.open_credit_total)} open
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-card">
          <div className="border-b border-border/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Detail
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selectedId && (
              <p className="text-sm text-muted">Select a customer from the list.</p>
            )}
            {selectedId && detailLoading && (
              <div className="h-40 animate-pulse rounded-xl bg-border/40" />
            )}
            {selectedId && !detailLoading && detail && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{detail.name}</h2>
                  <p className="text-sm text-muted">
                    {[detail.phone, detail.email].filter(Boolean).join(" · ") ||
                      "No contact details"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Kpi label="Open credit" value={formatKES(detail.open_credit_total)} warn={(detail.open_credit_total || 0) > 0} />
                  <Kpi label="Open sales" value={String(detail.open_credit_sales_count ?? 0)} />
                  <Kpi label="Lifetime sales" value={formatKES(detail.lifetime_revenue)} />
                  <Kpi label="Orders" value={String(detail.completed_orders_count ?? 0)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/org/${organizationId}/${businessId}/terminal`}
                    className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white"
                  >
                    New sale
                  </Link>
                  <Link
                    href={`/org/${organizationId}/${businessId}/sale-history`}
                    className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-medium"
                  >
                    Sale history
                  </Link>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Recent activity
                  </p>
                  {(detail.recent_sales || []).length === 0 && (
                    <p className="text-sm text-muted">No sales linked yet.</p>
                  )}
                  <ul className="divide-y divide-border/40">
                    {(detail.recent_sales || []).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span className="text-muted">
                          {s.status}
                          {s.created_at
                            ? ` · ${new Date(s.created_at).toLocaleString("en-KE")}`
                            : ""}
                        </span>
                        <span className="font-mono font-medium">
                          {formatKES(s.total_amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
    <div className="rounded-xl border border-border/40 bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-mono text-sm font-semibold",
          warn ? "text-amber-700" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
