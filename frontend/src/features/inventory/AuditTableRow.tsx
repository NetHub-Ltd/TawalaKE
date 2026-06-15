// src/features/inventory/AuditTableRow.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Check, AlertTriangle, Loader2, Save } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

// 1. Explicit internal type safety contract matching pure React Hook Form layout signatures
interface AuditFormData {
  quantity: number;
  reason_code: string;
  notes: string;
}

interface AuditTableRowProps {
  product: ProductResponse;
  businessId: string;
  onSaveSuccess: (payload: any) => Promise<void>;
}

export const AuditTableRow: React.FC<AuditTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const bookStock = product.stock ?? 0;

  // 2. Initialize vanilla React Hook Form without schema resolver weights
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<AuditFormData>({
    defaultValues: {
      quantity: bookStock,
      reason_code: "",
      notes: "",
    },
  });

  const currentInputQuantity = watch("quantity");
  const physicalCount = Number(currentInputQuantity) || 0;
  const variance = physicalCount - bookStock;
  const hasVariance = variance !== 0;

  // 3. Handle data delivery to downstream hooks/backend
  const onSubmit = async (data: AuditFormData) => {
    if (hasVariance && (!data.reason_code || data.notes.trim().length < 5)) {
      setStatus("error");
      setErrorMessage("Variance detected. Reason code and descriptive accountability notes (min 5 characters) are strictly compulsory.");
      return;
    }

    try {
      setStatus("saving");
      setErrorMessage("");

      const finalPayload = {
        product_id: product.id,
        business_id: businessId,
        quantity: data.quantity,
        reason_code: hasVariance ? data.reason_code : "SYSTEM_MATCH",
        notes: hasVariance 
          ? data.notes 
          : "Physical count matched system balance baseline context perfectly.",
      };

      await onSaveSuccess(finalPayload);
      
      setStatus("success");
      reset({ quantity: data.quantity, reason_code: "", notes: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to commit inventory adjustments.");
    }
  };

  // 4. Style configuration mapping exclusively to your design tokens
  const getRowStyles = () => {
    if (status === "success" && !hasVariance) return "bg-brand-accent/5 border-brand-accent/20";
    if (hasVariance) return "bg-brand-secondary/5 border-brand-secondary/20";
    return "bg-background border-border/40 hover:bg-surface/30";
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`border-b transition-colors duration-200 ${getRowStyles()}`}
    >
      <div className="flex flex-col md:flex-row md:items-center px-4 py-3 gap-4">
        
        {/* Core Product Identity Block */}
        <div className="flex-1 min-w-[250px]">
          <h4 className="font-bold text-foreground">{product.label}</h4>
          <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">
            SKU: {product.attributes?.sku || "NO_SKU"} &bull;{" "}
            <span className="opacity-80">{product.category || "General"}</span> &bull;{" "}
            {product.attributes?.unit_of_measure || "Units"}
          </p>
        </div>

        {/* System Ledger Book Balance Display */}
        <div className="w-28 flex flex-col justify-center">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest block md:hidden mb-0.5">Book Stock</span>
          <span className="text-sm font-mono font-black text-muted bg-surface border border-border/40 px-2.5 py-1 rounded w-fit">
            {bookStock.toFixed(2)}
          </span>
        </div>

        {/* Physical Audit Stock Input Control */}
        <div className="w-32">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest block md:hidden mb-1">Physical Count</span>
          <input
            type="number"
            step="any"
            onFocus={(e) => e.target.select()}
            disabled={status === "saving"}
            {...register("quantity", {
              required: "Physical quantity is required",
              valueAsNumber: true, // Native casting conversion pipeline inside RHF core logic
              validate: (value) => !isNaN(value) || "Physical quantity must be a valid numerical metric",
              min: {
                value: 0,
                message: "Physical stock cannot fall below zero boundaries"
              }
            })}
            className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 disabled:bg-surface disabled:text-muted transition-all shadow-sm"
          />
          {errors.quantity && (
            <p className="text-[11px] text-brand-secondary font-bold mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>

        {/* Dynamic Telemetry Variance Badges */}
        <div className="w-36 flex items-center">
          {variance === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Check className="w-3 h-3 stroke-[3]" /> Match
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
              variance > 0 
                ? "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20" 
                : "text-brand-primary bg-brand-primary/10 border-brand-primary/20"
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {variance > 0 ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
            </span>
          )}
        </div>

        {/* Action Button Segment */}
        <div className="w-24 flex items-center justify-end">
          {status === "saving" ? (
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          ) : (
            <button
              type="submit"
              disabled={!isDirty && status !== "error"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded border transition-all min-h-[36px] ${
                isDirty 
                  ? "bg-brand-primary text-background border-transparent hover:scale-[1.02] active:scale-100 cursor-pointer shadow-sm" 
                  : "bg-surface text-muted border-border/40 cursor-not-allowed"
              }`}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Accountability Shelf Drawer Input Layer */}
      {hasVariance && (
        <div className="px-4 pb-4 pt-2 border-t border-dashed border-border/40 bg-surface/20 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">Reason Code *</label>
            <select
              {...register("reason_code", {
                validate: (v) => !hasVariance || v !== "" || "Please select an audit justification reason code."
              })}
              className="w-full text-xs font-bold px-2 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 cursor-pointer min-h-[36px]"
            >
              <option value="">-- Choose Audit Classification --</option>
              <option value="THEFT_SHOPLIFTING">Theft or Shoplifting</option>
              <option value="DAMAGED_IN_STORE">Damaged / Broken Shelf Inventory</option>
              <option value="EXPIRED_STOCK">Expired Stock Tracking</option>
              <option value="DATA_ENTRY_ERROR">Historical Data Entry Mistake</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">Accountability Notes *</label>
            <input
              type="text"
              placeholder="Provide clear operational context explaining this variance discrepancy..."
              {...register("notes", {
                validate: (v) => !hasVariance || v.trim().length >= 5 || "Descriptive notes must contain at least 5 complete characters."
              })}
              className="w-full text-xs px-3 py-1.5 bg-background border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary/40 font-medium min-h-[36px]"
            />
          </div>
        </div>
      )}

      {/* System Warning Message Row Area */}
      {status === "error" && errorMessage && (
        <div className="bg-brand-primary/10 border-t border-brand-primary/20 px-4 py-2 text-xs font-bold text-brand-primary uppercase tracking-wide">
          {errorMessage}
        </div>
      )}
    </form>
  );
};