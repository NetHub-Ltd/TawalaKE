"use client";

/**
 * Stock count (audit) — shop language only.
 * System qty → Counted qty → Difference → Why?
 */
import React, { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, Input, Label, Select, Textarea } from "@/lib/components/ui";

interface ProductContext {
  id: string;
  label: string;
  currentStock: number;
}

export default function AuditForm({ product }: { product: ProductContext }) {
  const [isPending, startTransition] = useTransition();
  const [countedQty, setCountedQty] = useState<number | "">("");
  const [reasonCode, setReasonCode] = useState<string>("DATA_ENTRY_ERROR");
  const [notes, setNotes] = useState<string>("");

  const difference =
    countedQty !== "" ? Number(countedQty) - product.currentStock : 0;
  const hasDifference = countedQty !== "" && difference !== 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (countedQty === "") {
      alert("Enter the counted quantity.");
      return;
    }

    const payload = {
      business_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      performed_by: "ca7b3a11-8231-4a1e-8133-72bb9443216c",
      items: [
        {
          product_id: product.id,
          movement_type: "RECONCILIATION",
          quantity: Number(difference),
          buying_price: null,
          selling_price: null,
          reference_type: "MANUAL_AUDIT",
          reference_id: null,
          reason_code: reasonCode,
          notes: notes || null,
        },
      ],
    };

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log(
        "[stock count] POST /api/v1/inventory/transactions",
        JSON.stringify(payload, null, 2)
      );
      alert(
        difference === 0
          ? "Count saved. System qty matches what you counted."
          : `Count saved. System qty adjusted by ${difference > 0 ? "+" : ""}${difference} units.`
      );
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-md border border-border bg-card p-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted">
              System qty
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular text-foreground">
              {product.currentStock}{" "}
              <span className="text-sm font-medium text-muted">units</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              What Tawala currently shows for {product.label}
            </p>
          </div>

          <div>
            <Label htmlFor="counted_qty">Counted qty</Label>
            <Input
              id="counted_qty"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={countedQty}
              onChange={(e) => {
                const v = e.target.value;
                setCountedQty(v === "" ? "" : Number(v));
              }}
              placeholder="What you counted on the shelf"
              required
            />
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col justify-between rounded-md border p-6",
            countedQty === ""
              ? "border-border bg-register"
              : difference === 0
                ? "border-[var(--success-border)] bg-[var(--success-soft)]"
                : "border-brand-secondary/30 bg-[#fdf2f0]"
          )}
        >
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted">
              Difference
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-2xl font-semibold tabular",
                countedQty === ""
                  ? "text-muted"
                  : difference === 0
                    ? "text-[var(--success)]"
                    : "text-brand-secondary"
              )}
            >
              {countedQty === ""
                ? "—"
                : `${difference > 0 ? "+" : ""}${difference}`}
            </p>
            <p className="mt-1 text-xs text-muted">
              Counted qty minus system qty
            </p>
          </div>
          {hasDifference && (
            <p className="mt-4 flex items-start gap-2 text-sm text-brand-secondary">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              A reason is required when the numbers do not match.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-md border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Why?</h3>
        <p className="text-xs text-muted">
          Optional if counts match. Required when there is a difference.
        </p>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Select
            id="reason"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            required={hasDifference}
          >
            <option value="DATA_ENTRY_ERROR">Data entry error</option>
            <option value="THEFT_LOSS">Theft or loss</option>
            <option value="DAMAGE">Damaged goods</option>
            <option value="UNRECORDED_SALE">Sale not recorded</option>
            <option value="FOUND_STOCK">Found extra stock</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything useful for the next person checking stock"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending || countedQty === ""}>
          {isPending ? "Saving…" : "Save count"}
        </Button>
        <Link
          href=".."
          className="inline-flex h-12 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted hover:bg-register hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
