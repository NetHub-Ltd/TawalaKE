"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Store,
  Phone,
  MapPin,
  Percent,
  Pill,
  Utensils,
  ShoppingBag,
  Laptop,
  Sparkles,
  Loader2,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

const INDUSTRY_ENUM = [
  "GENERAL_RETAIL",
  "PHARMACY",
  "GROCERY_SUPERMARKET",
  "RESTAURANT_HOSPITALITY",
  "ELECTRONICS_HARDWARE",
  "BEAUTY_WELLNESS",
] as const;

type IndustryType = (typeof INDUSTRY_ENUM)[number];

interface IndustryMeta {
  label: string;
  icon: React.ElementType;
  alertTitle: string;
  alertMessage: string;
  defaultTax: number;
}

const INDUSTRY_CONFIGS: Record<IndustryType, IndustryMeta> = {
  GENERAL_RETAIL: {
    label: "General Retail",
    icon: ShoppingBag,
    alertTitle: "Default tax",
    alertMessage: "VAT default set to 16%. You can change tax anytime in branch settings.",
    defaultTax: 16,
  },
  PHARMACY: {
    label: "Pharmacy & Healthcare",
    icon: Pill,
    alertTitle: "Default tax",
    alertMessage: "Tax default set to 0% (common for exempt lines). Adjust per branch if needed.",
    defaultTax: 0,
  },
  GROCERY_SUPERMARKET: {
    label: "Grocery & Supermarket",
    icon: ShoppingBag,
    alertTitle: "Default tax",
    alertMessage: "VAT default set to 16%. Change in branch settings after create.",
    defaultTax: 16,
  },
  RESTAURANT_HOSPITALITY: {
    label: "Restaurant & Hospitality",
    icon: Utensils,
    alertTitle: "Default tax",
    alertMessage: "VAT default set to 16%. Change in branch settings after create.",
    defaultTax: 16,
  },
  ELECTRONICS_HARDWARE: {
    label: "Electronics & Hardware",
    icon: Laptop,
    alertTitle: "Default tax",
    alertMessage: "VAT default set to 16%. Change in branch settings after create.",
    defaultTax: 16,
  },
  BEAUTY_WELLNESS: {
    label: "Beauty & Wellness",
    icon: Sparkles,
    alertTitle: "Default tax",
    alertMessage: "VAT default set to 16%. Change in branch settings after create.",
    defaultTax: 16,
  },
};

const storeFormSchema = z.object({
  organization_id: z.string().uuid("Invalid organization UUID."),
  industry: z.enum(INDUSTRY_ENUM, {
    message: "Please select an industry.",
  }),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits.")
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Enter a valid phone number.",
    ),
  address: z.string().min(5, "Address must be at least 5 characters."),
  tax_rate: z
    .number({ message: "Tax rate is required." })
    .min(0, "Tax rate cannot be negative.")
    .max(100, "Tax rate cannot exceed 100%."),
});

export type StoreFormValues = z.infer<typeof storeFormSchema>;

interface StoreFormProps {
  organizationId?: string;
  onSuccess?: (data: StoreFormValues) => void;
}

export default function StoreForm({
  organizationId = "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  onSuccess,
}: StoreFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [billingHref, setBillingHref] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    mode: "onChange",
    defaultValues: {
      organization_id: organizationId,
      industry: "" as unknown as IndustryType,
      name: "",
      phone: "",
      address: "",
      tax_rate: 16,
    },
  });

  const selectedIndustry = watch("industry");
  const currentIndustryMeta = INDUSTRY_CONFIGS[selectedIndustry];

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as IndustryType;
    setValue("industry", val, { shouldValidate: true });
    if (INDUSTRY_CONFIGS[val]) {
      setValue("tax_rate", INDUSTRY_CONFIGS[val].defaultTax, {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = async (data: StoreFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setBillingHref(null);

    try {
      const response = await fetch("/api/v1/org/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = body?.detail;
        const msg =
          (typeof detail === "string" && detail) ||
          detail?.message ||
          body?.error ||
          body?.message ||
          (response.status === 402
            ? "Plan branch limit reached. Upgrade billing or archive a branch."
            : "Failed to create branch.");
        const isLimit =
          response.status === 402 ||
          detail?.code === "PLAN_LIMIT_REACHED" ||
          /limit|upgrade|plan/i.test(String(msg));
        setServerError(String(msg));
        if (isLimit) {
          setBillingHref(`/org/${organizationId}/billing`);
        }
        return;
      }

      if (onSuccess) onSuccess(data);
      const createdId = body?.id || body?.data?.id;
      if (createdId) {
        router.push(`/org/${organizationId}/${createdId}/overview`);
      } else {
        router.push(`/org/${organizationId}/stores`);
      }
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Network error creating branch.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-layered w-full max-w-xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-h3 font-bold tracking-tight text-foreground">
              New branch
            </h1>
            <p className="text-xs text-muted">
              Name, contact, industry (for tax default), and location.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-muted hover:text-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="flex-1">
              {serverError}
              {billingHref && (
                <>
                  {" "}
                  <a
                    href={billingHref}
                    className="font-semibold underline underline-offset-2"
                  >
                    Open Billing to upgrade
                  </a>
                </>
              )}
            </span>
          </div>
        )}

        <input type="hidden" {...register("organization_id")} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Store Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="store-name"
              className="block text-xs font-semibold text-foreground"
            >
              Branch name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Store className="w-4 h-4" />
              </div>
              <input
                id="store-name"
                type="text"
                placeholder="e.g. Westlands Main Branch"
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
                className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  errors.name ? "border-rose-500" : "border-border"
                }`}
              />
            </div>
            {errors.name && (
              <p id="name-error" className="text-[11px] text-rose-500 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Industry Selector */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="industry-select"
              className="block text-xs font-semibold text-foreground"
            >
              Industry Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Building2 className="w-4 h-4" />
              </div>
              <select
                id="industry-select"
                value={selectedIndustry || ""}
                onChange={handleIndustryChange}
                aria-invalid={errors.industry ? "true" : "false"}
                aria-describedby={errors.industry ? "industry-error" : undefined}
                className={`w-full h-11 pl-10 pr-8 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary appearance-none cursor-pointer ${
                  errors.industry ? "border-rose-500" : "border-border"
                }`}
              >
                <option value="" disabled>
                  Select an industry category...
                </option>
                {INDUSTRY_ENUM.map((indKey) => (
                  <option key={indKey} value={indKey}>
                    {INDUSTRY_CONFIGS[indKey].label}
                  </option>
                ))}
              </select>
            </div>
            {errors.industry && (
              <p id="industry-error" className="text-[11px] text-rose-500 font-medium">
                {errors.industry.message}
              </p>
            )}
          </div>

          {/* Dynamic Industry Alert Banner */}
          {currentIndustryMeta && (
            <div
              role="region"
              aria-live="polite"
              className="sm:col-span-2 p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center gap-3 text-xs transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary shrink-0">
                <currentIndustryMeta.icon className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight">
                <span className="font-bold text-foreground">
                  {currentIndustryMeta.alertTitle}:{" "}
                </span>
                <span className="text-muted">
                  {currentIndustryMeta.alertMessage}
                </span>
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="store-phone"
              className="block text-xs font-semibold text-foreground"
            >
              Contact Phone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="store-phone"
                type="tel"
                placeholder="+254 712 345 678"
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
                className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  errors.phone ? "border-rose-500" : "border-border"
                }`}
              />
            </div>
            {errors.phone && (
              <p id="phone-error" className="text-[11px] text-rose-500 font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Tax Rate (%) */}
          <div className="space-y-1.5">
            <label
              htmlFor="tax-rate"
              className="block text-xs font-semibold text-foreground"
            >
              Tax Rate (%) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Percent className="w-4 h-4" />
              </div>
              <input
                id="tax-rate"
                type="number"
                step="0.01"
                placeholder="16"
                aria-invalid={errors.tax_rate ? "true" : "false"}
                aria-describedby={errors.tax_rate ? "tax-error" : undefined}
                {...register("tax_rate", { valueAsNumber: true })}
                className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  errors.tax_rate ? "border-rose-500" : "border-border"
                }`}
              />
            </div>
            {errors.tax_rate && (
              <p id="tax-error" className="text-[11px] text-rose-500 font-medium">
                {errors.tax_rate.message}
              </p>
            )}
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="store-address"
              className="block text-xs font-semibold text-foreground"
            >
              Physical Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="store-address"
                type="text"
                placeholder="e.g. Suite 4B, Kimathi Street, Nairobi"
                aria-invalid={errors.address ? "true" : "false"}
                aria-describedby={errors.address ? "address-error" : undefined}
                {...register("address")}
                className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  errors.address ? "border-rose-500" : "border-border"
                }`}
              />
            </div>
            {errors.address && (
              <p id="address-error" className="text-[11px] text-rose-500 font-medium">
                {errors.address.message}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-5 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="h-11 px-6 rounded-xl bg-brand-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating…</span>
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                <span>Create branch</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}