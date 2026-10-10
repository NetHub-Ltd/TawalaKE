"use client";

/**
 * Branch expenses — readable table + quick “Add expense” modal.
 * Gated by expenses:read / expenses:write.
 */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Modal,
  Select,
  Spinner,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Textarea,
} from "@/lib/components/ui";
import {
  useCreateExpense,
  useExpenseList,
} from "@/features/expenses/hooks/useExpenses";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseRow,
} from "@/features/expenses/types";
import { formatKES } from "@/features/analytics/lib/format";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { PermissionChecking } from "@/features/auth/components/PermissionChecking";
import { Permission } from "@/lib/rbac";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

function categoryLabel(code: string): string {
  const hit = EXPENSE_CATEGORIES.find((c) => c.value === code);
  if (hit) return hit.label;
  return code
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function emptyForm() {
  return {
    category: "OTHER" as ExpenseCategory,
    amount: "",
    incurredOn: new Date().toISOString().slice(0, 10),
    vendor: "",
    notes: "",
    reference: "",
  };
}

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

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const items = list.data?.items ?? [];
  const totalAmount = list.data?.total_amount ?? 0;
  const totalCount = list.data?.total ?? items.length;

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(b.incurred_on).localeCompare(String(a.incurred_on)),
      ),
    [items],
  );

  const overviewHref = `/org/${organizationId}/${businessId}/overview`;

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openModal = () => {
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (create.isPending) return;
    setModalOpen(false);
    setFormError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const value = Number(form.amount);
    if (!form.category) {
      setFormError("Choose a category.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    if (!form.incurredOn) {
      setFormError("Choose the date this expense was incurred.");
      return;
    }
    try {
      await create.mutateAsync({
        business_id: businessId,
        category: form.category,
        amount: value,
        incurred_on: form.incurredOn,
        vendor: form.vendor.trim() || undefined,
        notes: form.notes.trim() || undefined,
        reference: form.reference.trim() || undefined,
      });
      toast.success("Expense recorded");
      setModalOpen(false);
      setForm(emptyForm());
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save expense",
      );
    }
  };

  if (sessionLoading) {
    return <PermissionChecking className="p-10" />;
  }

  if (!canRead && !canWrite) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <Receipt className="h-10 w-10 text-muted" aria-hidden />
        <h1 className="text-lg font-semibold text-foreground">Expenses</h1>
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Expenses
          </h1>
          <p className="max-w-lg text-sm text-muted">
            Shop operating costs — used on overview for profit after expenses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={overviewHref}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted transition hover:bg-register hover:text-foreground"
          >
            Overview
          </Link>
          {canWrite && (
            <Button type="button" onClick={openModal} className="gap-1.5">
              <Plus size={16} aria-hidden />
              Add expense
            </Button>
          )}
        </div>
      </header>

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Total recorded
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {list.isLoading ? "…" : formatKES(totalAmount)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Entries
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {list.isLoading ? "…" : totalCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Recent expenses
          </h2>
          {list.isFetching && !list.isLoading && (
            <span className="text-xs text-muted">Refreshing…</span>
          )}
        </div>

        {list.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-16 text-muted">
            <Spinner size="sm" /> Loading expenses…
          </div>
        ) : list.isError ? (
          <div className="rounded-lg border border-[var(--error)]/30 bg-card px-4 py-8 text-center text-sm text-[var(--error)]">
            {(list.error as Error)?.message || "Could not load expenses."}
            <div className="mt-3">
              <Button type="button" variant="secondary" onClick={() => list.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
            <Receipt className="h-9 w-9 text-muted" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">
                No expenses yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Record rent, utilities, salaries, and other shop costs so profit
                after expenses stays accurate.
              </p>
            </div>
            {canWrite && (
              <Button type="button" onClick={openModal} className="gap-1.5">
                <Plus size={16} />
                Add first expense
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <THead>
              <TH>Date</TH>
              <TH>Category</TH>
              <TH>Vendor / notes</TH>
              <TH align="right">Amount</TH>
            </THead>
            <TBody>
              {sorted.map((row: ExpenseRow) => (
                <TR key={row.id}>
                  <TD className="whitespace-nowrap text-muted">
                    {formatDate(row.incurred_on)}
                  </TD>
                  <TD>
                    <span className="inline-flex rounded-md bg-register px-2 py-0.5 text-xs font-medium text-foreground">
                      {categoryLabel(row.category)}
                    </span>
                  </TD>
                  <TD className="max-w-[14rem]">
                    <div className="truncate text-foreground">
                      {row.vendor || "—"}
                    </div>
                    {row.notes ? (
                      <div className="truncate text-xs text-muted">
                        {row.notes}
                      </div>
                    ) : null}
                    {row.reference ? (
                      <div className="truncate font-mono text-[11px] text-muted">
                        Ref {row.reference}
                      </div>
                    ) : null}
                  </TD>
                  <TD align="right" tabular className="font-medium">
                    {formatKES(row.amount)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      {/* Create modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Add expense"
        className="max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="expense-create-form"
              disabled={create.isPending}
            >
              {create.isPending ? (
                <>
                  <Spinner size="sm" /> Saving…
                </>
              ) : (
                "Save expense"
              )}
            </Button>
          </>
        }
      >
        <form
          id="expense-create-form"
          onSubmit={onSubmit}
          className="space-y-3 text-left text-foreground"
        >
          <p className="text-sm text-muted">
            All fields that apply to this cost. Category and amount are required.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exp-category">Category</Label>
              <Select
                id="exp-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ExpenseCategory,
                  }))
                }
                disabled={create.isPending}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (KES)</Label>
              <Input
                id="exp-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                disabled={create.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-date">Date incurred</Label>
            <Input
              id="exp-date"
              type="date"
              value={form.incurredOn}
              onChange={(e) =>
                setForm((f) => ({ ...f, incurredOn: e.target.value }))
              }
              disabled={create.isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-vendor">Vendor</Label>
            <Input
              id="exp-vendor"
              placeholder="Who was paid?"
              value={form.vendor}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor: e.target.value }))
              }
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-ref">Reference</Label>
            <Input
              id="exp-ref"
              placeholder="Receipt no. / M-Pesa code"
              value={form.reference}
              onChange={(e) =>
                setForm((f) => ({ ...f, reference: e.target.value }))
              }
              disabled={create.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-notes">Notes</Label>
            <Textarea
              id="exp-notes"
              placeholder="Optional details"
              rows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              disabled={create.isPending}
            />
          </div>

          {formError && (
            <p className="text-sm text-[var(--error)]" role="alert">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
