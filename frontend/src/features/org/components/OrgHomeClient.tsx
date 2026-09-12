"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, Package, ArrowRight, Plus, RefreshCw } from "lucide-react";

type Entitlements = {
  plan_code?: string;
  plan_name?: string;
  active?: boolean;
  trial?: boolean;
  limits?: Record<string, number | null | undefined>;
  usage?: Record<string, number | undefined>;
};

type Branch = {
  id: string;
  name: string;
  active?: boolean;
  tax_rate?: number | null;
  address?: string | null;
  phone?: string | null;
};

function Meter({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number | null | undefined;
}) {
  const pct =
    max != null && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const hot = max != null && current >= max;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {max != null ? `${current} / ${max}` : current}
        </p>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      {max != null && max > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${hot ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function OrgHomeClient({
  organizationId,
  canManageBranches,
  canBilling,
}: {
  organizationId: string;
  canManageBranches: boolean;
  canBilling: boolean;
}) {
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, eRes] = await Promise.all([
        fetch("/api/v1/org/stores", { credentials: "include" }),
        fetch("/api/v1/org/entitlements", { credentials: "include" }).catch(
          () => null,
        ),
      ]);
      if (bRes.ok) {
        const body = await bRes.json();
        const list = Array.isArray(body) ? body : body?.data ?? [];
        setBranches(list);
      } else {
        setBranches([]);
      }
      if (eRes && eRes.ok) {
        const body = await eRes.json();
        setEnt(body?.data ?? body);
      } else {
        // fallback subscription surface
        const sub = await fetch("/api/v1/org/subscription", {
          credentials: "include",
        }).catch(() => null);
        if (sub && sub.ok) {
          const body = await sub.json();
          setEnt(body?.data ?? body);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load org home");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [organizationId]);

  const usage = ent?.usage || {};
  const limits = ent?.limits || {};
  const bizCur = Number(usage.max_businesses ?? usage.businesses ?? branches.length ?? 0);
  const staffCur = Number(usage.max_staff ?? usage.staff ?? 0);
  const prodCur = Number(usage.max_products ?? usage.products ?? 0);
  const bizMax = limits.max_businesses as number | null | undefined;
  const staffMax = limits.max_staff as number | null | undefined;
  const prodMax = limits.max_products as number | null | undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Organization home
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {ent?.plan_name || ent?.plan_code || "Plan"}
            {ent?.trial ? " · Trial" : ""}
            {ent?.active === false ? " · Inactive" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canManageBranches && (
            <Link
              href={`/org/${organizationId}/stores/new`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              New branch
            </Link>
          )}
        </div>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Meter label="Branches" current={bizCur} max={bizMax} />
        <Meter label="Staff seats" current={staffCur} max={staffMax} />
        <Meter label="Products" current={prodCur} max={prodMax} />
      </section>

      {canBilling && (
        <p className="text-sm text-slate-500">
          Manage plan on{" "}
          <Link
            href={`/org/${organizationId}/billing`}
            className="font-semibold text-emerald-700 hover:underline"
          >
            Billing
          </Link>
          .
        </p>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Branches
          </h2>
          <Link
            href={`/org/${organizationId}/stores`}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            View all
          </Link>
        </div>
        {loading && branches.length === 0 ? (
          <p className="text-sm text-slate-500">Loading branches…</p>
        ) : branches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
            <Building2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No branches yet</p>
            {canManageBranches && (
              <Link
                href={`/org/${organizationId}/stores/new`}
                className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
              >
                Create your first branch
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {branches.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {b.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.active === false ? "Inactive · " : "Active · "}
                    Tax {b.tax_rate != null ? `${b.tax_rate}%` : "—"}
                    {b.address ? ` · ${b.address}` : ""}
                  </p>
                </div>
                <Link
                  href={`/org/${organizationId}/${b.id}/overview`}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          href={`/org/${organizationId}/staff`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
        >
          <Users className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-sm font-semibold">Team</p>
            <p className="text-xs text-slate-500">Invite and assign branches</p>
          </div>
        </Link>
        <Link
          href={`/org/${organizationId}/stores`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80"
        >
          <Package className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-sm font-semibold">Branch directory</p>
            <p className="text-xs text-slate-500">All locations and create</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
