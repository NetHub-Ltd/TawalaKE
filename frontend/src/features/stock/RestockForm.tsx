"use client";

/**
 * Restock — plain shop language; canonical tokens + UI kit.
 */
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Input, Label, Select, Textarea } from "@/lib/components/ui";

interface ProductContext {
  id: string;
  label: string;
  currentStock: number;
}

export default function RestockForm({ product }: { product: ProductContext }) {
  const [isPending, startTransition] = useTransition();
  const [qty, setQty] = useState<number | "">("");
  const [unitCost, setUnitCost] = useState<number | "">("");
  const [reasonCode, setReasonCode] = useState<string>("SUPPLIER_DELIVERY");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty === "" || Number(qty) <= 0) {
      alert("Enter how many units you received.");
      return;
    }

    const payload = {
      product_id: product.id,
      movement_type: "RESTOCK",
      quantity: Number(qty),
      buying_price: unitCost === "" ? null : Number(unitCost),
      reason_code: reasonCode,
      notes: notes || null,
    };

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log("[restock] payload", JSON.stringify(payload, null, 2));
      alert(`Added ${qty} units to ${product.label}.`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-md border border-border bg-card p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">
            Current system qty
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular text-foreground">
            {product.currentStock}{" "}
            <span className="text-sm font-medium text-muted">units</span>
          </p>
          <p className="mt-1 text-sm text-muted">{product.label}</p>
        </div>

        <div>
          <Label htmlFor="restock_qty">Units received</Label>
          <Input
            id="restock_qty"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => {
              const v = e.target.value;
              setQty(v === "" ? "" : Number(v));
            }}
            placeholder="How many units came in"
            required
          />
        </div>

        <div>
          <Label htmlFor="unit_cost">Unit cost (optional)</Label>
          <Input
            id="unit_cost"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            currency
            value={unitCost}
            onChange={(e) => {
              const v = e.target.value;
              setUnitCost(v === "" ? "" : Number(v));
            }}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Select
            id="reason"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
          >
            <option value="SUPPLIER_DELIVERY">Supplier delivery</option>
            <option value="RETURN_TO_SHELF">Customer return to shelf</option>
            <option value="TRANSFER_IN">Transfer from another branch</option>
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
            placeholder="Supplier name, invoice number, etc."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="success" disabled={isPending || qty === ""}>
          {isPending ? "Saving…" : "Add stock"}
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
