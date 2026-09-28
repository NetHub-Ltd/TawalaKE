"use client";

/**
 * Receipt / invoice page after a sale.
 * Actions: Print · Download PDF · Back to terminal.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react";
import {
  DocumentNotReadyError,
  useReceipt,
} from "@/features/sales/hooks/useReceipts";
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
  downloadThermalReceiptPdf,
} from "@/features/documents/components/ThermalReceipt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type DocumentViewMode = "receipt" | "invoice";

export function SaleDocumentClient({ saleId }: { saleId: string }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const organizationId = String(params?.organizationId || "");
  const routeBusinessId = params?.businessId as string | undefined;

  const { data, isLoading, error, isFetching, refetch } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;
  const [liveBranch, setLiveBranch] = useState<LiveBranch | null>(null);
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [modeOverride, setModeOverride] = useState<DocumentViewMode | null>(
    null,
  );

  const businessId =
    routeBusinessId || receipt?.seller?.business_id || undefined;
  const terminalHref =
    organizationId && businessId
      ? `/org/${organizationId}/${businessId}/terminal`
      : undefined;

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
  const balanceDue = Number(model?.balanceDue ?? 0);
  const defaultMode: DocumentViewMode =
    queryView === "invoice"
      ? "invoice"
      : queryView === "receipt"
        ? "receipt"
        : balanceDue > 0.001
          ? "invoice"
          : "receipt";
  const mode: DocumentViewMode = modeOverride ?? defaultMode;

  const goTerminal = () => {
    if (terminalHref) router.push(terminalHref);
    else router.back();
  };

  if (isLoading || (error instanceof DocumentNotReadyError && !receipt)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 py-16">
        <Spinner size="md" label="Preparing document" />
        <p className="text-sm font-medium text-foreground">
          Preparing your {defaultMode === "invoice" ? "invoice" : "receipt"}…
        </p>
        <p className="max-w-xs text-center text-xs text-muted">
          This usually takes a few seconds after payment.
          {isFetching ? " Still generating…" : ""}
        </p>
        <button
          type="button"
          onClick={goTerminal}
          className="mt-4 text-sm font-medium text-brand-primary hover:underline"
        >
          Back to terminal
        </button>
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
          Document not ready
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
            onClick={goTerminal}
            className="inline-flex h-11 items-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white"
          >
            Back to terminal
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setBusy("print");
    try {
      if (mode === "receipt") printThermalReceipt(model);
      else printFormalInvoice(model);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Print failed");
    } finally {
      setTimeout(() => setBusy(null), 400);
    }
  };

  const handleDownload = async () => {
    setBusy("pdf");
    try {
      if (mode === "receipt") {
        await downloadThermalReceiptPdf(model);
        toast.success("Receipt downloaded");
      } else {
        // Invoice: open print dialog — user can Save as PDF
        printFormalInvoice(model);
        toast.message("Use the print dialog → Save as PDF");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      {/* Actions — print:hidden */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={goTerminal}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-register"
        >
          <ArrowLeft size={16} />
          Terminal
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!!busy}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-primary px-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "print" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print {mode === "invoice" ? "invoice" : "receipt"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!!busy}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-register disabled:opacity-60"
          >
            {busy === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download {mode === "invoice" ? "invoice" : "receipt"}
          </button>
        </div>
      </div>

      {balanceDue > 0.001 && (
        <div
          className={cn(
            "print:hidden inline-flex self-start rounded-md border border-border bg-card p-0.5 text-xs",
          )}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "receipt"}
            onClick={() => setModeOverride("receipt")}
            className={cn(
              "rounded px-2.5 py-1 font-medium",
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
              "rounded px-2.5 py-1 font-medium",
              mode === "invoice"
                ? "bg-brand-primary text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            Invoice
          </button>
        </div>
      )}

      <div className="flex justify-center">
        {mode === "receipt" ? (
          <ThermalReceiptPreview model={model} />
        ) : (
          <FormalInvoicePreview model={model} />
        )}
      </div>
    </div>
  );
}


/** @deprecated Prefer SaleDocumentClient */
export const InvoiceClientView = SaleDocumentClient;
