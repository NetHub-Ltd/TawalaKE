"use client";

/**
 * Customers overview list — paginated, glanceable, clearly clickable rows.
 * Detail lives at /customers/[customerId].
 */
import React, { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Banknote,
} from "lucide-react";
import { type CustomerRow, formatKES } from "@/features/customers/types";

const PAGE_SIZES = [10, 25, 50] as const;
const SEARCH_DEBOUNCE_MS = 300;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CustomersList({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const router = useRouter();
  const limitSelectId = useId();
  const searchId = useId();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [creditOnly, setCreditOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [items, setItems] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const base = `/org/${organizationId}/${businessId}/customers`;

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, creditOnly, pageSize]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * pageSize;
      const params = new URLSearchParams({
        businessId,
        limit: String(pageSize),
        skip: String(skip),
      });
      if (debouncedQ) params.set("q", debouncedQ);
      if (creditOnly) params.set("has_open_credit", "true");
      const res = await fetch(`/api/v1/customers?${params}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.detail || body.message || "Failed to load");
      }
      const data = body.data ?? body;
      const list: CustomerRow[] = data.items || [];
      setItems(list);
      setTotal(typeof data.total === "number" ? data.total : list.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [businessId, debouncedQ, creditOnly, page, pageSize]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);
  const creditCountOnPage = items.filter((c) => (c.open_credit_total ?? 0) > 0).length;

  function openWorkspace(id: string) {
    router.push(`${base}/${id}`);
  }

  function onRowKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openWorkspace(id);
    }
  }

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
      if (created?.id) {
        router.push(`${base}/${created.id}`);
        return;
      }
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const emptyMessage = (() => {
    if (loading) return null;
    if (items.length > 0) return null;
    if (creditOnly) {
      return {
        title: "No open credit right now",
        body: "Nobody on this page has outstanding credit balances.",
        action: (
          <button
            type="button"
            onClick={() => setCreditOnly(false)}
            className="mt-3 text-sm font-medium text-brand-primary hover:underline"
          >
            Clear open-credit filter
          </button>
        ),
      };
    }
    if (debouncedQ) {
      return {
        title: "No matches",
        body: `No customers match “${debouncedQ}”.`,
        action: (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="mt-3 text-sm font-medium text-brand-primary hover:underline"
          >
            Clear search
          </button>
        ),
      };
    }
    return {
      title: "No customers yet",
      body: "Add a customer to track credit sales and history.",
      action: (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </button>
      ),
    };
  })();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Users className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Customers
            </h1>
            <p className="text-xs text-muted tabular-nums">
              {loading ? "Loading…" : `${total} customer${total === 1 ? "" : "s"}`}
              {!loading && creditOnly && creditCountOnPage > 0
                ? ` · ${creditCountOnPage} with credit on this page`
                : null}
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
              id={searchId}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, phone…"
              className="h-10 w-44 rounded-full border border-border/60 bg-card pl-8 pr-3 text-sm outline-none transition-shadow focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 sm:w-56"
              aria-label="Search customers"
            />
          </div>

          <button
            type="button"
            onClick={() => setCreditOnly((v) => !v)}
            aria-pressed={creditOnly}
            className={clsx(
              "inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
              creditOnly
                ? "border-amber-500/40 bg-amber-50 text-amber-900"
                : "border-border/60 bg-card text-muted hover:text-foreground"
            )}
          >
            <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
            Open credit
          </button>

          <div className="flex items-center gap-1.5">
            <label htmlFor={limitSelectId} className="sr-only">
              Rows per page
            </label>
            <select
              id={limitSelectId}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 rounded-full border border-border/60 bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-brand-primary"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} rows
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadList()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-muted transition-colors hover:text-foreground"
            aria-label="Refresh customers"
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
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => void loadList()}
          >
            Retry
          </button>
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={onCreate}
          className="rounded-xl border border-border/50 bg-card p-4 shadow-card"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">New customer</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name *"
              className="h-10 rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
              autoFocus
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone"
              className="h-10 rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="h-10 rounded-lg border border-border/60 px-3 text-sm outline-none focus:border-brand-primary"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="inline-flex h-10 items-center rounded-xl border border-border/60 px-4 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table card */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-card">
        <div className="min-h-0 flex-1 overflow-auto">
          {/* Desktop table */}
          <table className="hidden w-full min-w-[720px] text-left text-sm md:table">
            <thead className="sticky top-0 z-10 bg-background/95 text-[10px] font-semibold tracking-wider text-muted uppercase backdrop-blur">
              <tr className="border-b border-border/50">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Open credit</th>
                <th className="px-4 py-3 text-right">Lifetime</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading customers…
                  </td>
                </tr>
              )}
              {!loading && emptyMessage && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {emptyMessage.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">{emptyMessage.body}</p>
                    {emptyMessage.action}
                  </td>
                </tr>
              )}
              {items.map((c) => {
                const hasCredit = (c.open_credit_total ?? 0) > 0;
                const openSales = c.open_credit_sales_count ?? 0;
                return (
                  <tr
                    key={c.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${c.name}${hasCredit ? `, open credit ${formatKES(c.open_credit_total)}` : ""}`}
                    onClick={() => openWorkspace(c.id)}
                    onKeyDown={(e) => onRowKeyDown(e, c.id)}
                    className={clsx(
                      "group cursor-pointer border-l-2 border-transparent transition-colors",
                      "hover:border-l-brand-primary hover:bg-brand-primary/[0.04]",
                      "focus-visible:bg-brand-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/40"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            hasCredit
                              ? "bg-rose-100 text-rose-800"
                              : "bg-brand-primary/10 text-brand-primary"
                          )}
                          aria-hidden="true"
                        >
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground group-hover:text-brand-primary">
                            {c.name}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {c.phone || "No phone"}
                            {c.email ? ` · ${c.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasCredit ? (
                        <div>
                          <p className="font-mono text-sm font-bold text-rose-600 tabular-nums">
                            {formatKES(c.open_credit_total)}
                          </p>
                          {openSales > 0 && (
                            <p className="text-[10px] font-medium text-rose-500/90">
                              {openSales} open sale{openSales === 1 ? "" : "s"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                      {formatKES(c.lifetime_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                      {c.completed_orders_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight
                        className="inline h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-border/40 md:hidden">
            {loading && items.length === 0 && (
              <li className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </li>
            )}
            {!loading && emptyMessage && (
              <li className="px-4 py-14 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {emptyMessage.title}
                </p>
                <p className="mt-1 text-sm text-muted">{emptyMessage.body}</p>
                {emptyMessage.action}
              </li>
            )}
            {items.map((c) => {
              const hasCredit = (c.open_credit_total ?? 0) > 0;
              const openSales = c.open_credit_sales_count ?? 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openWorkspace(c.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-brand-primary/5"
                    aria-label={`Open ${c.name}`}
                  >
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        hasCredit
                          ? "bg-rose-100 text-rose-800"
                          : "bg-brand-primary/10 text-brand-primary"
                      )}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold text-foreground">{c.name}</p>
                        {hasCredit ? (
                          <p className="shrink-0 font-mono text-sm font-bold text-rose-600 tabular-nums">
                            {formatKES(c.open_credit_total)}
                          </p>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {c.phone || "No phone"}
                        {" · "}
                        {c.completed_orders_count ?? 0} order
                        {(c.completed_orders_count ?? 0) === 1 ? "" : "s"}
                        {" · "}
                        {formatKES(c.lifetime_revenue)}
                      </p>
                      {hasCredit && openSales > 0 && (
                        <p className="mt-0.5 text-[10px] font-medium text-rose-500">
                          {openSales} open sale{openSales === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer pagination */}
        <footer className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-border/60 bg-background/40 px-4 py-3 sm:flex-row sm:px-5">
          <span className="text-xs font-medium text-muted tabular-nums">
            {total === 0 ? (
              "No records"
            ) : (
              <>
                Showing{" "}
                <span className="font-bold text-foreground">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">{total}</span>
              </>
            )}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tabular-nums text-foreground">
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>
            <nav aria-label="Pagination" className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading || total === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </footer>
      </div>

      <p className="text-center text-xs text-muted sm:text-left">
        <Link
          href={`/org/${organizationId}/${businessId}/terminal`}
          className="font-medium text-brand-primary hover:underline"
        >
          New sale
        </Link>
        <span className="text-muted/80"> · attach a customer at checkout for credit</span>
      </p>
    </div>
  );
}
