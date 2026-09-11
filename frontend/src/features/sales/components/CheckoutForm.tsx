"use client";

/**
 * Finalize sale: customer required for every method (who paid / who took credit).
 * Payment methods loaded from backend POS config (Cash + Credit today).
 */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import {
  fetchPosConfig,
  POS_METHODS_FALLBACK,
  type PosPaymentMethod,
} from "@/features/sales/lib/posConfig";
import { normalizeKenyanPhone, isValidKenyanPhone } from "@/features/sales/lib/phone";
import { clearStagedSaleId } from "@/features/sales/lib/stagedSale";

interface CheckoutFormProps {
  saleId: string;
  grandTotal: number;
  organizationId: string;
  businessId: string;
}

const schema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name is required")
    .max(80, "Name is too long"),
  customerPhone: z
    .string()
    .transform((val) => normalizeKenyanPhone(val))
    .refine((val) => isValidKenyanPhone(val), {
      message: "Use a valid Kenyan number (07xxxxxxxx, 01xxxxxxxx, or +254…)",
    }),
  paymentMethod: z.string().min(1, "Select a payment method"),
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

type CustomerHit = {
  id: string;
  name: string;
  phone?: string | null;
};

export function CheckoutForm({
  saleId,
  grandTotal,
  organizationId,
  businessId,
}: CheckoutFormProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const setTaxRate = useCartStore((s) => s.setTaxRate);

  const [methods, setMethods] = useState<PosPaymentMethod[]>(POS_METHODS_FALLBACK);
  const [configLoading, setConfigLoading] = useState(true);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerHits, setCustomerHits] = useState<CustomerHit[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "CASH",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const selectedMeta = methods.find((m) => m.code === paymentMethod);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConfigLoading(true);
      try {
        const cfg = await fetchPosConfig(businessId);
        if (cancelled) return;
        setMethods(cfg.payment_methods);
        setTaxRate(cfg.tax_rate);
        if (cfg.payment_methods[0]?.code) {
          setValue("paymentMethod", cfg.payment_methods[0].code);
        }
      } catch {
        if (!cancelled) setMethods(POS_METHODS_FALLBACK);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, setTaxRate, setValue]);

  // Debounced customer search for typeahead
  useEffect(() => {
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerHits([]);
      return;
    }
    const t = window.setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const params = new URLSearchParams({
          businessId,
          q,
          limit: "8",
        });
        const res = await fetch(`/api/v1/customers?${params}`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setCustomerHits([]);
          return;
        }
        const data = body.data ?? body;
        const items = (data.items || []) as CustomerHit[];
        setCustomerHits(items);
      } catch {
        setCustomerHits([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [customerQuery, businessId]);

  function pickCustomer(c: CustomerHit) {
    setValue("customerName", c.name, { shouldValidate: true });
    if (c.phone) {
      setValue("customerPhone", c.phone.replace(/\s+/g, ""), {
        shouldValidate: true,
      });
    }
    setCustomerQuery("");
    setCustomerHits([]);
  }

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

      // Clear cart only after successful finalize
      clearCart();
      clearStagedSaleId(businessId);

      const isCredit = data.paymentMethod === "INVOICE";
      toast.success(isCredit ? "Credit sale recorded" : "Sale completed", {
        id: toastId,
        description: isCredit
          ? `Credit · ${data.customerName} · KES ${grandTotal.toLocaleString()}`
          : `${data.customerName} · KES ${grandTotal.toLocaleString()}`,
      });

      router.push(
        `/org/${organizationId}/${businessId}/complete-sale?saleId=${encodeURIComponent(saleId)}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again";
      const stockIssue = /stock|insufficient/i.test(msg);
      toast.error(stockIssue ? "Not enough stock" : "Could not complete sale", {
        id: toastId,
        description: stockIssue
          ? `${msg} Go back to the terminal and reduce quantities.`
          : msg,
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
          Customer is required on every sale so you always know who paid or who
          took credit.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Customer typeahead */}
        <div className="relative">
          <label
            htmlFor="customer-search"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Find existing customer
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              id="customer-search"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search name or phone…"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              autoComplete="off"
            />
            {searchingCustomers && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            )}
          </div>
          {customerHits.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg">
              {customerHits.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pickCustomer(c)}
                    className="flex w-full flex-col items-start px-3 py-2.5 text-left text-sm hover:bg-brand-primary/5"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.phone || "No phone"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Customer name <span className="text-rose-600">*</span>
          </label>
          <input
            id="customerName"
            {...register("customerName")}
            disabled={isSubmitting}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                       disabled:opacity-50"
            placeholder="Who is paying / taking credit?"
            autoComplete="name"
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
            Customer phone <span className="text-rose-600">*</span>
          </label>
          <input
            id="customerPhone"
            {...register("customerPhone")}
            disabled={isSubmitting}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                       disabled:opacity-50"
            placeholder="07xxxxxxxx"
            inputMode="tel"
            autoComplete="tel"
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
            Payment method
          </label>
          <div className="relative">
            <select
              id="paymentMethod"
              {...register("paymentMethod")}
              disabled={isSubmitting || configLoading}
              className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         disabled:opacity-50 transition appearance-none cursor-pointer"
            >
              {methods.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          {selectedMeta && !selectedMeta.collects_money && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Customer takes goods now. Stock is reduced. An invoice is issued
              so you can collect payment later.
            </p>
          )}
          {errors.paymentMethod && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || configLoading}
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
              {paymentMethod === "INVOICE"
                ? "Complete credit sale"
                : "Complete cash sale"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
