"use client";

/**
 * Sale document hub: thermal CASH RECEIPT + formal A5/A4 INVOICE.
 * Default: receipt when paid in full; invoice when balance due (or ?view=invoice).
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, Printer, RefreshCw } from "lucide-react";
import { useReceipt } from "@/features/sales/hooks/useReceipts";
import { Spinner } from "@/lib/components/ui";
import {
  buildDocumentModel,
  type LiveBranch,
  type ReceiptData,
} from "@/features/documents/lib/documentModel";
import {
  FormalInvoicePreview,
  printFormalInvoice,
} from "@/features/documents/components/FormalInvoice";
import {
  ThermalReceiptPreview,
  printThermalReceipt,
} from "@/features/documents/components/ThermalReceipt";
import { cn } from "@/lib/utils";

export type DocumentViewMode = "receipt" | "invoice";

export function SaleDocumentClient({ saleId }: { saleId: string }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeBusinessId = params?.businessId as string | undefined;

  const { data, isLoading, error, isFetching, refetch } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;
  const [liveBranch, setLiveBranch] = useState<LiveBranch | null>(null);
  const [busy, setBusy] = useState(false);
  const [modeOverride, setModeOverride] = useState<DocumentViewMode | null>(
    null,
  );

  const businessId =
    routeBusinessId || receipt?.seller?.business_id || undefined;

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/org/stores/${businessId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setLiveBranch((body?.data || body) as LiveBranch);
      } catch {
        /* snapshot only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const model = useMemo(() => {
    if (!receipt || typeof receipt !== "object") return null;
    return buildDocumentModel(receipt, saleId, liveBranch);
  }, [receipt, saleId, liveBranch]);

  const queryView = searchParams?.get("view");
  const defaultMode: DocumentViewMode =
    queryView === "invoice"
      ? "invoice"
      : queryView === "receipt"
        ? "receipt"
        : model?.isInvoicePreferred
          ? "invoice"
          : "receipt";

  const mode: DocumentViewMode = modeOverride ?? defaultMode;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner size="md" label="Loading document" />
        <p className="text-sm text-muted">
          Loading document…
          {isFetching ? " (waiting if still generating)" : ""}
        </p>
      </div>
    );
  }

  if (error || !receipt || !model) {
    const msg =
      (error as Error)?.message ||
      "Document may still be generating. Try again in a moment.";
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">
          Could not load this document
        </p>
        <p className="mt-1 text-sm text-muted">{msg}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-register"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setBusy(true);
    try {
      if (mode === "receipt") printThermalReceipt(model);
      else printFormalInvoice(model);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Print failed");
    } finally {
      setTimeout(() => setBusy(false), 400);
    }
  };

  return (
    <div
      className={cn(
        "w-full space-y-4 print:max-w-none",
        mode === "invoice" ? "max-w-[640px]" : "max-w-[340px]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-foreground"
        >
          ← Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-md border border-border bg-card p-0.5 text-sm"
            role="tablist"
            aria-label="Document layout"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "receipt"}
              onClick={() => setModeOverride("receipt")}
              className={cn(
                "rounded px-3 py-1.5 font-medium transition-colors",
                mode === "receipt"
                  ? "bg-brand-primary text-white"
                  : "text-muted hover:text-foreground",
              )}
            >
              Receipt
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "invoice"}
              onClick={() => setModeOverride("invoice")}
              className={cn(
                "rounded px-3 py-1.5 font-medium transition-colors",
                mode === "invoice"
                  ? "bg-brand-primary text-white"
                  : "text-muted hover:text-foreground",
              )}
            >
              Invoice
            </button>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-register disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={busy}
            title="Opens print dialog — choose Save as PDF"
            className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Save PDF
          </button>
        </div>
      </div>

      <p className="text-xs text-muted print:hidden">
        {mode === "receipt"
          ? "Thermal cash receipt (~80mm) — best for the till."
          : `${model.paper} formal invoice — share, email, or print.`}
        {model.isInvoicePreferred && mode === "receipt"
          ? " This sale has a balance due; invoice layout is recommended."
          : ""}
      </p>

      {mode === "receipt" ? (
        <ThermalReceiptPreview model={model} />
      ) : (
        <FormalInvoicePreview model={model} />
      )}
    </div>
  );
}

/** Back-compat export used by older imports */
export function InvoiceClientView({ saleId }: { saleId: string }) {
  return <SaleDocumentClient saleId={saleId} />;
}
