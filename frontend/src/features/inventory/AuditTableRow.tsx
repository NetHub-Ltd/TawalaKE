"use client";

import React, { useState, useId, useCallback } from "react";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";
import { Check, AlertTriangle, Loader2, Save } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

// =========================================================
// Configuration & Domain Data Types
// =========================================================

export interface AuditFormData {
  quantity: number;
  reason_code: string;
  notes: string;
}

interface AuditTableRowProps {
  product: ProductResponse;
  businessId: string;
  onSaveSuccess: (payload: {
    product_id: string;
    business_id: string;
    quantity: number;
    reason_code: string;
    notes: string;
  }) => Promise<void>;
}

export interface AuditReasonCode {
  value: string;
  label: string;
}

export const AUDIT_REASON_CODES: AuditReasonCode[] = [
  { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
  { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
  { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
  { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
];

// =========================================================
// Core Row System Controller
// =========================================================

export const AuditTableRow: React.FC<AuditTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const quantityInputId = useId();
  const reasonSelectId = useId();
  const notesInputId = useId();
  const errorAlertId = useId();

  // Robust field resolution with fallbacks across data schema variations
  const bookStock = product.stock ?? 0;

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

  const onSubmit = useCallback(
    async (data: AuditFormData) => {
      if (hasVariance && (!data.reason_code || data.notes.trim().length < 5)) {
        setStatus("error");
        setErrorMessage(
          "Variance detected. Reason code and descriptive notes (min 5 characters) are required."
        );
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
      } catch (err: unknown) {
        setStatus("error");
        const message =
          err instanceof Error
            ? err.message
            : "Failed to commit inventory adjustments.";
        setErrorMessage(message);
      }
    },
    [businessId, hasVariance, onSaveSuccess, product.id, reset]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const getRowStyles = () => {
    if (status === "success" && !hasVariance) return "bg-emerald-500/5 border-emerald-500/20";
    if (hasVariance) return "bg-amber-500/5 border-amber-500/20";
    return "border-border/40 hover:bg-surface/40";
  };

  return (
    <>
      {/* Main Table Row */}
      <tr className={`border-b transition-colors duration-200 ${getRowStyles()}`}>
        {/* Core Product Identity Block */}
        <td className="px-6 py-4 align-middle">
          <ProductIdentity product={product} />
        </td>

        {/* System Ledger Book Balance Display */}
        <td className="px-4 py-4 align-middle">
          <div className="flex flex-col justify-center">
            <span className="font-mono font-medium text-xs text-muted bg-surface/80 border border-border/60 px-3 py-2 rounded-lg text-center w-full min-h-[44px] flex items-center justify-center">
              {bookStock.toFixed(2)}
            </span>
          </div>
        </td>

        {/* Physical Audit Stock Input Control */}
        <td className="px-4 py-4 align-middle">
          <div className="flex flex-col justify-center">
            <input
              id={quantityInputId}
              type="number"
              step="any"
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              disabled={status === "saving"}
              aria-invalid={!!errors.quantity}
              aria-label={`Physical count for ${product.label || "item"}`}
              {...register("quantity", {
                required: "Physical quantity is required",
                valueAsNumber: true,
                validate: (value) => !isNaN(value) || "Quantity must be a valid number",
                min: {
                  value: 0,
                  message: "Stock cannot fall below zero",
                },
              })}
              className="w-full font-mono text-xs font-semibold px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-surface disabled:text-muted transition-all shadow-sm"
            />
            {errors.quantity && (
              <p className="text-brand-primary text-[10px] font-bold mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        </td>

        {/* Dynamic Telemetry Variance Badges */}
        <td className="px-4 py-4 align-middle">
          <VarianceBadge variance={variance} />
        </td>

        {/* Action Button Segment */}
        <td className="px-6 py-4 align-middle text-right">
          <div className="flex items-center justify-end">
            {status === "saving" ? (
              <div className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty && status !== "error"}
                aria-label={`Save stock count for ${product.label || "item"}`}
                className={`min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                  isDirty
                    ? "bg-foreground text-card border-transparent hover:opacity-90 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    : "bg-surface/50 text-muted border-border/40 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" /> Save
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Accountability Drawer Row (Triggered on Variance) */}
      {hasVariance && (
        <tr className="bg-surface/30 border-b border-border/40">
          <td colSpan={5} className="px-6 py-4">
            <AccountabilityFields
              register={register}
              errors={errors}
              hasVariance={hasVariance}
              reasonSelectId={reasonSelectId}
              notesInputId={notesInputId}
              onKeyDown={handleKeyDown}
              isSaving={status === "saving"}
            />
          </td>
        </tr>
      )}

      {/* System Warning Message Row Area */}
      {status === "error" && errorMessage && (
        <tr id={errorAlertId} className="bg-brand-primary/10 border-b border-brand-primary/20">
          <td colSpan={5} className="px-6 py-2.5">
            <p className="text-xs font-bold text-brand-primary uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          </td>
        </tr>
      )}
    </>
  );
};

// =========================================================
// Sub-Component: Product Identity
// =========================================================

interface ProductIdentityProps {
  product: ProductResponse;
}

const ProductIdentity: React.FC<ProductIdentityProps> = ({ product }) => {
  const name = product.label || "Unnamed Product";
  const sku = product.attributes?.sku || "NO_SKU";
  const category = product.category || "General";
  const uom = product.attributes?.unit_of_measure || "Units";

  return (
    <div className="flex flex-col">
      <h4 className="font-semibold text-xs text-foreground tracking-tight line-clamp-1">{name}</h4>
      <p className="text-[10px] text-muted font-medium uppercase tracking-wider mt-1 flex flex-wrap items-center gap-1.5">
        <span className="font-mono font-bold">SKU: {sku}</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>{category}</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>{uom}</span>
      </p>
    </div>
  );
};

// =========================================================
// Sub-Component: Variance Badge
// =========================================================

interface VarianceBadgeProps {
  variance: number;
}

const VarianceBadge: React.FC<VarianceBadgeProps> = ({ variance }) => {
  if (variance === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Match
      </span>
    );
  }

  const isSurplus = variance > 0;
  const trackingStyles = isSurplus
    ? "text-blue-600 bg-blue-500/10 border-blue-500/20"
    : "text-rose-600 bg-rose-500/10 border-rose-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${trackingStyles}`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {isSurplus ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
    </span>
  );
};

// =========================================================
// Sub-Component: Accountability Fields
// =========================================================

interface AccountabilityFieldsProps {
  register: UseFormRegister<AuditFormData>;
  errors: FieldErrors<AuditFormData>;
  hasVariance: boolean;
  reasonSelectId: string;
  notesInputId: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
}

const AccountabilityFields: React.FC<AccountabilityFieldsProps> = ({
  register,
  errors,
  hasVariance,
  reasonSelectId,
  notesInputId,
  onKeyDown,
  isSaving,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Reason Select */}
      <div className="flex-1 md:max-w-xs">
        <label
          htmlFor={reasonSelectId}
          className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider"
        >
          Reason Code *
        </label>
        <select
          id={reasonSelectId}
          disabled={isSaving}
          aria-invalid={!!errors.reason_code}
          {...register("reason_code", {
            validate: (v) =>
              !hasVariance || v !== "" || "Please select an audit justification code.",
          })}
          className="w-full text-xs font-medium px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer disabled:opacity-50"
        >
          <option value="">-- Choose Audit Classification --</option>
          {AUDIT_REASON_CODES.map((code) => (
            <option key={code.value} value={code.value}>
              {code.label}
            </option>
          ))}
        </select>
        {errors.reason_code && (
          <p className="text-brand-primary text-[10px] font-bold mt-1">
            {errors.reason_code.message}
          </p>
        )}
      </div>

      {/* Notes Input */}
      <div className="flex-1">
        <label
          htmlFor={notesInputId}
          className="block text-[10px] font-bold text-muted mb-1 uppercase tracking-wider"
        >
          Accountability Notes *
        </label>
        <input
          id={notesInputId}
          type="text"
          disabled={isSaving}
          onKeyDown={onKeyDown}
          placeholder="Provide operational context explaining this variance discrepancy..."
          aria-invalid={!!errors.notes}
          {...register("notes", {
            validate: (v) =>
              !hasVariance ||
              v.trim().length >= 5 ||
              "Descriptive notes must contain at least 5 complete characters.",
          })}
          className="w-full text-xs px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium shadow-sm placeholder:text-muted/60 disabled:opacity-50"
        />
        {errors.notes && (
          <p className="text-brand-primary text-[10px] font-bold mt-1">
            {errors.notes.message}
          </p>
        )}
      </div>
    </div>
  );
};