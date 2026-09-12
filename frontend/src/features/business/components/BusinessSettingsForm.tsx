"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { Loader2, Save, ShieldAlert } from "lucide-react";

type BranchProfile = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  tax_rate?: number | null;
  active?: boolean;
  config?: {
    receipt_footer?: string;
    show_tax_on_receipt?: boolean;
  } | null;
};

export function BusinessSettingsForm() {
  const params = useParams();
  const organizationId = params?.organizationId as string;
  const businessId = params?.businessId as string;
  const { can } = usePermissions();
  const canEdit = can(Permission.STOCK_ADJUST) || can(Permission.ORG_WRITE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [active, setActive] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState("");
  const [showTax, setShowTax] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Prefer dedicated GET; fall back to pos-config + list
        const res = await fetch(`/api/v1/org/stores/${businessId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const b = (await res.json()) as BranchProfile;
          if (cancelled) return;
          setName(b.name || "");
          setPhone(b.phone || "");
          setAddress(b.address || "");
          setTaxRate(String(b.tax_rate ?? 0));
          setActive(b.active !== false);
          setReceiptFooter(b.config?.receipt_footer || "");
          setShowTax(b.config?.show_tax_on_receipt !== false);
        } else {
          const pos = await fetch(
            `/api/v1/org/stores/${businessId}/pos-config`,
            { credentials: "include" },
          );
          if (pos.ok) {
            const cfg = await pos.json();
            const data = cfg?.data ?? cfg;
            if (!cancelled) {
              setTaxRate(String(data?.tax_rate ?? 0));
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (businessId) void load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const tax = Number(taxRate);
      if (Number.isNaN(tax) || tax < 0 || tax > 100) {
        setError("Tax rate must be between 0 and 100");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/v1/org/stores/${businessId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || null,
          address: address.trim() || null,
          tax_rate: tax,
          active,
          config: {
            receipt_footer: receiptFooter.trim(),
            show_tax_on_receipt: showTax,
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          body?.error ||
            body?.detail?.message ||
            body?.message ||
            "Could not save settings",
        );
        return;
      }
      setMsg("Branch settings saved. POS tax updates on next cart load.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading branch settings…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-2 sm:p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Branch settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tax rate feeds the terminal. Receipt footer prints on documents.
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          You can view these settings but need manager access to edit them.
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Branch name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tax rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Receipt footer
          </label>
          <textarea
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            disabled={!canEdit}
            rows={3}
            placeholder="Thank you for shopping with us"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={showTax}
            onChange={(e) => setShowTax(e.target.checked)}
            disabled={!canEdit}
            className="rounded border-slate-300"
          />
          Show tax line on receipts
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={!canEdit}
            className="rounded border-slate-300"
          />
          Branch active
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {msg && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {msg}
          </p>
        )}

        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save settings"}
          </button>
        )}
      </form>

      <p className="text-xs text-slate-500">
        Organization billing and team live under{" "}
        <Link
          href={`/org/${organizationId}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Org home
        </Link>
        .
      </p>
    </div>
  );
}
