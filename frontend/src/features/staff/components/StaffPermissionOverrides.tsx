"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import {
  fetchPermissionCatalog,
  fetchStaffOverrides,
  saveStaffOverrides,
  type PermissionCatalogItem,
} from "@/features/org/lib/permissionsApi";
import { Button, Spinner } from "@/lib/components/ui";

type Effect = "DEFAULT" | "DENY" | "GRANT";

/**
 * Per-staff revoke/restore within role ceiling. Owner only for writes.
 */
export function StaffPermissionOverrides({
  organizationId: _organizationId,
  staffId,
}: {
  organizationId: string;
  staffId: string;
}) {
  const { role: actorRole } = usePermissions();
  const isOwner = (actorRole || "").toUpperCase() === "OWNER";

  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [orgDenies, setOrgDenies] = useState<Set<string>>(new Set());
  const [effects, setEffects] = useState<Record<string, Effect>>({});
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, data] = await Promise.all([
        fetchPermissionCatalog(),
        fetchStaffOverrides(staffId),
      ]);
      setCatalog(cat);
      setStaffRole(data.role);
      setRolePerms(data.role_permissions || []);
      setOrgDenies(new Set(data.org_denies || []));
      const map: Record<string, Effect> = {};
      for (const o of data.overrides || []) {
        map[o.permission_code] =
          o.effect === "GRANT" ? "GRANT" : o.effect === "DENY" ? "DENY" : "DEFAULT";
      }
      setEffects(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const inRole = rolePerms;

  const setEffect = (code: string, effect: Effect) => {
    setEffects((prev) => {
      const next = { ...prev };
      if (effect === "DEFAULT") delete next[code];
      else next[code] = effect;
      return next;
    });
    setMsg(null);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const overrides = Object.entries(effects)
        .filter(([, e]) => e === "DENY" || e === "GRANT")
        .map(([permission_code, effect]) => ({ permission_code, effect }));
      await saveStaffOverrides(staffId, overrides);
      setMsg("Saved. Effective access updates on their next permission refresh.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-muted">
        <Spinner /> Loading permissions…
      </div>
    );
  }

  if ((staffRole || "").toUpperCase() === "OWNER") {
    return (
      <p className="text-sm text-muted">
        The organization Owner always has full access. Their permissions cannot be
        limited.
      </p>
    );
  }

  const items = catalog.filter((c) => inRole.includes(c.code));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground">Access for this person</h2>
        <p className="mt-1 text-sm text-muted">
          Role <span className="font-medium text-foreground">{staffRole}</span> defines
          the maximum they can have. You may revoke individual permissions or restore
          one that the organization policy revoked. You cannot grant access outside
          this role.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--error)]" role="alert">
          {error}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-foreground">{msg}</p> : null}

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((item) => {
          const orgDenied = orgDenies.has(item.code);
          const effect = effects[item.code] || "DEFAULT";
          return (
            <li key={item.code} className="space-y-2 px-4 py-3">
              <div className="font-medium text-foreground">{item.label}</div>
              <p className="text-sm text-muted">{item.description}</p>
              <p className="text-xs text-muted">
                Affects: {item.resources.join(" · ")}
              </p>
              {orgDenied ? (
                <p className="text-xs text-brand-secondary">
                  Organization policy currently revokes this for everyone.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["DEFAULT", "Role default"],
                    ["DENY", "Revoke for this person"],
                    ["GRANT", "Allow for this person"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
                  >
                    <input
                      type="radio"
                      name={`eff-${item.code}`}
                      checked={effect === value}
                      disabled={!isOwner}
                      onChange={() => setEffect(item.code, value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No permissions on this role.</p>
      ) : null}

      {isOwner ? (
        <Button type="button" variant="primary" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Saving…" : "Save access for this person"}
        </Button>
      ) : (
        <p className="text-xs text-muted">Only the Owner can change these settings.</p>
      )}
    </div>
  );
}
