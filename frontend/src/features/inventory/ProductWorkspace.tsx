"use client";

/**
 * Product workspace — single place for stock status, events, history, and metadata.
 * Theme: globals.css tokens (card, border, foreground, muted, brand-*).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Package,
  History as HistoryIcon,
  Settings2,
  Plus,
  ClipboardList,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { AssetComposer } from "@/features/inventory/AssetComposer";
import { ProductCreate } from "@/lib/api/generated/models/productCreate";
import { cn } from "@/lib/utils";

type Tab = "overview" | "history" | "settings";
type Action = "receive" | "count" | "adjust" | null;

interface MovementRow {
  id: string;
  created_at: string | null;
  movement_type: string;
  quantity: number;
  previous_stock: number | null;
  new_stock: number;
  notes: string | null;
  reason_code?: string | null;
  reference_type: string | null;
  reference_id?: string | null;
  performed_by: string | null;
  performed_by_name?: string | null;
}

interface ProductWorkspaceProps {
  businessId: string;
  productId: string;
}

export function ProductWorkspace({ businessId, productId }: ProductWorkspaceProps) {
  const { organizationId } = useBusinessContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") as Tab) || "overview";
  const actionParam = searchParams.get("action") as Action;

  const [tab, setTab] = useState<Tab>(tabParam);
  const [action, setAction] = useState<Action>(actionParam);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    product: detailProduct,
    updateProduct,
    deleteProduct,
    isLoading,
    isError,
    error,
    refresh,
  } = useProducts(businessId, productId);
  const product = detailProduct;

  const basePath = `/org/${organizationId}/${businessId}/inventory/${productId}`;
  const listPath = `/org/${organizationId}/${businessId}/inventory`;

  const syncUrl = useCallback(
    (nextTab: Tab, nextAction: Action = null) => {
      const params = new URLSearchParams();
      if (nextTab !== "overview") params.set("tab", nextTab);
      if (nextAction) params.set("action", nextAction);
      const q = params.toString();
      router.replace(q ? `${basePath}?${q}` : basePath, { scroll: false });
    },
    [basePath, router]
  );

  const selectTab = (t: Tab) => {
    setTab(t);
    setAction(null);
    setFormError(null);
    syncUrl(t, null);
  };

  const selectAction = (a: Action) => {
    setTab("overview");
    setAction(a);
    setFormError(null);
    syncUrl("overview", a);
  };

  const loadMovements = useCallback(async () => {
    setMovementsLoading(true);
    setMovementsError(null);
    try {
      const res = await fetch(
        `/api/v1/stock/movements?business_id=${businessId}&product_id=${productId}&limit=50`
      );
      const data = await res.json();
      if (!res.ok || data.status === false) {
        throw new Error(data.error || data.message || "Failed to load history");
      }
      setMovements(data.data?.items || []);
    } catch (e) {
      setMovementsError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setMovementsLoading(false);
    }
  }, [businessId, productId]);

  useEffect(() => {
    if (tab === "history" || tab === "overview") {
      void loadMovements();
    }
  }, [tab, loadMovements]);

  const onHand = product?.stock ?? 0;
  const value = useMemo(() => {
    const price = product?.selling_price ?? 0;
    return onHand * price;
  }, [onHand, product?.selling_price]);

  const handleUpdateMeta = async (values: ProductCreate): Promise<void> => {
    const safeCategory = values.category === null ? undefined : (values.category as string);
    return new Promise((resolve, reject) => {
      updateProduct.mutate(
        { id: productId, ...values, category: safeCategory },
        {
          onSuccess: () => {
            refresh();
            resolve();
          },
          onError: reject,
        }
      );
    });
  };

  async function postStock(path: string, body: Record<string, unknown>) {
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.status === false) {
        throw new Error(data.error || data.message || data.detail || "Request failed");
      }
      await refresh();
      await loadMovements();
      setSuccessMessage("Stock updated successfully.");
      setAction(null);
      syncUrl("overview", null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

    if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-brand-primary" aria-hidden />
        <p className="text-sm text-muted">Loading product…</p>
      </div>
    );
  }

  if (isError || !product) {
    const errMsg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : null;
    return (
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground"
        role="alert"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-brand-primary" />
        <span>
          {isError
            ? errMsg || "Could not load this product. Check your connection and try again."
            : "Product not found. It may have been deleted or the link is invalid."}
        </span>
        <Link
          href={listPath}
          className="ml-auto text-brand-primary underline-offset-2 hover:underline"
        >
          Back to Stock
        </Link>
      </div>
    );
  }

  const recent = movements.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-1 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={listPath}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to inventory
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {product.label}
        </h1>
        <p className="text-sm text-muted">
          View levels, run stock actions, and see history. Use Settings only for name, price, and catalogue details.
        </p>
      </header>

      <nav
        className="flex gap-1 border-b border-border"
        aria-label="Product sections"
      >
        {(
          [
            { id: "overview" as const, label: "Overview", icon: Package },
            { id: "history" as const, label: "History", icon: HistoryIcon },
            { id: "settings" as const, label: "Settings", icon: Settings2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors",
              tab === id
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {successMessage && (
        <div
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {tab === "overview" && !action && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="On hand" value={`${onHand}`} />
            <Metric label="Value (KES)" value={value.toLocaleString()} />
            <Metric label="Selling price" value={String(product.selling_price ?? "—")} />
            <Metric label="Category" value={product.category || "—"} />
            <Metric
              label="Stock status"
              value={
                !product.track_stock
                  ? "Not tracked"
                  : onHand <= 0
                    ? "Out of stock"
                    : onHand <= 10
                      ? "Low"
                      : "In stock"
              }
              tone={
                !product.track_stock
                  ? undefined
                  : onHand <= 0
                    ? "warn"
                    : onHand <= 10
                      ? "warn"
                      : "ok"
              }
            />
            <Metric
              label="Last count"
              value={
                product.last_stock_take
                  ? new Date(product.last_stock_take).toLocaleDateString()
                  : "Never"
              }
              tone={!product.last_stock_take && product.track_stock ? "warn" : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
              {movementsLoading && (
                <p className="text-sm text-muted">Loading activity…</p>
              )}
              {movementsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{movementsError}</p>
              )}
              {!movementsLoading && !movementsError && recent.length === 0 && (
                <p className="text-sm text-muted">No stock movements yet for this product.</p>
              )}
              <ul className="divide-y divide-border/60">
                {recent.map((m) => (
                  <li key={m.id} className="border-b border-border/40 py-3 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">{m.movement_type}</span>
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          m.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {m.previous_stock != null ? m.previous_stock : "—"} → {m.new_stock}
                      {" · "}
                      {m.performed_by_name || "Unknown"}
                      {" · "}
                      {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                    </p>
                    {(m.reason_code || m.notes) && (
                      <p className="mt-0.5 text-xs text-muted truncate" title={[m.reason_code, m.notes].filter(Boolean).join(" — ")}>
                        {[m.reason_code, m.notes].filter(Boolean).join(" — ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="space-y-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Quick actions</h2>
              <ActionButton
                icon={Plus}
                label="Receive stock"
                onClick={() => selectAction("receive")}
              />
              <ActionButton
                icon={ClipboardList}
                label="Count stock"
                onClick={() => selectAction("count")}
              />
              <ActionButton
                icon={SlidersHorizontal}
                label="Adjust stock"
                onClick={() => selectAction("adjust")}
              />
            </aside>
          </div>
        </div>
      )}

      {tab === "overview" && action && (
        <StockActionForm
          action={action}
          productLabel={product.label}
          onHand={onHand}
          submitting={submitting}
          error={formError}
          onCancel={() => selectAction(null)}
          onReceive={async (fields) => {
            await postStock("/api/v1/stock/receive", {
              product_id: productId,
              business_id: businessId,
              quantity: fields.quantity,
              notes: fields.notes || undefined,
              reference_type: fields.reference || "PURCHASE_ORDER",
              buying_price: fields.buyingPrice || undefined,
            });
          }}
          onCount={async (fields) => {
            await postStock("/api/v1/stock/count", {
              product_id: productId,
              business_id: businessId,
              quantity: fields.physical,
              reason_code: fields.reason || "STOCK_COUNT",
              notes: fields.notes || "Physical count from product workspace",
              reference_type: "MANUAL_AUDIT",
            });
          }}
          onAdjust={async (fields) => {
            await postStock("/api/v1/stock/adjust", {
              product_id: productId,
              business_id: businessId,
              quantity: fields.quantity,
              direction: fields.direction,
              reason_code: fields.reason || "MANUAL_ADJUSTMENT",
              notes: fields.notes || undefined,
            });
          }}
        />
      )}

      {tab === "history" && (
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">What</th>
                  <th className="px-4 py-3 text-right">Before</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">After</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movementsLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      Loading history…
                    </td>
                  </tr>
                )}
                {!movementsLoading && movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      No movements recorded yet.
                    </td>
                  </tr>
                )}
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap text-xs">
                      {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-foreground text-sm font-medium">
                      {m.movement_type}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {m.previous_stock != null ? m.previous_stock : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right font-semibold tabular-nums",
                        m.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">
                      {m.new_stock}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground max-w-[140px] truncate" title={m.reason_code || m.reference_type || ""}>
                      {m.reason_code || m.reference_type || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">
                      {m.performed_by_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted max-w-[200px] truncate text-sm" title={m.notes || ""}>
                      {m.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <div className="space-y-8 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Catalogue settings</h2>
            <p className="mt-1 text-sm text-muted">
              Name, price, category, and tracking. Stock quantity is changed with Receive, Count, or Adjust.
            </p>
          </div>
          <AssetComposer
            initialData={{
              label: product.label,
              selling_price: product.selling_price,
              stock: product.stock,
              category: product.category as ProductCreate["category"],
              attributes: (product as { attributes?: ProductCreate["attributes"] }).attributes,
            }}
            onSubmit={handleUpdateMeta}
            onCancel={() => selectTab("overview")}
            isPending={updateProduct.isPending}
          />
          <div className="border-t border-border pt-6">
            <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
              Danger zone
            </h2>
            <p className="mt-1 text-sm text-muted">
              Delete removes this product from the catalogue. Stock history is retained for records where the system keeps it.
            </p>
            <button
              type="button"
              disabled={deleteProduct.isPending}
              onClick={() => {
                const ok = window.confirm(
                  `Delete "${product.label}" permanently from this business catalogue? This cannot be undone from the app.`
                );
                if (!ok) return;
                deleteProduct.mutate(productId, {
                  onSuccess: () => {
                    router.push(listPath);
                  },
                });
              }}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60 dark:text-red-400"
            >
              {deleteProduct.isPending ? "Deleting…" : "Delete product"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums tracking-tight",
          tone === "warn" && "text-red-600 dark:text-red-400",
          tone === "ok" && "text-brand-accent",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-brand-accent/30 bg-transparent px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:border-brand-accent hover:bg-brand-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
    >
      <Icon className="h-4 w-4 text-brand-accent" aria-hidden />
      {label}
    </button>
  );
}

function StockActionForm({
  action,
  productLabel,
  onHand,
  submitting,
  error,
  onCancel,
  onReceive,
  onCount,
  onAdjust,
}: {
  action: "receive" | "count" | "adjust";
  productLabel: string;
  onHand: number;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onReceive: (f: { quantity: number; notes: string; reference: string; buyingPrice?: number }) => Promise<void>;
  onCount: (f: { physical: number; reason: string; notes: string }) => Promise<void>;
  onAdjust: (f: { quantity: number; direction: string; reason: string; notes: string }) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState("");
  const [physical, setPhysical] = useState(String(onHand));
  const [direction, setDirection] = useState<"increase" | "decrease">("decrease");
  const [reason, setReason] = useState(action === "count" ? "STOCK_COUNT" : "DAMAGED_GOODS");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");

  const change =
    action === "receive"
      ? Number(quantity) || 0
      : action === "count"
        ? (Number(physical) || 0) - onHand
        : direction === "increase"
          ? Number(quantity) || 0
          : -(Number(quantity) || 0);
  const after = onHand + change;

  const title =
    action === "receive"
      ? `Receive stock — ${productLabel}`
      : action === "count"
        ? `Count stock — ${productLabel}`
        : `Adjust stock — ${productLabel}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === "receive") {
      await onReceive({
        quantity: Number(quantity),
        notes,
        reference,
        buyingPrice: buyingPrice ? Number(buyingPrice) : undefined,
      });
    } else if (action === "count") {
      await onCount({ physical: Number(physical), reason, notes });
    } else {
      await onAdjust({ quantity: Number(quantity), direction, reason, notes });
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:grid-cols-[1fr_220px] md:p-6"
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          ← Back to overview
        </button>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>

        {action === "receive" && (
          <>
            <Field label="Quantity" required>
              <input
                type="number"
                min={0.01}
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Buying price (KES)">
              <input
                type="number"
                min={0}
                step="any"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Reference">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClass}
                placeholder="Invoice / PO"
              />
            </Field>
          </>
        )}

        {action === "count" && (
          <>
            <Field label="System count">
              <input value={onHand} readOnly className={cn(inputClass, "bg-background/80")} />
            </Field>
            <Field label="Physical count" required>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={physical}
                onChange={(e) => setPhysical(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Reason" required>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {action === "adjust" && (
          <>
            <Field label="Direction" required>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "increase" | "decrease")}
                className={inputClass}
              >
                <option value="decrease">Decrease</option>
                <option value="increase">Increase</option>
              </select>
            </Field>
            <Field label="Quantity" required>
              <input
                type="number"
                min={0.01}
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Reason" required>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(inputClass, "min-h-[80px]")}
            rows={3}
          />
        </Field>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        >
          {submitting ? "Saving…" : action === "receive" ? "Receive stock" : action === "count" ? "Save count" : "Save adjustment"}
        </button>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-background/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Summary</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Before</dt>
            <dd className="font-semibold tabular-nums text-foreground">{onHand}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Change</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                change < 0 ? "text-red-600 dark:text-red-400" : "text-brand-accent"
              )}
            >
              {change > 0 ? "+" : ""}
              {change}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="text-muted">After</dt>
            <dd className="text-lg font-bold tabular-nums text-foreground">{after}</dd>
          </div>
        </dl>
      </aside>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-brand-primary/30";
