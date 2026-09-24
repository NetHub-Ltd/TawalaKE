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

function categoryLabel(code: string) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === code)?.label || code || "Other"
  );
}

export function ExpensesClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
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

  const items = list.data?.items ?? [];
  const totalAmount = list.data?.total_amount ?? 0;

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(b.incurred_on).localeCompare(String(a.incurred_on))
      ),
    [items]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (!incurredOn) {
      setFormError("Choose the date the expense was incurred.");
      return;
    }
    try {
      await create.mutateAsync({
        business_id: businessId,
        category,
        amount: n,
        currency: "KES",
        incurred_on: new Date(incurredOn + "T12:00:00").toISOString(),
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setAmount("");
      setVendor("");
      setNotes("");
      setFormSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save expense";
      // Plan gate or feature flag messaging
      if (/expense_tracking|feature|plan|forbidden|403/i.test(msg)) {
        setFormError(
          "Expense tracking is not enabled on this plan. Upgrade to record operating expenses."
        );
      } else {
        setFormError(msg);
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6 pt-2 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h3 text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-muted">
            Track operating costs so overview can show profit after expenses.
          </p>
        </div>
        <Link
          href={`/org/${organizationId}/${businessId}/overview`}
          className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background"
        >
          Back to overview
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-md border border-border/50 bg-card p-4 shadow-card lg:col-span-2"
        >
          <p className="text-xs font-semibold tracking-wide text-muted">
            Add expense
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">Amount (KES)</Label>
            <Input
              id="exp-amount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category</Label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-date">Incurred on</Label>
            <Input
              id="exp-date"
              type="date"
              value={incurredOn}
              max={new Date().toISOString().slice(0, 10)}
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
              maxLength={150}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-notes">Notes (optional)</Label>
            <Input
              id="exp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>
          {formError && (
            <p
              className="text-sm"
              style={{ color: "var(--error)" }}
              role="alert"
            >
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="text-sm text-brand-accent" role="status">
              Expense recorded. Overview profit after expenses will update.
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={create.isPending}
            className="w-full"
          >
            {create.isPending ? "Saving…" : "Save expense"}
          </Button>
        </form>

        <div className="rounded-md border border-border/50 bg-card p-4 shadow-card lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted">
              Recent expenses
            </p>
            <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
              Total {formatKES(totalAmount)}
            </p>
          </div>

          {list.isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
              <Spinner className="h-4 w-4" /> Loading…
            </div>
          )}

          {list.isError && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--error)" }}>
              {(list.error as Error)?.message || "Could not load expenses"}
            </p>
          )}

          {!list.isLoading && !list.isError && sorted.length === 0 && (
            <div className="py-10 text-center text-sm text-muted">
              <p className="font-medium text-foreground">No expenses yet</p>
              <p className="mt-1">
                Add rent, utilities, transport, or other shop costs so overview
                can show profit after expenses.
              </p>
            </div>
          )}

          {sorted.length > 0 && (
            <ul className="divide-y divide-border/40">
              {sorted.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 py-2.5 text-sm"
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
        </div>
      </div>
    </div>
  );
}
