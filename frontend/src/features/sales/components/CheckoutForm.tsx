"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface CheckoutFormProps {
  saleId: string;
  grandTotal: number;
  organizationId: string;
  businessId: string;
}

/** Must match backend PaymentMethod: CASH | MPESA | INVOICE | CARD */
const schema = z.object({
  customerName: z
    .string()
    .min(2, "Please enter the customer’s name")
    .max(80, "Name is too long"),
  customerPhone: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .refine((val) => /^(07|01)\d{8}$/.test(val), {
      message: "Use a valid Kenyan number (07xxxxxxxx or 01xxxxxxxx)",
    }),
  paymentMethod: z.enum(["CASH", "INVOICE"]),
  signSale: z.boolean().refine((val) => val === true, {
    message: "Please confirm to complete this sale",
  }),
});

type FormValues = z.infer<typeof schema>;

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as Record<string, unknown>;
  if (typeof p.error === "string" && p.error.trim()) return p.error;
  if (typeof p.message === "string" && p.message.trim()) return p.message;
  if (typeof p.detail === "string" && p.detail.trim()) return p.detail;
  if (Array.isArray(p.detail) && p.detail.length > 0) {
    const first = p.detail[0] as { msg?: string };
    if (first?.msg) return first.msg;
  }
  return fallback;
}

export function CheckoutForm({
  saleId,
  grandTotal,
  organizationId,
  businessId,
}: CheckoutFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "CASH",
      signSale: false,
    },
  });

  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (data: FormValues) => {
    const toastId = toast.loading("Completing sale...");

    const payload = {
      sale_id: saleId,
      payment_method: data.paymentMethod,
      payment_reference: saleId,
      customer_name: data.customerName.trim(),
      customer_phone: data.customerPhone,
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(body, "Could not complete the sale")
        );
      }

      toast.success("Sale completed", {
        id: toastId,
        description:
          data.paymentMethod === "INVOICE"
            ? `Invoice recorded · KES ${grandTotal.toLocaleString()}`
            : `KES ${grandTotal.toLocaleString()} recorded`,
      });

      router.push(
        `/org/${organizationId}/${businessId}/complete-sale?saleId=${encodeURIComponent(saleId)}`
      );
    } catch (err) {
      toast.error("Something went wrong", {
        id: toastId,
        description:
          err instanceof Error ? err.message : "Please try again",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Finish this sale
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add the customer and choose how they are paying.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Customer name
          </label>
          <input
            id="customerName"
            type="text"
            disabled={isSubmitting}
            placeholder="e.g. Jane Doe"
            {...register("customerName")}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm
                       placeholder:text-muted-foreground/60
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                       disabled:opacity-50 transition"
          />
          {errors.customerName && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.customerName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="customerPhone"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Phone number
          </label>
          <input
            id="customerPhone"
            type="text"
            inputMode="numeric"
            disabled={isSubmitting}
            placeholder="0712 345 678"
            {...register("customerPhone")}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-mono
                       placeholder:text-muted-foreground/60
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                       disabled:opacity-50 transition"
          />
          {errors.customerPhone && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.customerPhone.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            How are they paying?
          </label>
          <div className="relative">
            <select
              id="paymentMethod"
              disabled={isSubmitting}
              {...register("paymentMethod")}
              className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         disabled:opacity-50 transition appearance-none cursor-pointer"
            >
              <option value="CASH">Cash</option>
              <option value="INVOICE">Generate invoice</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("signSale")}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-border text-brand-primary
                         focus:ring-brand-primary/30 disabled:opacity-50"
            />
            <span className="text-sm text-foreground leading-snug">
              Sign this sale
            </span>
          </label>
          {errors.signSale && (
            <p className="mt-1.5 text-sm text-destructive pl-6">
              {errors.signSale.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-brand-primary text-white text-sm font-semibold
                     flex items-center justify-center gap-2
                     hover:bg-brand-primary/90 active:scale-[0.99]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <Check size={16} />
              {paymentMethod === "CASH"
                ? "Complete cash sale"
                : "Create invoice & finish"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
