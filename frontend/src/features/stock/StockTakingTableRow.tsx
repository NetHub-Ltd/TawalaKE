"use client";

import React, { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save, Tags, Layers, FileText } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";
import { Button } from "@/lib/components/ui/Button";

interface StockTakingFormData {
  quantity: number;
  buying_price: number;
  selling_price: number;
  reference_id: string;
  reference_type: string;
  notes: string;
}

interface StockTakingTableRowProps {
  product: ProductResponse;
  businessId: string;
  onSaveSuccess: (payload: any) => Promise<void>;
}

export const REFERENCE_TYPES = [
  { value: "PURCHASE_ORDER", label: "Purchase Order (PO)" },
  { value: "STOCK_TAKE", label: "Initial Stock Take" },
  { value: "GOODS_RECEIVED", label: "Goods Received Note (GRN)" },
  { value: "ADJUSTMENT", label: "Manual Pricing/Count Patch" },
];

export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const quantityId = useId();
  const buyingPriceId = useId();
  const sellingPriceId = useId();
  const referenceTypeId = useId();
  const referenceId = useId();
  const notesId = useId();

  const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
  const defaultSellingPrice = product.selling_price ?? 0;
  const currentLedgerStock = product.stock ?? 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<StockTakingFormData>({
    defaultValues: {
      quantity: currentLedgerStock,
      buying_price: defaultBuyingPrice,
      selling_price: defaultSellingPrice,
      reference_id: "",
      reference_type: "PURCHASE_ORDER",
      notes: "",
    },
  });

  const onSubmit = async (data: StockTakingFormData) => {
    try {
      setStatus("saving");
      setErrorMessage("");

      const finalPayload = {
        product_id: product.id,
        business_id: businessId,
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_id: data.reference_id.trim() || undefined,
        reference_type: data.reference_type,
        notes: data.notes.trim() || "Stock ingestion session completed via terminal line ledger item.",
      };

      await onSaveSuccess(finalPayload);
      
      setStatus("success");
      reset({ 
        quantity: data.quantity, 
        buying_price: data.buying_price, 
        selling_price: data.selling_price,
        reference_id: data.reference_id,
        reference_type: data.reference_type,
        notes: "" 
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to commit stock take registration event records.");
    }
  };

  const getRowStyles = () => {
    if (status === "success") return "bg-brand-accent/5 border-brand-accent/20";
    if (status === "error") return "bg-brand-primary/5 border-brand-primary/20";
    return "bg-background border-border/40 hover:bg-surface/30";
  };

  return (
    <>
      {/* Upper Data Row */}
      <tr className={`border-b transition-colors duration-200 ${getRowStyles()}`}>
        {/* Product Specifications Column */}
        <td className="px-6 py-4 min-w-[320px]">
          <h4 className="font-bold text-foreground text-xs uppercase tracking-wide">
            {product.label}
          </h4>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
            SKU: {product.attributes?.sku || "NO_SKU"} &bull;{" "}
            <span className="opacity-80">{product.category || "General"}</span>
          </p>
        </td>

        {/* Physical Count Column */}
        <td className="px-6 py-4 w-32">
          <input
            id={quantityId}
            type="number"
            step="any"
            onFocus={(e) => e.target.select()}
            disabled={status === "saving"}
            {...register("quantity", {
              required: "Count is required",
              valueAsNumber: true,
              min: { value: 0, message: "Cannot store sub-zero volume" }
            })}
            placeholder="0.00"
            className="w-full text-xs font-mono font-bold px-3 py-2 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface transition-all shadow-sm"
          />
          {errors.quantity && (
            <p className="text-[9px] text-brand-primary font-bold mt-1">{errors.quantity.message}</p>
          )}
        </td>

        {/* Cost/Buying Price Column */}
        <td className="px-6 py-4 w-36">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-[9px] font-bold text-muted/60">KES</span>
            <input
              id={buyingPriceId}
              type="number"
              step="any"
              onFocus={(e) => e.target.select()}
              disabled={status === "saving"}
              {...register("buying_price", {
                required: "Cost required",
                valueAsNumber: true,
                min: { value: 0, message: "Invalid value" }
              })}
              className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface transition-all shadow-sm"
            />
          </div>
          {errors.buying_price && (
            <p className="text-[9px] text-brand-primary font-bold mt-1">{errors.buying_price.message}</p>
          )}
        </td>

        {/* Retail/Selling Price Column */}
        <td className="px-6 py-4 w-36">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-[9px] font-bold text-muted/60">KES</span>
            <input
              id={sellingPriceId}
              type="number"
              step="any"
              onFocus={(e) => e.target.select()}
              disabled={status === "saving"}
              {...register("selling_price", {
                required: "Selling required",
                valueAsNumber: true,
                min: { value: 0, message: "Invalid value" }
              })}
              className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface transition-all shadow-sm"
            />
          </div>
          {errors.selling_price && (
            <p className="text-[9px] text-brand-primary font-bold mt-1">{errors.selling_price.message}</p>
          )}
        </td>

        {/* Actions Button Column (Properly Aligning to Header Actions) */}
        <td className="px-6 py-4 w-32 text-right">
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            variant={isDirty ? "secondary" : "outline"}
            size="sm"
            disabled={(!isDirty && status !== "error") || status === "saving"}
            className={`w-full font-black uppercase text-[10px] tracking-wider transition-all min-h-[32px] ${
              isDirty && status !== "saving" ? "hover:scale-[1.02] active:scale-100" : ""
            }`}
          >
            {status === "saving" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Saving
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </td>
      </tr>

      {/* Auxiliary Metadata Row */}
      <tr className={`${getRowStyles()}`}>
        <td colSpan={5} className="p-0 border-b border-dashed border-border/30">
          <div className="px-6 pb-4 pt-2 bg-surface/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Document Context Selection Parameter */}
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-muted/60 shrink-0" />
              <select
                id={referenceTypeId}
                {...register("reference_type")}
                className="w-full text-[11px] font-bold bg-transparent text-foreground focus:outline-none cursor-pointer"
              >
                {REFERENCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Document Hash Token Code Input */}
            <div className="flex items-center gap-2.5">
              <Tags className="w-4 h-4 text-muted/60 shrink-0" />
              <input
                id={referenceId}
                type="text"
                placeholder="Reference code or ID string..."
                {...register("reference_id")}
                className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-mono"
              />
            </div>

            {/* Ledger Activity Supplementary Notes Field */}
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-muted/60 shrink-0" />
              <input
                id={notesId}
                type="text"
                placeholder="Add operational notes or logging metadata..."
                {...register("notes")}
                className="w-full bg-transparent text-[11px] text-foreground placeholder:text-muted/50 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* System Transaction Warnings */}
          {status === "error" && errorMessage && (
            <div className="bg-brand-primary/10 border-t border-brand-primary/20 px-6 py-2 text-[10px] font-black text-brand-primary uppercase tracking-wide">
              {errorMessage}
            </div>
          )}
        </td>
      </tr>
    </>
  );
};