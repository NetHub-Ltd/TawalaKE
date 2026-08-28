"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Organization name is required"),
  phone: z.string().min(7, "Phone is required"),
  address: z.string().min(3, "Address is required"),
  tax_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Prefill = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  tax_number?: string | null;
};

export function OrganizationDetailsForm({ prefill }: { prefill: Prefill }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prefill.name?.endsWith("-workspace") ? "" : prefill.name || "",
      phone: prefill.phone || "",
      address: prefill.address || "",
      tax_number: prefill.tax_number || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/v1/org/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || json.detail || "Update failed");
      }
      toast.success("Organization saved");
      router.replace("/org");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground" htmlFor="name">
          Organization name
        </label>
        <input
          id="name"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 focus:ring-2"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 focus:ring-2"
          {...register("phone")}
        />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground" htmlFor="address">
          Address
        </label>
        <input
          id="address"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 focus:ring-2"
          {...register("address")}
        />
        {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground" htmlFor="tax_number">
          KRA PIN (optional)
        </label>
        <input
          id="tax_number"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 focus:ring-2"
          {...register("tax_number")}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
