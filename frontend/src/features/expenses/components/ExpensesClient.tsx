"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Label, Spinner } from "@/lib/components/ui";
import {
  useCreateExpense,
  useExpenseList,
} from "@/features/expenses/hooks/useExpenses";
import type { ExpenseCategory } from "@/features/expenses/types";
import { formatKES } from "@/features/analytics/lib/format";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { Receipt } from "lucide-react";

/**
 * Branch expenses — full form always visible (no collapsed panel / category dropdown).
 * Gated by expenses:read / expenses:write.
 */
export function ExpensesClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const { can, isLoading: sessionLoading } = usePermissions();
  const canRead = can(Permission.EXPENSES_READ);
  const canWrite = can(Permission.EXPENSES_WRITE);

  const list = useExpenseList(businessId);
  const create = useCreateExpense(businessId);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

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
    if (!category.trim()) {
      setFormError("Enter a category (e.g. Rent, Transport, Supplies).");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter a valid amount greater than zero.");
      return;
    }
    try {
      await create.mutateAsync({
        business_id: businessId,
        category: category.trim().toUpperCase().replace(/\s+/g, "_") as ExpenseCategory,
        amount: value,
        incurred_on: incurredOn,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      setCategory("");
      setAmount("");
      setVendor("");
      setNotes("");
      setReference("");
      setFormSuccess(true);
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

  if (!canRead && !canWrite) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <Receipt className="h-10 w-10 text-muted" aria-hidden />
        <h1 className="text-h4 text-foreground">Expenses</h1>
        <p className="text-sm text-muted">
          You do not have permission to view or record expenses.
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
            Record shop costs so overview can show profit after expenses.
          </p>
        </div>
        <Link
          href={overviewHref}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register hover:text-foreground"
        >
          Overview
        </Link>
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

      {canWrite ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-sm font-semibold text-foreground">Add expense</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exp-category">Category</Label>
              <Input
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Rent, Transport, Supplies"
                required
              />
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
              <Label htmlFor="exp-vendor">Vendor</Label>
              <Input
                id="exp-vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Supplier or payee"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-reference">Reference</Label>
              <Input
                id="exp-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt no. or code"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="exp-notes">Notes</Label>
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
          {formSuccess ? (
            <p className="text-sm text-foreground">Expense saved.</p>
          ) : null}
          <div className="flex justify-end">
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
            <p className="mt-1">Add the first cost using the form above.</p>
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
                    {row.category || "Other"}
                  </p>
                  <p className="text-xs text-muted">
                    {row.incurred_on?.slice?.(0, 10) || row.incurred_on}
                    {row.vendor ? ` · ${row.vendor}` : ""}
                    {row.reference ? ` · ref ${row.reference}` : ""}
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
