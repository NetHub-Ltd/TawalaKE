"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import {
  fetchOrgOverrides,
  fetchPermissionCatalog,
  saveOrgDenies,
  type PermissionCatalogItem,
} from "@/features/org/lib/permissionsApi";
import { Button, Spinner } from "@/lib/components/ui";

/**
 * Owner-facing org policy: revoke permissions organization-wide.
 * Role remains the ceiling; this only DENYs within roles that include the perm.
 */
export function OrgPermissionsPolicy() {
  const { role, isLoading: sessionLoading } = usePermissions();
  const isOwner = (role || "").toUpperCase() === "OWNER";

  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [denied, setDenied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, overrides] = await Promise.all([
        fetchPermissionCatalog(),
        fetchOrgOverrides(),
      ]);
      setCatalog(cat);
      setDenied(
        new Set(
          overrides
            .filter((o) => o.effect === "DENY")
            .map((o) => o.permission_code)
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionCatalogItem[]>();
    for (const item of catalog) {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const toggle = (code: string) => {
    setDenied((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setMsg(null);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await saveOrgDenies(Array.from(denied));
      setMsg("Organization policy saved. Team members will pick this up on their next permission refresh.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted">
        <Spinner /> Loading permissions…
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted">
        Only the organization <strong className="text-foreground">Owner</strong> can
        change organization-wide permission policy. You can still review the catalog
        below if you have team access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-h3 text-foreground">Permission policy</h1>
        <p className="max-w-2xl text-sm text-muted">
          Each role (Owner, Admin, Manager, Cashier) has a default set of permissions.
          You cannot give someone access outside their role. You <em>can</em> turn off
          a permission for the whole organization, then optionally restore it for
          individual people on their Team profile.
        </p>
        <p className="max-w-2xl text-sm text-muted">
          <strong className="text-foreground">Checked = allowed by default.</strong>{" "}
          Uncheck to revoke that capability for everyone in the organization (Owner is
          never restricted).
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-md border border-border bg-register px-3 py-2 text-sm text-foreground">
          {msg}
        </p>
      ) : null}

      {groups.map(([group, items]) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {group}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {items.map((item) => {
              const allowed = !denied.has(item.code);
              return (
                <li key={item.code} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="font-mono text-xs text-muted">{item.code}</span>
                    </div>
                    <p className="text-sm text-muted">{item.description}</p>
                    <p className="text-xs text-muted">
                      Affects: {item.resources.join(" · ")}
                    </p>
                    <p className="text-xs text-muted">
                      Roles that include this by default:{" "}
                      {item.default_roles.join(", ") || "—"}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={allowed}
                      onChange={() => toggle(item.code)}
                    />
                    <span className={allowed ? "text-foreground" : "text-brand-secondary"}>
                      {allowed ? "Allowed" : "Revoked for org"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="flex gap-2">
        <Button type="button" variant="primary" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Saving…" : "Save organization policy"}
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={() => void load()}>
          Reset
        </Button>
      </div>
    </div>
  );
}
