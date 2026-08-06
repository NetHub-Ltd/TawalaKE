"use client";

import React, { useState, useId, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  Clock,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductResponse } from "@/lib/api/generated/models/productResponse";

// =========================================================
// Utility: Class Name Merging
// =========================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// =========================================================
// Zod Validation Schema
// =========================================================

export const stockTakingFormSchema = z.object({
  quantity: z
    .number({
      message: "Physical count must be a valid number",
    })
    .min(0, "Physical count cannot be negative"),
  buying_price: z
    .number({
      message: "Cost price must be a valid number",
    })
    .min(0, "Cost price cannot be negative"),
  selling_price: z
    .number({
      message: "Selling price must be a valid number",
    })
    .min(0, "Selling price cannot be negative"),
  reference_type: z.string().min(1, "Reference type is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters"),
});

export type StockTakingFormData = z.infer<typeof stockTakingFormSchema>;

// =========================================================
// Types & Domain Interfaces
// =========================================================

export type MonthlyAuditState = "current-month" | "previous-month" | "never";

export interface StockTakingSavePayload {
  product_id: string;
  business_id: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  reference_type: string;
  notes: string;
}

export interface StockTakingTableRowProps {
  /** Product data entity */
  product: ProductResponse;
  /** Active business account identifier */
  businessId: string;
  /** Async handler called when submitting new stock record */
  onSaveSuccess: (payload: StockTakingSavePayload) => Promise<void>;
  /** Optional custom class for the row */
  className?: string;
}

export const REFERENCE_GROUPS = [
  {
    group: "Inventory Audits",
    options: [
      { value: "INITIAL_STOCK_TAKE", label: "Initial Inventory Audit" },
      { value: "ROUTINE_COUNT", label: "Routine Cycle Count" },
    ],
  },
  {
    group: "Inbound Stock",
    options: [
      { value: "PURCHASE_ORDER", label: "Supplier Purchase Order (PO)" },
      { value: "GOODS_RECEIVED", label: "Goods Received Note (GRN)" },
      { value: "CUSTOMER_RETURN", label: "Customer Return / Restock" },
    ],
  },
  {
    group: "Adjustments & Write-Offs",
    options: [
      { value: "COUNT_CORRECTION", label: "Manual Variance Correction" },
      { value: "DAMAGE_EXPIRE", label: "Damaged / Expired Stock" },
      { value: "INTERNAL_USE", label: "Internal Store Consumption" },
    ],
  },
] as const;

// =========================================================
// Helper: Audit Recency Calculator
// =========================================================

export function getMonthlyAuditState(
  lastStockTake?: string | Date | null
): MonthlyAuditState {
  if (!lastStockTake) {
    return "never";
  }

  const auditDate =
    typeof lastStockTake === "string" ? new Date(lastStockTake) : lastStockTake;

  if (!(auditDate instanceof Date) || isNaN(auditDate.getTime())) {
    return "never";
  }

  const now = new Date();
  const isSameMonthAndYear =
    auditDate.getFullYear() === now.getFullYear() &&
    auditDate.getMonth() === now.getMonth();

  return isSameMonthAndYear ? "current-month" : "previous-month";
}

// =========================================================
// Main Component
// =========================================================

export const StockTakingTableRow: React.FC<StockTakingTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const quantityId = useId();
  const buyingPriceId = useId();
  const sellingPriceId = useId();
  const referenceTypeId = useId();
  const notesId = useId();

  const defaultBuyingPrice = product.attributes?.buying_price ?? 0;
  const defaultSellingPrice = product.selling_price ?? 0;
  const currentLedgerStock = product.stock ?? 0;
  const sku = product.attributes?.sku || "NO_SKU";

  const auditState = useMemo(
    () => getMonthlyAuditState(product.last_stock_take),
    [product.last_stock_take]
  );

  const leftBorderClass = useMemo(() => {
    switch (auditState) {
      case "current-month":
        return "border-l-8 border-l-brand-accent";
      case "previous-month":
        return "border-l-8 border-l-amber-500";
      case "never":
      default:
        return "border-l-8 border-l-slate-400 dark:border-l-slate-600";
    }
  }, [auditState]);

  const auditBadge = useMemo(() => {
    switch (auditState) {
      case "current-month":
        return {
          label: "Audited This Month",
          color:
            "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          icon: (
            <CalendarCheck
              className="w-3 h-3 stroke-[2.5]"
              aria-hidden="true"
            />
          ),
        };
      case "previous-month":
        return {
          label: "Audit Due (>1 Mo)",
          color:
            "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
          icon: <Clock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
        };
      case "never":
      default:
        return {
          label: "Never Audited",
          color:
            "text-slate-700 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
          icon: (
            <CalendarX className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
          ),
        };
    }
  }, [auditState]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<StockTakingFormData>({
    resolver: zodResolver(stockTakingFormSchema),
    defaultValues: {
      quantity: currentLedgerStock,
      buying_price: defaultBuyingPrice,
      selling_price: defaultSellingPrice,
      reference_type: "INITIAL_STOCK_TAKE",
      notes: "",
    },
  });

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const onSubmit = async (data: StockTakingFormData) => {
    try {
      setStatus("saving");
      setErrorMessage("");

      const payload: StockTakingSavePayload = {
        product_id: product.id,
        business_id: businessId,
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_type: data.reference_type,
        notes: data.notes?.trim() || "New stock recorded.",
      };

      await onSaveSuccess(payload);

      setStatus("success");
      reset({
        quantity: data.quantity,
        buying_price: data.buying_price,
        selling_price: data.selling_price,
        reference_type: data.reference_type,
        notes: "",
      });
      setIsExpanded(false);
    } catch (err: unknown) {
      setStatus("error");
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to record new stock data.";
      setErrorMessage(msg);
    }
  };

  // Reusable, distinguished form input styling
  const inputBaseStyle =
    "w-full rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-xs font-bold text-foreground shadow-xs transition-all duration-150 placeholder:text-muted-foreground/50 hover:border-border/100 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-background disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      {/* Primary Summary Row */}
      <tr
        onClick={toggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpand();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Toggle new stock form for ${product.label}`}
        className={cn(
          "border-b border-border/60 bg-card hover:bg-muted/20 cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1",
          isExpanded && "bg-muted/20 border-b-transparent",
          className
        )}
      >
        <td colSpan={2} className={cn("px-6 py-4", leftBorderClass)}>
          <div className="flex items-center gap-3">
            <div
              className="p-1 rounded-md bg-muted/10 text-muted-foreground shrink-0 transition-transform duration-200"
              aria-hidden="true"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-brand-primary" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                  {product.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 shadow-2xs",
                    auditBadge.color
                  )}
                  title={`Audit Status: ${auditBadge.label}`}
                >
                  {auditBadge.icon}
                  <span>{auditBadge.label}</span>
                </span>
              </div>
              <p className="text-[10px] text-muted font-mono font-semibold tracking-wider mt-0.5">
                SKU: {sku} &bull; {product.category || "General"}
              </p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
          {currentLedgerStock}
        </td>

        <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
          KES {defaultBuyingPrice.toLocaleString()}
        </td>

        <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground text-right">
          KES {defaultSellingPrice.toLocaleString()}
        </td>
      </tr>

      {/* Expanded Elevated Edit Card Drawer */}
      {isExpanded && (
        <tr className="border-b border-border/80 bg-muted/10">
          <td colSpan={5} className={cn("p-4 md:p-6", leftBorderClass)}>
            <div className="rounded-xl border border-border/80 bg-card p-5 md:p-6 shadow-xl shadow-black/5 dark:shadow-black/30 ring-1 ring-border/40 transition-all">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <fieldset
                  disabled={status === "saving"}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 border-none p-0 m-0 disabled:opacity-75"
                >
                  <legend className="sr-only">
                    New Stock Entry Form for {product.label}
                  </legend>

                  {/* Physical Count */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={quantityId}
                      className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/80"
                    >
                      Physical Count
                    </label>
                    <input
                      id={quantityId}
                      type="number"
                      step="any"
                      onFocus={(e) => e.target.select()}
                      aria-invalid={!!errors.quantity}
                      aria-describedby={
                        errors.quantity ? `${quantityId}-error` : undefined
                      }
                      {...register("quantity", { valueAsNumber: true })}
                      placeholder="0"
                      className={cn(
                        inputBaseStyle,
                        errors.quantity &&
                          "border-destructive focus:border-destructive focus:ring-destructive/20"
                      )}
                    />
                    {errors.quantity && (
                      <p
                        id={`${quantityId}-error`}
                        className="text-[10px] text-destructive font-bold mt-1"
                      >
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>

                  {/* Cost Price */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={buyingPriceId}
                      className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/80"
                    >
                      Cost Price (KES)
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-wider text-muted-foreground/70 pointer-events-none select-none bg-muted/60 px-1.5 py-0.5 rounded border border-border/40"
                        aria-hidden="true"
                      >
                        KES
                      </span>
                      <input
                        id={buyingPriceId}
                        type="number"
                        step="any"
                        onFocus={(e) => e.target.select()}
                        aria-invalid={!!errors.buying_price}
                        aria-describedby={
                          errors.buying_price
                            ? `${buyingPriceId}-error`
                            : undefined
                        }
                        {...register("buying_price", { valueAsNumber: true })}
                        className={cn(
                          inputBaseStyle,
                          "pl-14",
                          errors.buying_price &&
                            "border-destructive focus:border-destructive focus:ring-destructive/20"
                        )}
                      />
                    </div>
                    {errors.buying_price && (
                      <p
                        id={`${buyingPriceId}-error`}
                        className="text-[10px] text-destructive font-bold mt-1"
                      >
                        {errors.buying_price.message}
                      </p>
                    )}
                  </div>

                  {/* Retail Price */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={sellingPriceId}
                      className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/80"
                    >
                      Retail Price (KES)
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-wider text-muted-foreground/70 pointer-events-none select-none bg-muted/60 px-1.5 py-0.5 rounded border border-border/40"
                        aria-hidden="true"
                      >
                        KES
                      </span>
                      <input
                        id={sellingPriceId}
                        type="number"
                        step="any"
                        onFocus={(e) => e.target.select()}
                        aria-invalid={!!errors.selling_price}
                        aria-describedby={
                          errors.selling_price
                            ? `${sellingPriceId}-error`
                            : undefined
                        }
                        {...register("selling_price", { valueAsNumber: true })}
                        className={cn(
                          inputBaseStyle,
                          "pl-14",
                          errors.selling_price &&
                            "border-destructive focus:border-destructive focus:ring-destructive/20"
                        )}
                      />
                    </div>
                    {errors.selling_price && (
                      <p
                        id={`${sellingPriceId}-error`}
                        className="text-[10px] text-destructive font-bold mt-1"
                      >
                        {errors.selling_price.message}
                      </p>
                    )}
                  </div>

                  {/* Reference Type */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor={referenceTypeId}
                      className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/80"
                    >
                      Reference Type
                    </label>
                    <select
                      id={referenceTypeId}
                      aria-invalid={!!errors.reference_type}
                      {...register("reference_type")}
                      className={cn(
                        inputBaseStyle,
                        "cursor-pointer font-sans font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                      )}
                    >
                      {REFERENCE_GROUPS.map((group) => (
                        <optgroup key={group.group} label={group.group}>
                          {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label
                      htmlFor={notesId}
                      className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground/80"
                    >
                      New Stock Notes
                    </label>
                    <input
                      id={notesId}
                      type="text"
                      placeholder="e.g. Verified physical inventory count"
                      aria-invalid={!!errors.notes}
                      {...register("notes")}
                      className={cn(inputBaseStyle, "font-sans font-medium")}
                    />
                    {errors.notes && (
                      <p className="text-[10px] text-destructive font-bold mt-1">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>
                </fieldset>

                {/* Submission Error Banner */}
                {status === "error" && errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-bold flex items-center gap-2.5 shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Action Bar & Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    disabled={status === "saving"}
                    className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-extrabold uppercase tracking-wider border border-border bg-card text-foreground rounded-lg hover:bg-muted/20 hover:border-border focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!isDirty || status === "saving"}
                    className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-xs font-extrabold uppercase tracking-wider bg-brand-primary text-white rounded-lg shadow-xs hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 min-w-[130px]"
                  >
                    {status === "saving" ? (
                      <>
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin mr-2"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save
                          className="w-3.5 h-3.5 mr-2"
                          aria-hidden="true"
                        />
                        New Stock
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};