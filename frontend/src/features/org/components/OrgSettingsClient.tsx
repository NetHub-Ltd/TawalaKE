"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Building2,
  CreditCard,
  Users,
  Store,
  RefreshCw,
  Shield,
  CheckCircle2,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Organization name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type OrgProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  phone_number?: string | null;
  address?: string | null;
  tax_number?: string | null;
  active?: boolean;
  onboarding?: boolean | null;
  created_at?: string | null;
};

export function OrgSettingsClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/v1/org?organization_id=${encodeURIComponent(organizationId)}`,
        { credentials: "include" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body?.error || body?.message || "Could not load organization",
        );
      }
      const org = (body?.data ?? body) as OrgProfile;
      setProfile(org);
      reset({
        name: org.name || "",
        email: org.email || "",
        phone: org.phone || org.phone_number || "",
        address: org.address || "",
        tax_number: org.tax_number || "",
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/v1/org/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          tax_number: data.tax_number?.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.message ||
            json.detail?.message ||
            json.error ||
            "Update failed",
        );
      }
      toast.success("Organization saved");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading organization settings…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-2 sm:p-4">
      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Organization settings
            </h1>
            <p className="mt-1 max-w-md text-sm text-foreground">
              Legal identity, contact details, and KRA PIN for this account.
              Plan and seats live under Billing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register dark:border-border dark:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {loadError && (
        <div
          role="alert"
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-medium">Could not load organization</p>
          <p className="mt-1 text-muted">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 text-sm font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Status strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-4 dark:border-border dark:bg-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Status
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {profile?.active === false ? (
              <span className="text-brand-secondary">Inactive</span>
            ) : (
              <span className="text-[var(--success)]">Active</span>
            )}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 dark:border-border dark:bg-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Organization ID
          </p>
          <p className="mt-1 truncate font-mono text-xs text-muted">
            {organizationId}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4 dark:border-border dark:bg-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Onboarding
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {profile?.onboarding === false ? "Complete" : "In progress"}
          </p>
        </div>
      </section>

      {/* Profile form */}
      <section className="rounded-md border border-border bg-card shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-border px-5 py-4 dark:border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Profile
          </h2>
          <p className="mt-0.5 text-xs text-foreground">
            Shown on documents and used for account contact.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 p-5"
          noValidate
        >
          <div>
            <label
              className="mb-1 block text-xs font-medium text-muted"
              htmlFor="org-name"
            >
              Organization name <span className="text-rose-500">*</span>
            </label>
            <input
              id="org-name"
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-border dark:bg-background"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[var(--error)]">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-muted"
              htmlFor="org-email"
            >
              Email
            </label>
            <input
              id="org-email"
              type="email"
              readOnly
              className="w-full cursor-not-allowed rounded-md border border-border bg-register px-3 py-2.5 text-sm text-foreground dark:border-border dark:bg-background"
              {...register("email")}
            />
            <p className="mt-1 text-xs text-muted">
              Account login email — not editable here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-xs font-medium text-muted"
                htmlFor="org-phone"
              >
                Phone
              </label>
              <input
                id="org-phone"
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-border dark:bg-background"
                placeholder="+254…"
                {...register("phone")}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium text-muted"
                htmlFor="org-pin"
              >
                KRA PIN
              </label>
              <input
                id="org-pin"
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-border dark:bg-background"
                placeholder="Optional"
                {...register("tax_number")}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-muted"
              htmlFor="org-address"
            >
              Address
            </label>
            <textarea
              id="org-address"
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 dark:border-border dark:bg-background"
              placeholder="Physical or registered address"
              {...register("address")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 dark:border-border">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--success)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedFlash ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting
                ? "Saving…"
                : savedFlash
                  ? "Saved"
                  : "Save changes"}
            </button>
            {!isDirty && !savedFlash && (
              <span className="text-xs text-muted">No unsaved changes</span>
            )}
          </div>
        </form>
      </section>

      {/* Related management */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Related
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={`/org/${organizationId}/billing`}
            className="flex items-start gap-3 rounded-md border border-border bg-card p-4 transition hover:border-border hover:bg-register dark:border-border dark:bg-card dark:hover:bg-register/80"
          >
            <CreditCard className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Billing
              </p>
              <p className="mt-0.5 text-xs text-foreground">
                Plan, usage limits, trial
              </p>
            </div>
          </Link>
          <Link
            href={`/org/${organizationId}/stores`}
            className="flex items-start gap-3 rounded-md border border-border bg-card p-4 transition hover:border-border hover:bg-register dark:border-border dark:bg-card dark:hover:bg-register/80"
          >
            <Store className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Branches
              </p>
              <p className="mt-0.5 text-xs text-foreground">
                Locations and tax rates
              </p>
            </div>
          </Link>
          <Link
            href={`/org/${organizationId}/staff`}
            className="flex items-start gap-3 rounded-md border border-border bg-card p-4 transition hover:border-border hover:bg-register dark:border-border dark:bg-card dark:hover:bg-register/80"
          >
            <Users className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Team
              </p>
              <p className="mt-0.5 text-xs text-foreground">
                Invite and branch access
              </p>
            </div>
          </Link>
        </div>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Only owners and admins can edit organization profile. Owner role is set
        at signup and cannot be reassigned.
      </p>
    </div>
  );
}
