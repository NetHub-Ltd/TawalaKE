"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { ResolverOptions } from '@hookform/resolvers/zod';
// import type { ResolverOptions } from '@hookform/resolvers/zod';
import * as z from "zod";
import { Edit3, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductResponse } from "@/lib/api/generated/models";

/**
 * 1. Unified Schema
 * Using z.coerce ensures that string inputs from the HTML form are 
 * properly cast to numbers before validation.
 */
const productSchema = z.object({
  label: z.string().min(1, "Required"),
  selling_price: z.number().min(0),
  track_stock: z.boolean(),
  stock: z.number().min(0),
  active: z.boolean(),
  attributes: z.object({
    unit_of_measure: z.string().nullish(),
    buying_price: z.number().nullish(),
    sku: z.string().nullish(),
  }),
});

// Extract the type directly from the schema to prevent 
// mismatch between manual interfaces and Zod inference.
type ProductFormValues = z.infer<typeof productSchema>;

interface RegistryRowProps {
  product: ProductResponse;
  onUpdate: (id: string, data: ProductFormValues) => void;
  onDelete: (id: string, name: string) => void;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[8px] font-black uppercase tracking-widest text-secondary/40 block mb-1">
    {children}
  </label>
);

export function RegistryRow({ product, onUpdate, onDelete }: RegistryRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    // Ensure default values strictly match the inferred type
    defaultValues: {
      label: product.label ?? "",
      selling_price: product.selling_price ?? 0,
      track_stock: product.track_stock ?? false,
      stock: product.stock ?? 0,
      active: product.active ?? true,
      attributes: {
        unit_of_measure: product.attributes?.unit_of_measure ?? "pcs",
        buying_price: product.attributes?.buying_price ?? 0,
        sku: product.attributes?.sku ?? "",
      },
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    if (isDirty) onUpdate(product.id, data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const inputClasses = (hasError?: boolean) =>
    cn(
      "w-full bg-background border rounded px-2 py-1 text-[11px] font-bold outline-none transition-all",
      hasError ? "border-red-500 ring-1 ring-red-500/20" : "border-primary/20 focus:border-primary"
    );

  return (
    <tr className={cn("transition-all border-b border-border/30", isEditing ? "bg-primary/[0.03]" : "hover:bg-muted/20 group")}>
      
      {/* STATUS & TOGGLE */}
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-black text-secondary/30 uppercase">
            #{product.id.substring(0, 5)}
          </span>
          {isEditing ? (
            <input type="checkbox" {...register("active")} className="accent-primary w-3 h-3 cursor-pointer" />
          ) : (
            <div className={cn("w-2 h-2 rounded-full", product.active ? "bg-emerald-500" : "bg-red-500")} />
          )}
        </div>
      </td>

      {/* CORE IDENTIFIERS */}
      <td className="px-4 py-4 align-top min-w-[200px]">
        {isEditing ? (
          <div className="space-y-2">
            <FieldLabel>SKU / Label</FieldLabel>
            <input {...register("attributes.sku")} className={inputClasses(!!errors.attributes?.sku)} placeholder="SKU" />
            <input {...register("label")} className={inputClasses(!!errors.label)} placeholder="Label" />
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-tight">
              {product.attributes?.sku || "NO-SKU"}
            </span>
            <span className="text-xs font-black uppercase truncate max-w-[180px]">{product.label}</span>
          </div>
        )}
      </td>

      {/* FINANCIALS */}
      <td className="px-4 py-4 align-top w-48">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Buy</FieldLabel>
              <input type="number" step="0.01" {...register("attributes.buying_price")} className={inputClasses()} />
            </div>
            <div>
              <FieldLabel>Sell</FieldLabel>
              <input type="number" step="0.01" {...register("selling_price")} className={inputClasses()} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-secondary/40 line-through">
              Ksh {product.attributes?.buying_price?.toLocaleString() ?? "0"}
            </span>
            <span className="text-xs font-black text-primary italic">
              Ksh {product.selling_price.toLocaleString()}
            </span>
          </div>
        )}
      </td>

      {/* INVENTORY */}
      <td className="px-4 py-4 align-top w-48 text-right">
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
                <FieldLabel>Track</FieldLabel>
                <input type="checkbox" {...register("track_stock")} className="accent-primary cursor-pointer" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" {...register("stock")} className={inputClasses()} placeholder="Qty" />
              <input {...register("attributes.unit_of_measure")} className={inputClasses()} placeholder="Unit" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className={cn("text-xs font-black", (product.stock ?? 0) <= 5 ? "text-red-500" : "text-foreground")}>
              {product.stock} <span className="text-[9px] text-secondary/40 uppercase">{product.attributes?.unit_of_measure}</span>
            </span>
            <span className="text-[8px] font-black uppercase text-secondary/20">{product.track_stock ? "Auto" : "Manual"}</span>
          </div>
        )}
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-4 align-top text-right w-24">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              <button 
                type="button" 
                onClick={handleSubmit(onSubmit)} 
                className="h-7 w-7 flex items-center justify-center rounded bg-primary text-white shadow-sm hover:bg-primary/90"
              >
                <Check size={14} strokeWidth={3} />
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                className="h-7 w-7 flex items-center justify-center rounded border border-border bg-card hover:bg-muted"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Edit3 size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => onDelete(product.id, product.label)} 
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}