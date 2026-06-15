// src/features/inventory/AuditTableRow.tsx
"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, AlertTriangle, Loader2, Save } from "lucide-react";
import { ProductResponse } from "@/lib/api/generated/models";

interface AuditTableRowProps {
  product: ProductResponse;
  businessId: string;
  onSaveSuccess: (payload: any) => Promise<void>;
}


// const auditFormSchema = z.object({
//   quantity: z
//     .union([z.string(), z.number(), z.undefined(), z.null()])
//     .transform((val) => {
//       if (val == null || val === "") return 0;
//       const num = Number(val);
//       return isNaN(num) ? 0 : num;
//     })
//     .pipe(z.number().min(0, "Physical stock cannot fall below zero")),

//   reason_code: z.string().default(""),
//   notes: z.string().default(""),
// });

const auditFormSchema = z.object({
  quantity: z.number().min(0, "Physical stock cannot fall below zero"),
  reason_code: z.string().default(""),
  notes: z.string().default(""),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

export const AuditTableRow: React.FC<AuditTableRowProps> = ({
  product,
  businessId,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const bookStock = product.stock ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      quantity: product.stock ?? 0,
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
      setErrorMessage("Variance detected. Reason code and notes (min 5 characters) are required.");
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
          : "Physical count matched system balance perfectly.",
      };

      await onSaveSuccess(finalPayload);
      
      setStatus("success");
      reset({ quantity: data.quantity, reason_code: "", notes: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to save inventory adjustment.");
    }
  };

  const getRowStyles = () => {
    if (status === "success" && !hasVariance) return "bg-emerald-50 border-emerald-200";
    if (hasVariance) return "bg-amber-50 border-amber-200";
    return "hover:bg-gray-50 border-gray-100";
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`border-b transition-colors duration-200 ${getRowStyles()}`}
    >
      <div className="flex flex-col md:flex-row md:items-center px-4 py-3 gap-4">
        
        <div className="flex-1 min-w-[250px]">
          <h4 className="font-bold text-foreground">{product.label}</h4>
          <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">
            SKU: {product.attributes?.sku || "NO_SKU"} • {product.category || "General"}
          </p>
        </div>

        <div className="w-28 flex flex-col justify-center">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest block md:hidden mb-0.5">Book Stock</span>
          <span className="text-sm font-mono font-black text-muted bg-white border border-gray-200 px-2.5 py-1 rounded w-fit">
            {bookStock.toFixed(2)}
          </span>
        </div>

        <div className="w-32">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest block md:hidden mb-1">Physical Count</span>
          <input
            type="number"
            step="any"
            {...register("quantity")}
            className="w-full text-sm font-mono font-bold px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
            disabled={status === "saving"}
          />
          {errors.quantity && (
            <p className="text-[11px] text-red-600 font-medium mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>

        <div className="w-36 flex items-center">
          {variance === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Match
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border ${
              variance > 0 
                ? "text-amber-600 border-amber-200 bg-amber-50" 
                : "text-red-600 border-red-200 bg-red-50"
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
            </span>
          )}
        </div>

        <div className="w-24 flex items-center justify-end">
          {status === "saving" ? (
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          ) : (
            <button
              type="submit"
              disabled={!isDirty && status !== "error"}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                isDirty 
                  ? "bg-emerald-600 text-white border-transparent hover:bg-emerald-700" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" /> Save
            </button>
          )}
        </div>
      </div>

      {hasVariance && (
        <div className="px-4 pb-4 pt-2 border-t border-dashed border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-bold text-gray-600 mb-1">Reason Code *</label>
            <select
              {...register("reason_code")}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select reason...</option>
              <option value="THEFT_SHOPLIFTING">Theft / Shoplifting</option>
              <option value="DAMAGED_IN_STORE">Damaged in Store</option>
              <option value="EXPIRED_STOCK">Expired Stock</option>
              <option value="DATA_ENTRY_ERROR">Data Entry Error</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1">Notes *</label>
            <input
              {...register("notes")}
              placeholder="Explain the variance..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-200">
          {errorMessage}
        </div>
      )}
    </form>
  );
};