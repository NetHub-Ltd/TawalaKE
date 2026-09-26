"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Label, Spinner } from "@/lib/components/ui";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/features/expenses/types";
import {
  useCreateExpense,
  useExpenseList,
} from "@/features/expenses/hooks/useExpenses";
import { formatKES } from "@/features/analytics/lib/format";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { Receipt, Plus } from "lucide-react";

function categoryLabel(code: string) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === code)?.label || code || "Other"
  );
}

/**
 * Branch expenses — record shop costs so overview can show profit after expenses.
 * Requires REPORTS_READ (Owner/Admin/Manager). Cashiers are not expense editors.
 */
export function ExpensesClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const { can, isLoading: sessionLoading } = usePermissions();
  const canManage = can(Permission.REPORTS_READ);

  const list = useExpenseList(businessId);
  const create = useCreateExpense(businessId);

  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const items = list.data?.items ?? [];
  const totalAmount = list.data?.total_amount ?? 0;

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(b.incurred_on).localeCompare(String(a.incurred_on))
      ),
    [items]
  );

  const overviewHref = `/org/${organizationId}/${businessId}/overview`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter a valid amount greater than zero.");
      return;
    }
    try {
      await create.mutateAsync({
        business_id: businessId,
        category,
        amount: value,
        incurred_on: incurredOn,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setAmount("");
      setVendor("");
      setNotes("");
      setFormSuccess(true);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save expense");
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-10 text-muted">
        <Spinner /> Loading…
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <Receipt className="h-10 w-10 text-muted" aria-hidden />
        <h1 className="text-h4 text-foreground">Expenses</h1>
        <p className="text-sm text-muted">
          Recording shop expenses is available to managers and owners. Cashiers
          can complete sales and view their own history from the terminal.
        </p>
        <Link
          href={`/org/${organizationId}/${businessId}/terminal`}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          Back to terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-h3 text-foreground">Expenses</h1>
          <p className="max-w-xl text-sm text-muted">
            Track rent, utilities, transport, and other shop costs. These feed
            overview profit after expenses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={overviewHref}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register hover:text-foreground"
          >
            Overview
          </Link>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setShowForm((v) => !v);
              setFormSuccess(false);
              setFormError(null);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {showForm ? "Close form" : "Add expense"}
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Recorded total
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatKES(totalAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Entries
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {sorted.length}
          </p>
        </div>
      </div>

      {formSuccess ? (
        <p className="rounded-md border border-border bg-register px-3 py-2 text-sm text-foreground">
          Expense saved.
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-sm font-semibold text-foreground">New expense</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exp-category">Category</Label>
              <select
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (KES)</Label>
              <Input
                id="exp-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={incurredOn}
                onChange={(e) => setIncurredOn(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-vendor">Vendor (optional)</Label>
              <Input
                id="exp-vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Supplier or payee"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-notes">Notes (optional)</Label>
              <Input
                id="exp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Short description"
              />
            </div>
          </div>
          {formError ? (
            <p className="text-sm text-[var(--error)]" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Save expense"}
            </Button>
          </div>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Recent expenses
          </h2>
        </div>

        {list.isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
            <Spinner className="h-4 w-4" /> Loading…
          </div>
        )}

        {list.isError && (
          <p className="px-4 py-8 text-center text-sm text-[var(--error)]">
            {(list.error as Error)?.message || "Could not load expenses"}
          </p>
        )}

        {!list.isLoading && !list.isError && sorted.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted">
            <p className="font-medium text-foreground">No expenses yet</p>
            <p className="mt-1">
              Add rent, utilities, transport, or other shop costs so overview can
              show profit after expenses.
            </p>
            <Button
              type="button"
              variant="primary"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Add first expense
            </Button>
          </div>
        )}

        {sorted.length > 0 && (
          <ul className="divide-y divide-border">
            {sorted.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {categoryLabel(row.category)}
                  </p>
                  <p className="text-xs text-muted">
                    {row.incurred_on?.slice?.(0, 10) || row.incurred_on}
                    {row.vendor ? ` · ${row.vendor}` : ""}
                    {row.notes ? ` · ${row.notes}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-mono font-semibold tabular-nums text-foreground">
                  {formatKES(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
