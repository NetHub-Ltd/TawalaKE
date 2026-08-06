"use client";

import React, { useState, useId, useCallback, useMemo } from "react";
import { useForm, UseFormRegister, FieldErrors, SubmitHandler } from "react-hook-form";
import {
  Check,
  AlertTriangle,
  Loader2,
  Save,
  CalendarCheck,
  CalendarX,
  Clock,
  ShieldOff,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Import generated API entity directly to prevent type structural mismatches (TS2322)
import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

// =========================================================
// Class Name Merging Utility
// =========================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// =========================================================
// Domain Data Contracts & Types
// =========================================================

/** RHF Internal Form Values */
export interface AuditFormData {
  quantity: number;
  reason_code: string;
  notes: string;
}

/** Payload submitted upon stock take persistence */
export interface AuditSavePayload {
  product_id: string;
  business_id: string;
  quantity: number;
  reason_code: string;
  notes: string;
}

export interface AuditReasonCode {
  value: string;
  label: string;
}

export const AUDIT_REASON_CODES: ReadonlyArray<AuditReasonCode> = [
  { value: "THEFT_SHOPLIFTING", label: "Theft or Shoplifting" },
  { value: "DAMAGED_IN_STORE", label: "Damaged / Broken Shelf Inventory" },
  { value: "EXPIRED_STOCK", label: "Expired Stock Tracking" },
  { value: "DATA_ENTRY_ERROR", label: "Historical Data Entry Mistake" },
] as const;

// =========================================================
// Status Telemetry Helpers
// =========================================================

export type AuditAlertState = "untracked" | "green" | "amber" | "red";

export function getAuditAlertState(
  trackStock: boolean,
  lastStockTake?: string | Date | null
): AuditAlertState {
  if (!trackStock) return "untracked";
  if (!lastStockTake) return "red";

  const auditDate =
    typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;

  if (isNaN(auditDate.getTime())) return "red";

  const now = new Date();
  const isSameMonthAndYear =
    auditDate.getFullYear() === now.getFullYear() &&
    auditDate.getMonth() === now.getMonth();

  return isSameMonthAndYear ? "green" : "amber";
}

export function formatAuditDate(lastStockTake?: string | Date | null): string {
  if (!lastStockTake) return "N/A";
  const dateObj =
    typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;
  if (isNaN(dateObj.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

// =========================================================
// Public Component API Interface
// =========================================================

export interface AuditTableRowProps {
  /** Generated backend Product entity */
  product: ProductResponse;
  /** Unique tenant business identifier */
  businessId: string;
  /** Callback fired upon audit resolution */
  onSaveSuccess: (payload: AuditSavePayload) => Promise<void>;
  /** Optional container class overrides */
  className?: string;
}

// =========================================================
// Core Component: AuditTableRow
// =========================================================

export const AuditTableRow: React.FC<AuditTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
  className,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const quantityInputId = useId();
  const reasonSelectId = useId();
  const notesInputId = useId();
  const errorAlertId = useId();

  const bookStock = product.stock ?? 0;
  const trackStock = Boolean(product.track_stock);

  const alertState = useMemo(
    () => getAuditAlertState(trackStock, product.last_stock_take),
    [trackStock, product.last_stock_take]
  );

  const leftBorderClass = useMemo(() => {
    switch (alertState) {
      case "green":
        return "border-l-6 border-l-green-500";
      case "amber":
        return "border-l-6 border-l-amber-500";
      case "red":
        return "border-l-6 border-l-red-500";
      case "untracked":
      default:
        return "border-l-6 border-l-slate-400 dark:border-l-slate-600";
    }
  }, [alertState]);

  // Pure React Hook Form initialization without zodResolver
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

  const watchedQuantity = watch("quantity");
  const currentQty = typeof watchedQuantity === "number" && !isNaN(watchedQuantity) ? watchedQuantity : bookStock;
  const variance = currentQty - bookStock;
  const isVariancePresent = trackStock && variance !== 0;

  const onSubmit: SubmitHandler<AuditFormData> = useCallback(
    async (data) => {
      try {
        setStatus("saving");
        setErrorMessage("");

        const finalPayload: AuditSavePayload = {
          product_id: product.id,
          business_id: businessId,
          quantity: data.quantity,
          reason_code: isVariancePresent ? data.reason_code : "SYSTEM_MATCH",
          notes: isVariancePresent
            ? data.notes
            : "Physical count matched ledger stock balance.",
        };

        await onSaveSuccess(finalPayload);

        setStatus("success");
        reset({ quantity: data.quantity, reason_code: "", notes: "" });
      } catch (err: unknown) {
        setStatus("error");
        const message =
          err instanceof Error
            ? err.message
            : "Failed to persist inventory count adjustment.";
        setErrorMessage(message);
      }
    },
    [businessId, isVariancePresent, onSaveSuccess, product.id, reset]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const getRowStyles = () => {
    if (status === "success" && !isVariancePresent)
      return "bg-green-500/5 border-green-500/20";
    if (isVariancePresent) return "bg-amber-500/5 border-amber-500/20";
    return "border-border/40 hover:bg-surface/40";
  };

  return (
    <>
      <tr className={cn("border-b transition-colors duration-200", getRowStyles(), className)}>
        {/* Product Details Block */}
        <td className={cn("px-6 py-4 align-middle", leftBorderClass)}>
          <ProductIdentity product={product} alertState={alertState} />
        </td>

        {/* System Ledger Stock Display */}
        <td className="px-4 py-4 align-middle">
          <div className="flex flex-col justify-center">
            <span className="font-mono font-medium text-xs text-muted bg-surface/80 border border-border/60 px-3 py-2 rounded-lg text-center w-full min-h-[44px] flex items-center justify-center">
              {bookStock.toFixed(2)}
            </span>
          </div>
        </td>

        {/* Physical Stock Count Input with RHF Internal Rules */}
        <td className="px-4 py-4 align-middle">
          <div className="flex flex-col justify-center">
            <input
              id={quantityInputId}
              type="number"
              step="any"
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              disabled={status === "saving" || !trackStock}
              aria-invalid={!!errors.quantity}
              aria-describedby={errors.quantity ? `${quantityInputId}-error` : undefined}
              aria-label={`Physical count for ${product.label ?? "Product"}`}
              {...register("quantity", {
                required: "Physical quantity is required",
                valueAsNumber: true,
                validate: (val) =>
                  (!isNaN(val) && val >= 0) || "Stock quantity cannot fall below zero",
              })}
              className={cn(
                "w-full font-mono text-xs font-semibold px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-surface disabled:text-muted transition-all shadow-sm",
                !trackStock && "cursor-not-allowed opacity-60"
              )}
            />
            {errors.quantity && (
              <p id={`${quantityInputId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>
        </td>

        {/* Variance Telemetry Badges */}
        <td className="px-4 py-4 align-middle">
          <VarianceBadge variance={variance} trackStock={trackStock} />
        </td>

        {/* Actions Segment */}
        <td className="px-6 py-4 align-middle text-right">
          <div className="flex items-center justify-end">
            {status === "saving" ? (
              <div className="min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Saving count">
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={(!isDirty && status !== "error") || !trackStock}
                aria-label={`Save stock count for ${product.label ?? "Product"}`}
                className={cn(
                  "min-h-[44px] min-w-[44px] px-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all",
                  isDirty && trackStock
                    ? "bg-foreground text-card border-transparent hover:opacity-90 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    : "bg-surface/50 text-muted border-border/40 cursor-not-allowed"
                )}
              >
                <Save className="w-4 h-4" /> Save
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Accountability Drawer Row */}
      {isVariancePresent && (
        <tr className="bg-surface/30 border-b border-border/40">
          <td colSpan={5} className={cn("px-6 py-4", leftBorderClass)}>
            <AccountabilityFields
              register={register}
              errors={errors}
              reasonSelectId={reasonSelectId}
              notesInputId={notesInputId}
              onKeyDown={handleKeyDown}
              isSaving={status === "saving"}
              isVariancePresent={isVariancePresent}
              trackStock={trackStock}
            />
          </td>
        </tr>
      )}

      {/* Error Alert Banner */}
      {status === "error" && errorMessage && (
        <tr id={errorAlertId} role="alert" aria-live="polite" className="bg-red-500/10 border-b border-red-500/20">
          <td colSpan={5} className={cn("px-6 py-2.5", leftBorderClass)}>
            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-2">
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
  alertState: AuditAlertState;
}

const ProductIdentity: React.FC<ProductIdentityProps> = ({ product, alertState }) => {
  const name = product.label ?? "Unnamed Product";
  const category = product.category ?? "General";
  const uom = product.attributes?.unit_of_measure ?? "Units";
  const formattedDate = formatAuditDate(product.last_stock_take);

  const alertBadge = useMemo(() => {
    switch (alertState) {
      case "green":
        return {
          label: "Audited This Month",
          color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
          icon: <CalendarCheck className="w-3 h-3 stroke-[2.5]" />,
        };
      case "amber":
        return {
          label: "Audit Due (>1 Mo)",
          color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          icon: <Clock className="w-3 h-3 stroke-[2.5]" />,
        };
      case "red":
        return {
          label: "Never Audited / Overdue",
          color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
          icon: <CalendarX className="w-3 h-3 stroke-[2.5]" />,
        };
      case "untracked":
      default:
        return {
          label: "Stock Untracked",
          color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
          icon: <ShieldOff className="w-3 h-3 stroke-[2.5]" />,
        };
    }
  }, [alertState]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <h4 className="font-semibold text-xs text-foreground tracking-tight line-clamp-1">
          {name}
        </h4>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
            alertBadge.color
          )}
          title={`Status: ${alertBadge.label}`}
        >
          {alertBadge.icon}
          <span>{alertBadge.label}</span>
        </span>
      </div>

      <p className="text-[10px] text-muted font-medium uppercase tracking-wider flex flex-wrap items-center gap-1.5">
        <span>{category}</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span>{uom}</span>
        <span className="text-border" aria-hidden="true">
          &bull;
        </span>
        <span className="font-mono">Last Audited: {formattedDate}</span>
      </p>
    </div>
  );
};

// =========================================================
// Sub-Component: Variance Badge
// =========================================================

interface VarianceBadgeProps {
  variance: number;
  trackStock: boolean;
}

const VarianceBadge: React.FC<VarianceBadgeProps> = ({ variance, trackStock }) => {
  if (!trackStock) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
        <ShieldOff className="w-3.5 h-3.5" /> N/A (Untracked)
      </span>
    );
  }

  if (variance === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Match
      </span>
    );
  }

  const isSurplus = variance > 0;
  const trackingStyles = isSurplus
    ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
    : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider",
        trackingStyles
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {isSurplus ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
    </span>
  );
};

// =========================================================
// Sub-Component: Accountability Fields (Pure RHF Rules)
// =========================================================

interface AccountabilityFieldsProps {
  register: UseFormRegister<AuditFormData>;
  errors: FieldErrors<AuditFormData>;
  reasonSelectId: string;
  notesInputId: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSaving: boolean;
  isVariancePresent: boolean;
  trackStock: boolean;
}

const AccountabilityFields: React.FC<AccountabilityFieldsProps> = ({
  register,
  errors,
  reasonSelectId,
  notesInputId,
  onKeyDown,
  isSaving,
  isVariancePresent,
  trackStock,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
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
          aria-describedby={errors.reason_code ? `${reasonSelectId}-error` : undefined}
          {...register("reason_code", {
            validate: (value) => {
              if (trackStock && isVariancePresent && (!value || value.trim() === "")) {
                return "Please select an audit justification code.";
              }
              return true;
            },
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
          <p id={`${reasonSelectId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
            {errors.reason_code.message}
          </p>
        )}
      </div>

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
          aria-describedby={errors.notes ? `${notesInputId}-error` : undefined}
          {...register("notes", {
            validate: (value) => {
              if (trackStock && isVariancePresent && (!value || value.trim().length < 5)) {
                return "Descriptive notes must contain at least 5 characters.";
              }
              return true;
            },
          })}
          className="w-full text-xs px-3 py-2 min-h-[44px] bg-card border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium shadow-sm placeholder:text-muted/60 disabled:opacity-50"
        />
        {errors.notes && (
          <p id={`${notesInputId}-error`} role="alert" className="text-red-500 text-[10px] font-bold mt-1">
            {errors.notes.message}
          </p>
        )}
      </div>
    </div>
  );
};