"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, RefreshCw, Store } from "lucide-react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";

type Branch = {
  id: string;
  name: string;
  active?: boolean;
  tax_rate?: number | null;
  address?: string | null;
  phone?: string | null;
};

export default function StoresListPage() {
  const params = useParams();
  const organizationId = params?.organizationId as string;
  const { can } = usePermissions();
  const canWrite = can(Permission.ORG_WRITE);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/org/stores", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load branches");
      const body = await res.json();
      setBranches(Array.isArray(body) ? body : body?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [organizationId]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-2 sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Branches</h1>
          <p className="text-sm text-slate-500">
            {branches.length} location{branches.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canWrite && (
            <Link
              href={`/org/${organizationId}/stores/new`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New branch
            </Link>
          )}
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && branches.length === 0 ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : branches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Store className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium">No branches yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Tax</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{b.name}</p>
                    {b.address && (
                      <p className="text-xs text-slate-500">{b.address}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.tax_rate != null ? `${b.tax_rate}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.active === false
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {b.active === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/org/${organizationId}/${b.id}/overview`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
