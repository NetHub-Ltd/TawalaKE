"use client";

/**
 * Customers overview list — search, open-credit filter, create, row → workspace.
 * Operational list only; detail lives at /customers/[customerId].
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Loader2, Plus, RefreshCw, Search, Users, ChevronRight } from "lucide-react";
import { type CustomerRow, formatKES } from "@/features/customers/types";

export function CustomersList({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [creditOnly, setCreditOnly] = useState(false);
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const base = `/org/${organizationId}/${businessId}/customers`;

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ businessId, limit: "50" });
      if (q.trim()) params.set("q", q.trim());
      if (creditOnly) params.set("has_open_credit", "true");
      const res = await fetch(`/api/v1/customers?${params}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.detail || body.message || "Failed to load");
      }
      const data = body.data ?? body;
      const list = data.items || [];
      setItems(list);
      setTotal(data.total ?? list.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [businessId, q, creditOnly]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/customers`, {
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
        throw new Error(body.error || body.detail || body.message || "Create failed");
      }
      const created = (body.data ?? body) as CustomerRow;
      setShowCreate(false);
      setForm({ name: "", phone: "", email: "" });
      await loadList();
      if (created?.id) {
        router.push(`${base}/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Customers</h1>
            <p className="text-xs text-muted">
              {loading ? "Loading…" : `${total} customer${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
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

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/50 bg-card shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-background/95 text-[10px] font-semibold tracking-wider text-muted uppercase backdrop-blur">
            <tr className="border-b border-border/50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Open credit</th>
              <th className="px-4 py-3 text-right">Lifetime</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No customers yet. Add one to track credit and sales history.
                </td>
              </tr>
            )}
            {items.map((c) => {
              const hasCredit = (c.open_credit_total ?? 0) > 0;
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer transition-colors hover:bg-brand-primary/5"
                  onClick={() => router.push(`${base}/${c.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.phone || "—"}</td>
                  <td
                    className={clsx(
                      "px-4 py-3 text-right font-mono text-sm",
                      hasCredit ? "font-semibold text-rose-600" : "text-muted"
                    )}
                  >
                    {hasCredit ? formatKES(c.open_credit_total) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                    {formatKES(c.lifetime_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {c.completed_orders_count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {hasCredit ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        Credit
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="inline h-4 w-4 text-muted" aria-hidden="true" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading customers…
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted sm:text-left">
        Click a row to open the customer workspace.{" "}
        <Link href={`/org/${organizationId}/${businessId}/terminal`} className="text-brand-primary hover:underline">
          New sale
        </Link>
      </p>
    </div>
  );
}
