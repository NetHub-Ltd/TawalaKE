"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/lib/components/ui/Button";

/**
 * Theme laboratory — five DESIGN.md-only variations.
 * User picks one; product restyle follows that choice.
 */

type VariantId =
  | "canonical"
  | "register-dense"
  | "command-chrome"
  | "settlement-focus"
  | "ledger-contrast";

const VARIANTS: {
  id: VariantId;
  label: string;
  short: string;
  why: string;
  bestFor: string;
}[] = [
  {
    id: "canonical",
    label: "Canonical",
    short: "Exact DESIGN.md",
    why: "Petrol command, terracotta void, mint settle, alabaster floor, border-first cards — as written.",
    bestFor: "Default product chrome if no specialization needed.",
  },
  {
    id: "register-dense",
    label: "Register Dense",
    short: "POS density",
    why: "Same palette; recessed register floor, tighter vertical rhythm, planar cards (no hover lift) for 10–15\" terminals.",
    bestFor: "Frontline POS / handheld where density and glare matter most.",
  },
  {
    id: "command-chrome",
    label: "Command Chrome",
    short: "Institutional weight",
    why: "Same palette; darker primary fills and stronger outline-variant structure for HQ nav and command bars.",
    bestFor: "Org shell, settings, multi-branch control surfaces.",
  },
  {
    id: "settlement-focus",
    label: "Settlement Focus",
    short: "Money confirmation",
    why: "Same palette; emerald edge of tertiary family emphasized for matched M-Pesa and zero-discrepancy zones.",
    bestFor: "Checkout finalize, credit collect, reconciliation.",
  },
  {
    id: "ledger-contrast",
    label: "Ledger Contrast",
    short: "Numeric trust",
    why: "Same palette; charcoal figures and quieter slate meta so KSh columns dominate the eye.",
    bestFor: "Sales history, stock movements, day-end ledgers.",
  },
];

export default function ThemeTestPage() {
  const [variant, setVariant] = useState<VariantId>("canonical");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [selectVal, setSelectVal] = useState("cash");
  const [loadingBtn, setLoadingBtn] = useState(false);

  const active = VARIANTS.find((v) => v.id === variant)!;

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
    }, 1600);
  };

  return (
    <div data-theme-variant={variant} className="min-h-screen bg-background text-foreground">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-glow"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
          <p className="text-sm font-medium">{toast}</p>
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
              Removes the line from the ticket. Stock is not adjusted until finalize.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="h-12 rounded-md border border-border px-5 text-sm font-semibold hover:bg-register"
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

      {/* Sticky variant tabs */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Design lab · DESIGN.md only
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{dark ? "Dark" : "Light"}</span>
              <button
                type="button"
                role="switch"
                aria-checked={dark}
                aria-label="Toggle dark theme"
                onClick={() => setDark((v) => !v)}
                className="relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                style={{
                  backgroundColor: dark ? "var(--brand-primary)" : "var(--surface-container-high, #e8e8e8)",
                }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    dark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Theme variants"
            className="flex gap-1 overflow-x-auto pb-0"
          >
            {VARIANTS.map((v) => {
              const selected = variant === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`tab-${v.id}`}
                  onClick={() => setVariant(v.id)}
                  className={`shrink-0 rounded-t-md border border-b-0 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    selected
                      ? "border-border bg-background text-foreground"
                      : "border-transparent bg-transparent text-muted hover:text-foreground"
                  }`}
                >
                  <span className="block text-sm font-semibold">{v.label}</span>
                  <span className="block text-[11px] opacity-80">{v.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="section-padding mx-auto max-w-6xl space-y-8 pb-28">
        {/* Variant rationale */}
        <header
          role="tabpanel"
          aria-labelledby={`tab-${variant}`}
          className="card-layered space-y-2 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-h2">{active.label}</h1>
              <p className="mt-1 text-sm text-muted">{active.why}</p>
            </div>
            <p className="max-w-xs rounded-md bg-register px-3 py-2 text-xs text-muted">
              <span className="font-semibold text-foreground">Best for: </span>
              {active.bestFor}
            </p>
          </div>
        </header>

        {/* Color roles */}
        <section aria-labelledby="colors-h" className="space-y-3">
          <h2 id="colors-h" className="text-h3">
            Color roles
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Primary", css: "var(--brand-primary)", note: "Command" },
              { name: "Secondary", css: "var(--brand-secondary)", note: "Void / alert" },
              { name: "Success", css: "var(--brand-accent)", note: "Settle" },
              { name: "Error", css: "var(--error)", note: "Blocking" },
              { name: "Border", css: "var(--border)", note: "Structure" },
              { name: "Muted", css: "var(--muted)", note: "Meta" },
            ].map((c) => (
              <div key={c.name} className="card-layered overflow-hidden">
                <div className="h-14" style={{ backgroundColor: c.css }} />
                <div className="p-2.5">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Command chrome sample (visible weight differs by variant) */}
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="theme-lab-chrome flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold tracking-wide">Tawala · Command bar</span>
            <span className="text-xs opacity-90">Primary / primary-container</span>
          </div>
          <div className="bg-card px-4 py-3 text-sm text-muted">
            Structural chrome uses primary-container weight. Compare Canonical vs Command Chrome.
          </div>
        </section>

        {/* Typography + amounts */}
        <section className="card-layered space-y-3 p-5">
          <h2 className="text-h3">Typography & money</h2>
          <p className="text-h1">Headline XL</p>
          <p className="text-h2">Headline LG — module</p>
          <p className="text-h3">Headline MD — section</p>
          <p className="text-sm text-foreground">
            Body (Inter) — operational copy and form help.
          </p>
          <p className="text-sm text-muted">Muted — timestamps, secondary help.</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-8 border-t border-border pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Amount LG</p>
              <p className="amount-lg">KSh 128,450.00</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Positive settle</p>
              <p className="amount-lg theme-lab-amount-positive">KSh 4,250.00</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">SKU</p>
              <p className="tabular font-mono text-sm">SKU-004821 · 000142</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-3">
          <h2 className="text-h3">Buttons</h2>
          <div className="card-layered space-y-4 p-5">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" type="button">
                Primary
              </Button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-secondary px-6 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary"
              >
                Void / alert
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-accent px-6 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
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
          </div>
        </section>

        {/* Forms */}
        <section className="space-y-3">
          <h2 className="text-h3">Forms & controls</h2>
          <div className="card-layered grid gap-6 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="cust" className="mb-1.5 block text-sm font-semibold text-muted">
                  Customer
                </label>
                <input
                  id="cust"
                  type="text"
                  placeholder="Amina Wanjiku"
                  className="h-12 w-full rounded-md border border-border bg-card px-3 text-sm placeholder:text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              <div>
                <label htmlFor="amt" className="mb-1.5 block text-sm font-semibold text-muted">
                  Amount
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
                    className="amount h-12 w-full rounded-md border border-border bg-card py-2 pr-3 pl-12 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pay" className="mb-1.5 block text-sm font-semibold text-muted">
                  Method
                </label>
                <select
                  id="pay"
                  value={selectVal}
                  onChange={(e) => setSelectVal(e.target.value)}
                  className="h-12 w-full rounded-md border border-border bg-card px-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-muted">Options</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--brand-primary)]" />
                  Print receipt
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="t" defaultChecked className="accent-[var(--brand-primary)]" />
                  Retail sale
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
                  className="relative h-8 w-14 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  style={{
                    backgroundColor: toggleOn ? "var(--brand-accent)" : "var(--surface-container-high, #e8e8e8)",
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
                <label className="mb-1.5 block text-sm font-semibold text-muted">Error field</label>
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

        {/* Chips */}
        <section className="space-y-3">
          <h2 className="text-h3">Chips & status</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-register px-3 py-1 text-xs font-semibold">Neutral</span>
            <span className="rounded-xl bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
              Matched
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
              Syncing
            </span>
            <span className="rounded-xl bg-[#fdf2f0] px-3 py-1 text-xs font-semibold text-brand-secondary">
              Discrepancy
            </span>
            <span className="rounded-xl bg-[var(--error-container)] px-3 py-1 text-xs font-semibold text-[var(--on-error-container)]">
              Failed
            </span>
          </div>
        </section>

        {/* Table */}
        <section className="space-y-3">
          <h2 className="text-h3">Table</h2>
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
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-register px-4 py-6 text-center text-sm text-muted">
              Empty state — no open credit for this filter.
            </div>
          </div>
        </section>

        {/* Settlement + loaders */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-h3">Settlement banner</h2>
            <div className="banner-success space-y-1 p-4">
              <p className="text-sm font-semibold">M-Pesa matched</p>
              <p className="text-xs opacity-90">
                TJ7K2M9L0P · Amina W. · <span className="tabular">14:32:08</span>
              </p>
              <p className="amount-md mt-2">KSh 4,250.00</p>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-h3">Loaders</h2>
            <div className="card-layered flex items-center gap-6 p-5">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary"
                role="status"
                aria-label="Loading"
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-register" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-register" />
              </div>
            </div>
          </div>
        </section>

        {/* KPI cards + void */}
        <section className="space-y-3">
          <h2 className="text-h3">Cards</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-layered p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Today</p>
              <p className="amount-lg mt-2">KSh 86,400</p>
              <p className="mt-1 text-xs text-muted">Net · 42 tickets</p>
            </div>
            <div className="card-layered p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open credit</p>
              <p className="amount-lg mt-2 text-brand-secondary">KSh 12,150</p>
              <p className="mt-1 text-xs text-muted">8 customers</p>
            </div>
            <div className="card-layered flex flex-col justify-between p-5">
              <div>
                <p className="text-sm font-semibold">Danger</p>
                <p className="mt-1 text-xs text-muted">Opens void modal</p>
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

        <section className="card-layered flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-h4">Toast</h2>
            <p className="text-sm text-muted">Status feedback</p>
          </div>
          <button
            type="button"
            className="h-12 rounded-md border border-border bg-card px-5 text-sm font-semibold hover:border-brand-primary"
            onClick={() => showToast("Stock received · +24 units")}
          >
            Fire toast
          </button>
        </section>

        {/* Decision helper */}
        <section className="rounded-lg border border-border bg-register p-5 text-sm">
          <h2 className="text-h4">How to choose</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
            <li>
              <span className="font-medium text-foreground">Canonical</span> — balanced default across POS + HQ.
            </li>
            <li>
              <span className="font-medium text-foreground">Register Dense</span> — if terminal density and glare are the main pain.
            </li>
            <li>
              <span className="font-medium text-foreground">Command Chrome</span> — if org/admin chrome should feel heavier than the floor.
            </li>
            <li>
              <span className="font-medium text-foreground">Settlement Focus</span> — if matched payments and day-end trust are the hero moments.
            </li>
            <li>
              <span className="font-medium text-foreground">Ledger Contrast</span> — if long numeric tables are the daily job.
            </li>
          </ul>
          <p className="mt-3 text-muted">
            Tell me the variant id (e.g. <code className="text-foreground">register-dense</code>) and I will lock
            tokens to that interpretation for product work.
          </p>
        </section>
      </main>

      {/* Mobile POS sticky */}
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
            className="h-12 max-w-[10rem] flex-1 rounded-md bg-brand-accent text-xs font-bold uppercase tracking-wider text-white"
            onClick={runLoading}
          >
            Charge
          </button>
        </div>
      </div>
    </div>
  );
}
