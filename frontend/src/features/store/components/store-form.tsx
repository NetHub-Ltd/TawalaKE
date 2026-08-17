// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import {
//   Building2,
//   Store,
//   Phone,
//   MapPin,
//   Percent,
//   Pill,
//   Utensils,
//   ShoppingBag,
//   Laptop,
//   Sparkles,
//   Loader2,
//   ShieldAlert,
//   ArrowLeft,
// } from "lucide-react";

// const INDUSTRY_ENUM = [
//   "GENERAL_RETAIL",
//   "PHARMACY",
//   "GROCERY_SUPERMARKET",
//   "RESTAURANT_HOSPITALITY",
//   "ELECTRONICS_HARDWARE",
//   "BEAUTY_WELLNESS",
// ] as const;

// type IndustryType = (typeof INDUSTRY_ENUM)[number];

// interface IndustryMeta {
//   label: string;
//   icon: React.ElementType;
//   alertTitle: string;
//   alertMessage: string;
//   defaultTax: number;
// }

// const INDUSTRY_CONFIGS: Record<IndustryType, IndustryMeta> = {
//   GENERAL_RETAIL: {
//     label: "General Retail",
//     icon: ShoppingBag,
//     alertTitle: "Standard Inventory",
//     alertMessage: "Barcoding and SKU variants enabled.",
//     defaultTax: 16,
//   },
//   PHARMACY: {
//     label: "Pharmacy & Healthcare",
//     icon: Pill,
//     alertTitle: "Regulatory Compliance",
//     alertMessage: "Batch & expiry tracking activated.",
//     defaultTax: 0,
//   },
//   GROCERY_SUPERMARKET: {
//     label: "Grocery & Supermarket",
//     icon: ShoppingBag,
//     alertTitle: "Produce Scaling",
//     alertMessage: "Integrated scale calibration enabled.",
//     defaultTax: 16,
//   },
//   RESTAURANT_HOSPITALITY: {
//     label: "Restaurant & Hospitality",
//     icon: Utensils,
//     alertTitle: "Kitchen Routing",
//     alertMessage: "KDS ticket routing & table management enabled.",
//     defaultTax: 16,
//   },
//   ELECTRONICS_HARDWARE: {
//     label: "Electronics & Hardware",
//     icon: Laptop,
//     alertTitle: "Serial Tracking",
//     alertMessage: "IMEI and warranty logging enabled.",
//     defaultTax: 16,
//   },
//   BEAUTY_WELLNESS: {
//     label: "Beauty & Wellness",
//     icon: Sparkles,
//     alertTitle: "Service Hybrid",
//     alertMessage: "Appointments & therapist commissions enabled.",
//     defaultTax: 16,
//   },
// };

// const storeFormSchema = z.object({
//   organization_id: z.string().uuid("Invalid organization UUID."),
//   industry: z.enum(INDUSTRY_ENUM, {
//     message: "Please select an industry.",
//   }),
//   name: z
//     .string()
//     .min(2, "Name must be at least 2 characters.")
//     .max(100, "Name cannot exceed 100 characters."),
//   phone: z
//     .string()
//     .min(10, "Phone number must be at least 10 digits.")
//     .regex(
//       /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
//       "Enter a valid phone number.",
//     ),
//   address: z.string().min(5, "Address must be at least 5 characters."),
//   tax_rate: z.coerce
//     .number({ message: "Tax rate is required." })
//     .min(0, "Tax rate cannot be negative.")
//     .max(100, "Tax rate cannot exceed 100%."),
// });

// // export type StoreFormValues = z.infer<typeof storeFormSchema>;

// export type StoreFormValues = z.infer<typeof storeFormSchema>;

// interface StoreFormProps {
//   organizationId?: string;
//   onSuccess?: (data: StoreFormValues) => void;
// }

// export default function StoreForm({
//   organizationId = "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   onSuccess,
// }: StoreFormProps) {
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [serverError, setServerError] = useState<string | null>(null);

//   const {
//   register,
//   handleSubmit,
//   watch,
//   setValue,
//   formState: { errors, isValid },
// } = useForm<StoreFormValues>({
//   resolver: zodResolver(storeFormSchema),
//   mode: "onChange",
//   defaultValues: {
//     organization_id: organizationId,
//     industry: "" as unknown as IndustryType,
//     name: "",
//     phone: "",
//     address: "",
//     tax_rate: 16,
//   },
// });

//   const selectedIndustry = watch("industry");
//   const currentIndustryMeta = INDUSTRY_CONFIGS[selectedIndustry];

//   const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const val = e.target.value as IndustryType;
//     setValue("industry", val, { shouldValidate: true });
//     if (INDUSTRY_CONFIGS[val]) {
//       setValue("tax_rate", INDUSTRY_CONFIGS[val].defaultTax, {
//         shouldValidate: true,
//       });
//     }
//   };

//   const onSubmit = async (data: StoreFormValues) => {
//     setIsSubmitting(true);
//     setServerError(null);

//     try {
//       const response = await fetch("/api/v1/stores", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to provision store location.");
//       }

//       if (onSuccess) onSuccess(data);
//       router.back();
//     } catch {
//       if (onSuccess) onSuccess(data);
//       router.back();
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="card-layered w-full max-w-xl p-5 sm:p-6 space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between border-b border-border pb-4">
//         <div className="flex items-center gap-3">
//           <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold shrink-0">
//             <Store className="w-5 h-5" />
//           </div>
//           <div>
//             <h1 className="text-h3 font-bold tracking-tight text-foreground">
//               Provision New Store Outlet
//             </h1>
//             <p className="text-xs text-muted">
//               Configure store details and POS industry rules.
//             </p>
//           </div>
//         </div>
//         <button
//           type="button"
//           onClick={() => router.back()}
//           className="p-2 text-muted hover:text-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
//           aria-label="Go back to previous page"
//         >
//           <ArrowLeft className="w-5 h-5" />
//         </button>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
//         {serverError && (
//           <div
//             role="alert"
//             className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2"
//           >
//             <ShieldAlert className="w-4 h-4 shrink-0" />
//             <span>{serverError}</span>
//           </div>
//         )}

//         <input type="hidden" {...register("organization_id")} />

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {/* Store Name */}
//           <div className="space-y-1.5 sm:col-span-2">
//             <label
//               htmlFor="store-name"
//               className="block text-xs font-semibold text-foreground"
//             >
//               Store / Branch Name <span className="text-rose-500">*</span>
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
//                 <Store className="w-4 h-4" />
//               </div>
//               <input
//                 id="store-name"
//                 type="text"
//                 placeholder="e.g. Westlands Main Branch"
//                 aria-invalid={errors.name ? "true" : "false"}
//                 aria-describedby={errors.name ? "name-error" : undefined}
//                 {...register("name")}
//                 className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//                   errors.name ? "border-rose-500" : "border-border"
//                 }`}
//               />
//             </div>
//             {errors.name && (
//               <p id="name-error" className="text-[11px] text-rose-500 font-medium">
//                 {errors.name.message}
//               </p>
//             )}
//           </div>

//           {/* Industry Selector */}
//           <div className="space-y-1.5 sm:col-span-2">
//             <label
//               htmlFor="industry-select"
//               className="block text-xs font-semibold text-foreground"
//             >
//               Industry Category <span className="text-rose-500">*</span>
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
//                 <Building2 className="w-4 h-4" />
//               </div>
//               <select
//                 id="industry-select"
//                 value={selectedIndustry || ""}
//                 onChange={handleIndustryChange}
//                 aria-invalid={errors.industry ? "true" : "false"}
//                 aria-describedby={errors.industry ? "industry-error" : undefined}
//                 className={`w-full h-11 pl-10 pr-8 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary appearance-none cursor-pointer ${
//                   errors.industry ? "border-rose-500" : "border-border"
//                 }`}
//               >
//                 <option value="" disabled>
//                   Select an industry category...
//                 </option>
//                 {INDUSTRY_ENUM.map((indKey) => (
//                   <option key={indKey} value={indKey}>
//                     {INDUSTRY_CONFIGS[indKey].label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             {errors.industry && (
//               <p id="industry-error" className="text-[11px] text-rose-500 font-medium">
//                 {errors.industry.message}
//               </p>
//             )}
//           </div>

//           {/* Dynamic Industry Alert Banner */}
//           {currentIndustryMeta && (
//             <div
//               role="region"
//               aria-live="polite"
//               className="sm:col-span-2 p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center gap-3 text-xs transition-all duration-200"
//             >
//               <div className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary shrink-0">
//                 <currentIndustryMeta.icon className="w-4 h-4" />
//               </div>
//               <div className="text-xs leading-tight">
//                 <span className="font-bold text-foreground">
//                   {currentIndustryMeta.alertTitle}:{" "}
//                 </span>
//                 <span className="text-muted">
//                   {currentIndustryMeta.alertMessage}
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Phone Number */}
//           <div className="space-y-1.5">
//             <label
//               htmlFor="store-phone"
//               className="block text-xs font-semibold text-foreground"
//             >
//               Contact Phone <span className="text-rose-500">*</span>
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
//                 <Phone className="w-4 h-4" />
//               </div>
//               <input
//                 id="store-phone"
//                 type="tel"
//                 placeholder="+254 712 345 678"
//                 aria-invalid={errors.phone ? "true" : "false"}
//                 aria-describedby={errors.phone ? "phone-error" : undefined}
//                 {...register("phone")}
//                 className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//                   errors.phone ? "border-rose-500" : "border-border"
//                 }`}
//               />
//             </div>
//             {errors.phone && (
//               <p id="phone-error" className="text-[11px] text-rose-500 font-medium">
//                 {errors.phone.message}
//               </p>
//             )}
//           </div>

//           {/* Tax Rate (%) */}
//           <div className="space-y-1.5">
//             <label
//               htmlFor="tax-rate"
//               className="block text-xs font-semibold text-foreground"
//             >
//               Tax Rate (%) <span className="text-rose-500">*</span>
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
//                 <Percent className="w-4 h-4" />
//               </div>
//               <input
//                 id="tax-rate"
//                 type="number"
//                 step="0.01"
//                 placeholder="16"
//                 aria-invalid={errors.tax_rate ? "true" : "false"}
//                 aria-describedby={errors.tax_rate ? "tax-error" : undefined}
//                 {...register("tax_rate")}
//                 className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//                   errors.tax_rate ? "border-rose-500" : "border-border"
//                 }`}
//               />
//             </div>
//             {errors.tax_rate && (
//               <p id="tax-error" className="text-[11px] text-rose-500 font-medium">
//                 {errors.tax_rate.message}
//               </p>
//             )}
//           </div>

//           {/* Physical Address */}
//           <div className="space-y-1.5 sm:col-span-2">
//             <label
//               htmlFor="store-address"
//               className="block text-xs font-semibold text-foreground"
//             >
//               Physical Address <span className="text-rose-500">*</span>
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
//                 <MapPin className="w-4 h-4" />
//               </div>
//               <input
//                 id="store-address"
//                 type="text"
//                 placeholder="e.g. Suite 4B, Kimathi Street, Nairobi"
//                 aria-invalid={errors.address ? "true" : "false"}
//                 aria-describedby={errors.address ? "address-error" : undefined}
//                 {...register("address")}
//                 className={`w-full h-11 pl-10 pr-3 text-xs rounded-xl border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//                   errors.address ? "border-rose-500" : "border-border"
//                 }`}
//               />
//             </div>
//             {errors.address && (
//               <p id="address-error" className="text-[11px] text-rose-500 font-medium">
//                 {errors.address.message}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Form Actions */}
//         <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
//           <button
//             type="button"
//             onClick={() => router.back()}
//             className="h-11 px-5 rounded-xl border border-border text-xs font-semibold text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px]"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting || !isValid}
//             className="h-11 px-6 rounded-xl bg-brand-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px]"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 <span>Provisioning...</span>
//               </>
//             ) : (
//               <>
//                 <Store className="w-4 h-4" />
//                 <span>Provision Store</span>
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

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
    alertTitle: "Standard Inventory",
    alertMessage: "Barcoding and SKU variants enabled.",
    defaultTax: 16,
  },
  PHARMACY: {
    label: "Pharmacy & Healthcare",
    icon: Pill,
    alertTitle: "Regulatory Compliance",
    alertMessage: "Batch & expiry tracking activated.",
    defaultTax: 0,
  },
  GROCERY_SUPERMARKET: {
    label: "Grocery & Supermarket",
    icon: ShoppingBag,
    alertTitle: "Produce Scaling",
    alertMessage: "Integrated scale calibration enabled.",
    defaultTax: 16,
  },
  RESTAURANT_HOSPITALITY: {
    label: "Restaurant & Hospitality",
    icon: Utensils,
    alertTitle: "Kitchen Routing",
    alertMessage: "KDS ticket routing & table management enabled.",
    defaultTax: 16,
  },
  ELECTRONICS_HARDWARE: {
    label: "Electronics & Hardware",
    icon: Laptop,
    alertTitle: "Serial Tracking",
    alertMessage: "IMEI and warranty logging enabled.",
    defaultTax: 16,
  },
  BEAUTY_WELLNESS: {
    label: "Beauty & Wellness",
    icon: Sparkles,
    alertTitle: "Service Hybrid",
    alertMessage: "Appointments & therapist commissions enabled.",
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

    try {
      const response = await fetch("/api/v1/org/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to provision store location.");
      }

      if (onSuccess) onSuccess(data);
      router.back();
    } catch {
      if (onSuccess) onSuccess(data);
      router.back();
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
              Provision New Store Outlet
            </h1>
            <p className="text-xs text-muted">
              Configure store details and POS industry rules.
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
            <span>{serverError}</span>
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
              Store / Branch Name <span className="text-rose-500">*</span>
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
                <span>Provisioning...</span>
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                <span>Provision Store</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}