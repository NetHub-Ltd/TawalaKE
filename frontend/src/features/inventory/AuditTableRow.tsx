"use client";

import React, { useState, useId } from "react";
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
  onSaveSuccess: (payload: any) => Promise<void>;
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

  const onSubmit = async (data: AuditFormData) => {
    if (hasVariance && (!data.reason_code || data.notes.trim().length < 5)) {
      setStatus("error");
      setErrorMessage("Variance detected. Reason code and descriptive notes (min 5 characters) are required.");
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

  const getRowStyles = () => {
    if (status === "success" && !hasVariance) return "bg-brand-accent/5 border-brand-accent/20";
    if (hasVariance) return "bg-brand-primary/5 border-brand-primary/15";
    return "border-border/40 hover:bg-surface/40";
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`border-b transition-colors duration-200 ${getRowStyles()}`}
    >
      <div className="flex flex-col md:flex-row md:items-center px-6 py-4 gap-6">
        
        {/* Core Product Identity Block */}
        <ProductIdentity product={product} />

        {/* System Ledger Book Balance Display */}
        <div className="flex flex-col justify-center md:w-32">
          <label className="font-semibold text-xs text-muted uppercase tracking-wider md:hidden mb-1">
            Book Stock
          </label>
          <span className="font-mono font-medium text-sm text-muted bg-surface border border-border/60 px-3 py-1.5 rounded text-center w-full md:w-auto">
            {bookStock.toFixed(2)}
          </span>
        </div>

        {/* Physical Audit Stock Input Control */}
        <div className="flex flex-col justify-center md:w-36">
          <label htmlFor={quantityInputId} className="font-semibold text-xs text-muted uppercase tracking-wider md:hidden mb-1">
            Physical Count
          </label>
          <input
            id={quantityInputId}
            type="number"
            step="any"
            onFocus={(e) => e.target.select()}
            disabled={status === "saving"}
            {...register("quantity", {
              required: "Physical quantity is required",
              valueAsNumber: true,
              validate: (value) => !isNaN(value) || "Quantity must be a valid number",
              min: {
                value: 0,
                message: "Stock cannot fall below zero"
              }
            })}
            className="w-full font-mono text-sm font-semibold px-3 py-1.5 bg-card border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 disabled:bg-surface disabled:text-muted transition-all shadow-sm"
          />
          {errors.quantity && (
            <p className="text-brand-primary text-xs font-semibold mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>

        {/* Dynamic Telemetry Variance Badges */}
        <VarianceBadge variance={variance} />

        {/* Action Button Segment */}
        <div className="flex items-center justify-end md:w-28 ml-auto md:ml-0">
          {status === "saving" ? (
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          ) : (
            <button
              type="submit"
              disabled={!isDirty && status !== "error"}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${
                isDirty 
                  ? "bg-foreground text-card border-transparent hover:opacity-90 active:scale-95 cursor-pointer shadow-sm" 
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
        <AccountabilityFields 
          register={register} 
          errors={errors} 
          hasVariance={hasVariance}
          reasonSelectId={reasonSelectId}
          notesInputId={notesInputId}
        />
      )}

      {/* System Warning Message Row Area */}
      {status === "error" && errorMessage && (
        <div className="bg-brand-primary/10 border-t border-brand-primary/20 px-6 py-2.5 text-xs font-semibold text-brand-primary uppercase tracking-wide">
          {errorMessage}
        </div>
      )}
    </form>
  );
};

// =========================================================
// Sub-Component: Product Identity
// =========================================================

interface ProductIdentityProps {
  product: ProductResponse;
}

const ProductIdentity: React.FC<ProductIdentityProps> = ({ product }) => {
  return (
    <div className="flex-1 md:min-w-[250px]">
      <h4 className="font-semibold text-base text-foreground tracking-tight">{product.label}</h4>
      <p className="text-xs text-muted font-medium uppercase tracking-wider mt-1.5 flex flex-wrap items-center gap-1.5">
        <span>SKU: {product.attributes?.sku || "NO_SKU"}</span>
        <span className="text-border" aria-hidden="true">&bull;</span>
        <span>{product.category || "General"}</span>
        <span className="text-border" aria-hidden="true">&bull;</span>
        <span>{product.attributes?.unit_of_measure || "Units"}</span>
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
      <div className="flex items-center md:w-36">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Match
        </span>
      </div>
    );
  }

  const isSurplus = variance > 0;
  const trackingStyles = isSurplus
    ? "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20"
    : "text-brand-primary bg-brand-primary/10 border-brand-primary/20";

  return (
    <div className="flex items-center md:w-36">
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${trackingStyles}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        {isSurplus ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
      </span>
    </div>
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
}

const AccountabilityFields: React.FC<AccountabilityFieldsProps> = ({
  register,
  errors,
  hasVariance,
  reasonSelectId,
  notesInputId,
}) => {
  return (
    <div className="px-6 pb-5 pt-3 border-t border-dashed border-border/60 bg-surface/20 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex-1 md:max-w-xs">
        <label htmlFor={reasonSelectId} className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
          Reason Code *
        </label>
        <select
          id={reasonSelectId}
          {...register("reason_code", {
            validate: (v) => !hasVariance || v !== "" || "Please select an audit justification code."
          })}
          className="w-full text-sm font-medium px-3 py-2 bg-card border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary cursor-pointer"
        >
          <option value="">-- Choose Audit Classification --</option>
          {AUDIT_REASON_CODES.map((code) => (
            <option key={code.value} value={code.value}>
              {code.label}
            </option>
          ))}
        </select>
        {errors.reason_code && (
          <p className="text-brand-primary text-xs font-semibold mt-1">
            {errors.reason_code.message}
          </p>
        )}
      </div>

      <div className="flex-1">
        <label htmlFor={notesInputId} className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
          Accountability Notes *
        </label>
        <input
          id={notesInputId}
          type="text"
          placeholder="Provide clear operational context explaining this variance discrepancy..."
          {...register("notes", {
            validate: (v) => !hasVariance || v.trim().length >= 5 || "Descriptive notes must contain at least 5 complete characters."
          })}
          className="w-full text-sm px-3 py-2 bg-card border border-border/60 rounded text-foreground focus:outline-none focus:border-brand-primary font-medium shadow-sm placeholder:text-muted/60"
        />
        {errors.notes && (
          <p className="text-brand-primary text-xs font-semibold mt-1">
            {errors.notes.message}
          </p>
        )}
      </div>
    </div>
  );
};