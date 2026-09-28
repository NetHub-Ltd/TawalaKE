"use client";

/**
 * Two-step finish flow:
 * 1) Customer — who is paying / taking credit
 * 2) Payment — Cash / M-Pesa / Credit + amount received + M-Pesa code
 */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Check,
  Search,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import {
  fetchPosConfig,
  POS_METHODS_FALLBACK,
  type PosPaymentMethod,
} from "@/features/sales/lib/posConfig";
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
} from "@/features/sales/lib/phone";
import { clearStagedSaleId } from "@/features/sales/lib/stagedSale";
import { Spinner } from "@/lib/components/ui";

interface CheckoutFormProps {
  saleId: string;
  grandTotal: number;
  organizationId: string;
  businessId: string;
}

type Step = "customer" | "payment";

const customerSchema = z.object({
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
});

const paymentSchema = z
  .object({
    paymentMethod: z.string().min(1, "Select a payment method"),
    amountGiven: z.string().optional(),
    paymentReference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "INVOICE") return;
    const given = Number(data.amountGiven);
    if (!data.amountGiven || !Number.isFinite(given) || given <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the amount received",
        path: ["amountGiven"],
      });
    }
    if (
      data.paymentMethod === "MPESA" &&
      !(data.paymentReference || "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "M-Pesa confirmation code is required",
        path: ["paymentReference"],
      });
    }
  });

type CustomerValues = z.infer<typeof customerSchema>;
type PaymentValues = z.infer<typeof paymentSchema>;

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

type CustomerHit = { id: string; name: string; phone?: string | null };

export function CheckoutForm({
  saleId,
  grandTotal,
  organizationId,
  businessId,
}: CheckoutFormProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const setTaxRate = useCartStore((s) => s.setTaxRate);

  const [step, setStep] = useState<Step>("customer");
  const [customer, setCustomer] = useState<CustomerValues | null>(null);
  const [methods, setMethods] =
    useState<PosPaymentMethod[]>(POS_METHODS_FALLBACK);
  const [configLoading, setConfigLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerHits, setCustomerHits] = useState<CustomerHit[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  const customerForm = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { customerName: "", customerPhone: "" },
  });

  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "CASH",
      amountGiven: grandTotal > 0 ? grandTotal.toFixed(2) : "",
      paymentReference: "",
    },
  });

  const paymentMethod = paymentForm.watch("paymentMethod");
  const amountGivenWatch = paymentForm.watch("amountGiven");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchPosConfig(businessId);
        if (cancelled) return;
        setMethods(cfg.payment_methods);
        setTaxRate(cfg.tax_rate);
        if (cfg.payment_methods[0]?.code) {
          paymentForm.setValue("paymentMethod", cfg.payment_methods[0].code);
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
  }, [businessId, setTaxRate, paymentForm]);

  useEffect(() => {
    if (paymentMethod === "INVOICE") return;
    const cur = paymentForm.getValues("amountGiven");
    if (!cur) {
      paymentForm.setValue(
        "amountGiven",
        grandTotal > 0 ? grandTotal.toFixed(2) : "",
      );
    }
  }, [paymentMethod, grandTotal, paymentForm]);

  useEffect(() => {
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetch(
          `/api/v1/org/customers?business_id=${encodeURIComponent(businessId)}&q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        const body = await res.json().catch(() => ({}));
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        if (!cancelled) {
          setCustomerHits(
            list.slice(0, 8).map((c: CustomerHit) => ({
              id: String(c.id),
              name: String(c.name || ""),
              phone: c.phone,
            })),
          );
        }
      } catch {
        if (!cancelled) setCustomerHits([]);
      } finally {
        if (!cancelled) setSearchingCustomers(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [customerQuery, businessId]);

  const onCustomerNext = customerForm.handleSubmit((data) => {
    setCustomer(data);
    setStep("payment");
  });

  const onPay = paymentForm.handleSubmit(async (data) => {
    if (!customer) {
      setStep("customer");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Completing sale…");
    const isCredit = data.paymentMethod === "INVOICE";
    const amountGiven = isCredit ? undefined : Number(data.amountGiven);
    const payload = {
      sale_id: saleId,
      payment_method: data.paymentMethod,
      payment_reference: isCredit
        ? undefined
        : (data.paymentReference || "").trim() || undefined,
      amount_given: amountGiven,
      customer_name: customer.customerName.trim(),
      customer_phone: customer.customerPhone,
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(body, "Could not complete sale"));
      }
      clearCart();
      clearStagedSaleId(businessId);
      toast.success(
        isCredit
          ? "Credit sale recorded"
          : amountGiven != null && amountGiven < grandTotal - 0.001
            ? "Partial payment recorded"
            : "Sale completed",
        { id: toastId },
      );
      router.push(
        `/org/${organizationId}/${businessId}/complete-sale?saleId=${encodeURIComponent(saleId)}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed", {
        id: toastId,
      });
      setSubmitting(false);
    }
  });

  const given = Number(amountGivenWatch || 0);
  const changeDue =
    paymentMethod !== "INVOICE" && given > grandTotal + 0.001
      ? given - grandTotal
      : 0;
  const isPartial =
    paymentMethod !== "INVOICE" && given > 0 && given < grandTotal - 0.001;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-5 flex items-center gap-2 text-xs font-medium">
        <span
          className={
            step === "customer" ? "text-brand-primary" : "text-muted"
          }
        >
          1 · Customer
        </span>
        <span className="text-muted">→</span>
        <span
          className={step === "payment" ? "text-brand-primary" : "text-muted"}
        >
          2 · Payment
        </span>
      </div>

      {step === "customer" && (
        <form onSubmit={onCustomerNext} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Customer
            </h2>
            <p className="mt-1 text-sm text-muted">
              Who is paying or taking credit? Required for every sale.
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
              onClick={() => {
                customerForm.setValue("customerName", "Walk-in customer", {
                  shouldValidate: true,
                });
                customerForm.setValue("customerPhone", "0700000000", {
                  shouldValidate: true,
                });
              }}
            >
              Use walk-in
            </button>
          </div>

          <div className="relative rounded-md border border-dashed border-brand-primary/25 bg-brand-primary/[0.04] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <Search size={13} className="text-brand-primary" />
              <p className="text-xs font-semibold text-foreground">
                Look up customer
              </p>
            </div>
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Type name or phone…"
              className="h-10 w-full rounded-md border border-border/50 bg-card px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              autoComplete="off"
            />
            {searchingCustomers && (
              <Loader2
                size={14}
                className="absolute right-5 top-12 animate-spin text-muted"
              />
            )}
            {customerHits.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-48 w-[calc(100%-1.75rem)] overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
                {customerHits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-register"
                      onClick={() => {
                        customerForm.setValue("customerName", c.name, {
                          shouldValidate: true,
                        });
                        if (c.phone) {
                          customerForm.setValue(
                            "customerPhone",
                            c.phone.replace(/\s+/g, ""),
                            { shouldValidate: true },
                          );
                        }
                        setCustomerQuery("");
                        setCustomerHits([]);
                      }}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.phone ? (
                        <span className="ml-2 text-xs text-muted">
                          {c.phone}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Customer name *
            </label>
            <input
              {...customerForm.register("customerName")}
              className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              placeholder="Who is paying / taking credit?"
            />
            {customerForm.formState.errors.customerName && (
              <p className="mt-1 text-sm text-[var(--error)]">
                {customerForm.formState.errors.customerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Customer phone *
            </label>
            <input
              {...customerForm.register("customerPhone")}
              className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              placeholder="07xxxxxxxx"
            />
            {customerForm.formState.errors.customerPhone && (
              <p className="mt-1 text-sm text-[var(--error)]">
                {customerForm.formState.errors.customerPhone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-primary text-sm font-semibold text-white"
          >
            Continue to payment
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {step === "payment" && customer && (
        <form onSubmit={onPay} className="space-y-4">
          <div>
            <button
              type="button"
              onClick={() => setStep("customer")}
              className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <ArrowLeft size={14} />
              Edit customer
            </button>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Payment
            </h2>
            <p className="mt-1 text-sm text-muted">
              {customer.customerName} · {customer.customerPhone}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              Amount due:{" "}
              {grandTotal.toLocaleString("en-KE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              KES
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Payment method
            </label>
            <div className="relative">
              <select
                {...paymentForm.register("paymentMethod")}
                disabled={submitting || configLoading}
                className="h-11 w-full cursor-pointer appearance-none rounded-md border border-border bg-card pl-3.5 pr-10 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              >
                {methods.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
            {paymentMethod === "INVOICE" && (
              <p className="mt-1.5 text-xs text-muted">
                Goods leave now · collect payment later · invoice
              </p>
            )}
          </div>

          {paymentMethod !== "INVOICE" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Amount received
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                inputMode="decimal"
                {...paymentForm.register("amountGiven")}
                disabled={submitting}
                className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
              {paymentForm.formState.errors.amountGiven && (
                <p className="mt-1 text-sm text-[var(--error)]">
                  {paymentForm.formState.errors.amountGiven.message}
                </p>
              )}
              {changeDue > 0 && (
                <p className="mt-1.5 text-sm font-medium">
                  Change due:{" "}
                  <span className="text-brand-primary">
                    {changeDue.toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              )}
              {isPartial && (
                <p className="mt-1.5 text-sm text-amber-700">
                  Partial payment — balance remaining will stay on invoice
                </p>
              )}
            </div>
          )}

          {paymentMethod === "MPESA" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                M-Pesa confirmation code
              </label>
              <input
                {...paymentForm.register("paymentReference")}
                placeholder="e.g. QH12ABCDE"
                disabled={submitting}
                className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm uppercase outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
              {paymentForm.formState.errors.paymentReference && (
                <p className="mt-1 text-sm text-[var(--error)]">
                  {paymentForm.formState.errors.paymentReference.message}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || configLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-accent text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner size="sm" /> Completing…
              </>
            ) : (
              <>
                <Check size={16} />
                {paymentMethod === "INVOICE"
                  ? "Complete credit sale"
                  : paymentMethod === "MPESA"
                    ? "Complete M-Pesa sale"
                    : "Complete sale"}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
