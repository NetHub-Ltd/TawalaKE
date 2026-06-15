import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, AlertTriangle, Loader2, Save } from "lucide-react";

// 1. Define component properties
interface AuditTableRowProps {
  productId: string;
  businessId: string;
  label: string;
  category: string;
  sku: string;
  unitOfMeasure: string;
  bookStock: number;
  costPrice: number;
  sellingPrice: number;
  onSaveSuccess: (payload: any) => Promise<void>;
}

// 2. Define internal form structure based on backend expectations
const schema = z.object({
  quantity: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  reason_code: z.string().default(""),
  notes: z.string().default(""),
});

type FormData = z.infer<typeof schema>;

export const AuditTableRow: React.FC<AuditTableRowProps> = ({
  productId,
  businessId,
  label,
  category,
  sku,
  unitOfMeasure,
  bookStock,
  onSaveSuccess,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 3. Initialize React Hook Form for local row state isolating
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
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

  // 4. Submit payload to backend service layer
  const onSubmit = async (data: FormData) => {
    if (hasVariance && (!data.reason_code || data.notes.trim().length < 5)) {
      setStatus("error");
      setErrorMessage("Variance detected. Reason code and notes (min 5 chars) are compulsory.");
      return;
    }

    try {
      setStatus("saving");
      setErrorMessage("");

      const finalPayload = {
        product_id: productId,
        business_id: businessId,
        quantity: data.quantity,
        reason_code: hasVariance ? data.reason_code : "SYSTEM_MATCH",
        notes: hasVariance ? data.notes : "Physical count matched system balance.",
      };

      await onSaveSuccess(finalPayload);
      setStatus("success");
      
      // Reset form state to current database baseline state
      reset({ quantity: data.quantity, reason_code: "", notes: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to commit audit adjustments.");
    }
  };

  // 5. Compute contextual row feedback colors
  const getRowBgColor = () => {
    if (status === "success" && !hasVariance) return "bg-emerald-50/60 border-emerald-200";
    if (hasVariance) return "bg-amber-50/40 border-amber-200";
    return "bg-white border-slate-100 hover:bg-slate-50/50";
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`border-b transition-all duration-200 ${getRowBgColor()}`}
    >
      {/* Upper Layout: Primary Interactive Spreadsheet Row */}
      <div className="flex flex-col md:flex-row md:items-center px-4 py-3 gap-4">
        
        {/* Item Core Identification Panel */}
        <div className="flex-1 min-w-[250px]">
          <h4 className="font-semibold text-slate-800 text-sm">{label}</h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {sku} &bull; <span className="text-slate-400">{category}</span> &bull; {unitOfMeasure}
          </p>
        </div>

        {/* Database Book Balance Baseline */}
        <div className="w-28 flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block md:hidden">Book Stock</span>
          <span className="text-sm font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded w-fit">
            {bookStock.toFixed(2)}
          </span>
        </div>

        {/* Physical Stock Counting Field */}
        <div className="w-32">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block md:hidden mb-1">Physical Count</span>
          <input
            type="number"
            step="any"
            onFocus={(e) => e.target.select()}
            disabled={status === "saving"}
            {...register("quantity")}
            className="w-full text-sm font-mono font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-shadow shadow-sm"
          />
          {errors.quantity && (
            <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {/* Dynamic Variance Badges */}
        <div className="w-36 flex items-center">
          {variance === 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 stroke-[3]" /> Match
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              variance > 0 ? "text-blue-600 bg-blue-100/70" : "text-amber-700 bg-amber-100"
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {variance > 0 ? `+${variance.toFixed(2)} Surplus` : `${variance.toFixed(2)} Shrink`}
            </span>
          )}
        </div>

        {/* Action Button Strip */}
        <div className="w-24 flex items-center justify-end">
          {status === "saving" ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <button
              type="submit"
              disabled={!isDirty && status !== "error"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-all focus:outline-none focus:ring-2 ${
                isDirty 
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 cursor-pointer" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Expandable Lower Shelf Layer for Shrinkage & Loss Accountability Tracking */}
      {hasVariance && (
        <div className="px-4 pb-4 pt-1 border-t border-dashed border-slate-200/60 bg-slate-50/50 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Reason Code *</label>
            <select
              {...register("reason_code")}
              className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Audit Classification --</option>
              <option value="THEFT_SHOPLIFTING">Theft or Shoplifting</option>
              <option value="DAMAGED_IN_STORE">Damaged / Broken Shelf Inventory</option>
              <option value="EXPIRED_STOCK">Expired Stock Tracking</option>
              <option value="DATA_ENTRY_ERROR">Historical Data Entry Mistake</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Accountability Notes *</label>
            <input
              type="text"
              placeholder="Provide context explaining this variance discrepancy..."
              {...register("notes")}
              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Global Row Alert Strip */}
      {status === "error" && errorMessage && (
        <div className="bg-rose-50 border-t border-rose-100 px-4 py-1.5 text-xs font-medium text-rose-600">
          {errorMessage}
        </div>
      )}
    </form>
  );
};