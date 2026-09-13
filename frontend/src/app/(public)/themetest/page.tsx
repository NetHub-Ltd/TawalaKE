"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/lib/components/ui/Button";

/**
 * Theme laboratory for Modern Retail Operating System (DESIGN.md).
 * Validates tokens, type, controls, feedback, and POS-relevant patterns
 * before product surfaces are restyled.
 */
export default function ThemeTestPage() {
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [selectVal, setSelectVal] = useState("cash");
  const [loadingBtn, setLoadingBtn] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [dark]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const runLoading = () => {
    setLoadingBtn(true);
    window.setTimeout(() => {
      setLoadingBtn(false);
      showToast("Sale finalized — KSh 4,250.00");
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-background text-foreground section-padding pb-28">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-glow"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
          <p className="text-sm font-medium text-foreground">{toast}</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-h3">
              Confirm void
            </h2>
            <p className="mt-2 text-sm text-muted">
              This removes the line from the ticket. Stock is not adjusted until the sale is finalized.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="h-12 rounded-md border border-border bg-transparent px-5 text-sm font-semibold text-foreground hover:bg-register"
                onClick={() => setModalOpen(false)}
              >
                Keep line
              </button>
              <button
                type="button"
                className="h-12 rounded-md bg-brand-secondary px-5 text-sm font-semibold text-white hover:opacity-90"
                onClick={() => {
                  setModalOpen(false);
                  showToast("Line voided");
                }}
              >
                Void line
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header + theme toggle */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Design system lab
            </p>
            <h1 className="text-h1 mt-1">Modern Retail OS</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Token and component laboratory for petrol teal, terracotta attention, and mint settlement.
              Product screens are not restyled in this PR.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{dark ? "Dark" : "Light"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-label="Toggle dark theme"
              onClick={() => setDark((v) => !v)}
              className={`relative h-8 w-14 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                dark ? "bg-brand-primary" : "bg-surface-container-high"
              }`}
              style={{
                backgroundColor: dark ? "var(--brand-primary)" : "var(--surface-container-high)",
              }}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  dark ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </header>

        {/* Color swatches */}
        <section aria-labelledby="colors-heading" className="space-y-4">
          <h2 id="colors-heading" className="text-h3">
            Color roles
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { name: "Primary", var: "var(--brand-primary)", note: "Command / nav" },
              { name: "Secondary", var: "var(--brand-secondary)", note: "Void / urgency" },
              { name: "Success", var: "var(--brand-accent)", note: "Pay / matched" },
              { name: "Error", var: "var(--error)", note: "Blocking" },
              { name: "Border", var: "var(--border)", note: "Structure" },
              { name: "Muted", var: "var(--muted)", note: "Meta" },
            ].map((c) => (
              <div key={c.name} className="card-layered overflow-hidden">
                <div className="h-16" style={{ backgroundColor: c.var }} />
                <div className="p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section aria-labelledby="type-heading" className="card-layered space-y-4 p-6">
          <h2 id="type-heading" className="text-h3">
            Typography
          </h2>
          <p className="text-h1">Headline XL — Plus Jakarta</p>
          <p className="text-h2">Headline LG — module titles</p>
          <p className="text-h3">Headline MD — section headers</p>
          <p className="text-base text-foreground">
            Body (Inter) — operational copy, labels, and form help. Prefer clarity over decoration.
          </p>
          <p className="text-sm text-muted">Muted body — metadata, timestamps, secondary help.</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-8 border-t border-border pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Amount LG</p>
              <p className="amount-lg text-foreground">KSh 128,450.00</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Amount MD</p>
              <p className="amount-md text-foreground">KSh 4,250.00</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tabular SKU</p>
              <p className="tabular font-mono text-sm">SKU-004821 · 000142</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section aria-labelledby="btn-heading" className="space-y-4">
          <h2 id="btn-heading" className="text-h3">
            Buttons
          </h2>
          <div className="card-layered space-y-6 p-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" type="button">
                Primary (48px)
              </Button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-secondary px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
              >
                Alert / void
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-accent px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                onClick={runLoading}
              >
                Pay / settle
              </button>
              <Button variant="outline" size="md" type="button">
                Outline
              </Button>
              <Button variant="primary" size="md" type="button" disabled>
                Disabled
              </Button>
              <Button variant="primary" size="md" type="button" isLoading={loadingBtn}>
                Finalize
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm" type="button">
                Small
              </Button>
              <Button variant="primary" size="md" type="button">
                Medium
              </Button>
              <Button variant="primary" size="lg" type="button">
                Large
              </Button>
            </div>
          </div>
        </section>

        {/* Forms */}
        <section aria-labelledby="form-heading" className="space-y-4">
          <h2 id="form-heading" className="text-h3">
            Forms & controls
          </h2>
          <div className="card-layered grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="cust" className="mb-1.5 block text-sm font-semibold text-muted">
                  Customer name
                </label>
                <input
                  id="cust"
                  type="text"
                  placeholder="e.g. Amina Wanjiku"
                  className="h-12 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              <div>
                <label htmlFor="amt" className="mb-1.5 block text-sm font-semibold text-muted">
                  Amount (KSh)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
                    KSh
                  </span>
                  <input
                    id="amt"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="amount h-12 w-full rounded-md border border-border bg-card py-2 pr-3 pl-12 text-sm text-foreground placeholder:text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-muted">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Optional"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              <div>
                <label htmlFor="pay" className="mb-1.5 block text-sm font-semibold text-muted">
                  Payment method
                </label>
                <select
                  id="pay"
                  value={selectVal}
                  onChange={(e) => setSelectVal(e.target.value)}
                  className="h-12 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-muted">Fulfillment</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-[var(--brand-primary)]" />
                  Print receipt
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--brand-primary)]" />
                  SMS customer
                </label>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-muted">Ticket type</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ticket" defaultChecked className="accent-[var(--brand-primary)]" />
                  Retail sale
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ticket" className="accent-[var(--brand-primary)]" />
                  Return
                </label>
              </fieldset>

              <div className="flex items-center justify-between rounded-md border border-border bg-register px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Auto-sync stock</p>
                  <p className="text-xs text-muted">Deduct on finalize</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggleOn}
                  onClick={() => setToggleOn((v) => !v)}
                  className="relative h-8 w-14 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  style={{
                    backgroundColor: toggleOn ? "var(--brand-accent)" : "var(--surface-container-high)",
                  }}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      toggleOn ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted">Field error</label>
                <input
                  type="text"
                  aria-invalid
                  defaultValue="bad@"
                  className="h-12 w-full rounded-md border border-[var(--error)] bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--error)]/30"
                />
                <p className="mt-1 text-xs text-[var(--error)]">Enter a valid phone or email.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Chips & status */}
        <section aria-labelledby="chip-heading" className="space-y-4">
          <h2 id="chip-heading" className="text-h3">
            Chips & status
          </h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-[var(--surface-container-low)] px-3 py-1 text-xs font-semibold text-foreground">
              Neutral
            </span>
            <span className="rounded-xl bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
              Matched
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
              Syncing
            </span>
            <span className="rounded-xl bg-[#fdf2f0] px-3 py-1 text-xs font-semibold text-brand-secondary dark:bg-[var(--secondary-container)]">
              Discrepancy
            </span>
            <span className="rounded-xl bg-[var(--error-container)] px-3 py-1 text-xs font-semibold text-[var(--on-error-container)]">
              Failed
            </span>
            <span className="rounded-xl border border-border px-3 py-1 text-xs font-medium text-muted">
              Draft
            </span>
          </div>
        </section>

        {/* Table */}
        <section aria-labelledby="table-heading" className="space-y-4">
          <h2 id="table-heading" className="text-h3">
            Table
          </h2>
          <div className="card-layered overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-register">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Item
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-medium">Cooking oil 2L</td>
                    <td className="tabular px-4 py-3">2</td>
                    <td className="amount px-4 py-3 text-right">KSh 1,180.00</td>
                    <td className="px-4 py-3">
                      <span className="rounded-xl bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success)]">
                        OK
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-medium">Maize flour 2kg</td>
                    <td className="tabular px-4 py-3">5</td>
                    <td className="amount px-4 py-3 text-right">KSh 1,125.00</td>
                    <td className="px-4 py-3">
                      <span className="rounded-xl bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success)]">
                        OK
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-muted">— empty row pattern</td>
                    <td className="px-4 py-3 text-muted">—</td>
                    <td className="px-4 py-3 text-right text-muted">—</td>
                    <td className="px-4 py-3 text-muted">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-register px-4 py-8 text-center text-sm text-muted">
              No open credit sales for this filter.
            </div>
          </div>
        </section>

        {/* Settlement banner + loaders */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-h3">Settlement banner</h2>
            <div className="banner-success space-y-1 p-4">
              <p className="text-sm font-semibold">M-Pesa matched</p>
              <p className="text-xs opacity-90">
                TJ7K2M9L0P · Amina W. · <span className="tabular">14:32:08</span>
              </p>
              <p className="amount-md mt-2">KSh 4,250.00</p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-h3">Loaders</h2>
            <div className="card-layered flex flex-wrap items-center gap-6 p-6">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary"
                role="status"
                aria-label="Loading"
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--surface-container-high)]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--surface-container-high)]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--surface-container-high)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Cards + actions */}
        <section className="space-y-4">
          <h2 className="text-h3">Cards & actions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-layered p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
              <p className="amount-lg mt-2">KSh 86,400</p>
              <p className="mt-1 text-xs text-muted">Net sales · 42 tickets</p>
            </div>
            <div className="card-layered p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open credit</p>
              <p className="amount-lg mt-2 text-brand-secondary">KSh 12,150</p>
              <p className="mt-1 text-xs text-muted">8 customers</p>
            </div>
            <div className="card-layered flex flex-col justify-between p-5">
              <div>
                <p className="text-sm font-semibold">Danger zone</p>
                <p className="mt-1 text-xs text-muted">Opens confirm modal</p>
              </div>
              <button
                type="button"
                className="mt-4 h-12 w-full rounded-md bg-brand-secondary text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
                onClick={() => setModalOpen(true)}
              >
                Void last line
              </button>
            </div>
          </div>
        </section>

        {/* Toast trigger */}
        <section className="card-layered flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-h4">Toast</h2>
            <p className="text-sm text-muted">Bottom-right status feedback</p>
          </div>
          <button
            type="button"
            className="h-12 rounded-md border border-border bg-card px-5 text-sm font-semibold hover:border-brand-primary"
            onClick={() => showToast("Stock received · +24 units")}
          >
            Fire toast
          </button>
        </section>
      </div>

      {/* Mobile POS sticky summary pattern */}
      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-card px-4 py-3 shadow-glow md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              <span className="tabular">3</span> items
            </p>
            <p className="amount-md">KSh 4,250.00</p>
          </div>
          <button
            type="button"
            className="h-12 flex-1 max-w-[10rem] rounded-md bg-brand-accent text-xs font-bold uppercase tracking-wider text-white"
            onClick={runLoading}
          >
            Charge
          </button>
        </div>
      </div>
    </main>
  );
}
