"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Organization name is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone is required").optional().or(z.literal("")),
  address: z.string().min(3, "Address is required").optional().or(z.literal("")),
  tax_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OrgSettingsClient({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      tax_number: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(
          `/api/v1/org?organization_id=${encodeURIComponent(organizationId)}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load organization");
        const org = await res.json();
        if (cancelled) return;
        reset({
          name: org.name || "",
          email: org.email || "",
          phone: org.phone || org.phone_number || "",
          address: org.address || "",
          tax_number: org.tax_number || "",
        });
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/v1/org/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          tax_number: data.tax_number || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.message || json.detail?.message || json.error || "Update failed",
        );
      }
      toast.success("Organization saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading organization…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 p-2 sm:p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Organization settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Legal identity for this account. Billing stays under Billing for the
          owner.
        </p>
      </div>

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        noValidate
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="org-name">
            Organization name
          </label>
          <input
            id="org-name"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="org-email">
            Email
          </label>
          <input
            id="org-email"
            type="email"
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950"
            {...register("email")}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Login email is managed with the account and is not editable here.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="org-phone">
            Phone
          </label>
          <input
            id="org-phone"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="org-address">
            Address
          </label>
          <input
            id="org-address"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            {...register("address")}
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="org-pin">
            KRA PIN
          </label>
          <input
            id="org-pin"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            {...register("tax_number")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSubmitting ? "Saving…" : "Save organization"}
        </button>
      </form>

      <p className="text-sm text-slate-500">
        Manage locations under{" "}
        <Link
          href={`/org/${organizationId}/stores`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Branches
        </Link>
        , people under{" "}
        <Link
          href={`/org/${organizationId}/staff`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Team
        </Link>
        .
      </p>
    </div>
  );
}
