"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Input,
  Label,
  Modal,
  Spinner,
} from "@/lib/components/ui";
import {
  clearPlatformSession,
  createPlatformOrganization,
  extendPlatformOrgGrace,
  getPlatformAccessToken,
  hardDeletePlatformOrganization,
  listPlatformOrganizations,
  updatePlatformOrganization,
  type PlatformOrg,
} from "@/lib/platform/auth";

/**
 * Platform organizations — list, create, edit, stats, subscriptions, hard-delete.
 */
export function PlatformOrgsPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);
  const [query, setQuery] = useState("");
  /** all | active | inactive | grace — client-side for grace; active hits API when possible */
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "grace"
  >("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editor, setEditor] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<PlatformOrg | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<PlatformOrg | null>(null);

  const [target, setTarget] = useState<PlatformOrg | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [graceTarget, setGraceTarget] = useState<PlatformOrg | null>(null);
  const [graceDays, setGraceDays] = useState(7);
  const [extendingGrace, setExtendingGrace] = useState(false);

  const load = useCallback(
    async (q?: string, filter?: typeof statusFilter) => {
      setLoading(true);
      setError(null);
      const f = filter ?? statusFilter;
      try {
        const rows = await listPlatformOrganizations({
          q: q?.trim() || undefined,
          // Server supports active only; grace is filtered client-side
          active:
            f === "active" ? true : f === "inactive" ? false : undefined,
          limit: 200,
        });
        setOrgs(rows);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          clearPlatformSession();
          router.replace("/platform/login");
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load organizations"
        );
      } finally {
        setLoading(false);
      }
    },
    [router, statusFilter]
  );

  useEffect(() => {
    if (!getPlatformAccessToken()) {
      router.replace("/platform/login");
      return;
    }
    setReady(true);
    void load();
  }, [router, load]);

  const openCreate = () => {
    setEditor("create");
    setEditTarget(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormActive(true);
    setError(null);
  };

  const openEdit = (org: PlatformOrg) => {
    setEditor("edit");
    setEditTarget(org);
    setFormName(org.name);
    setFormEmail(org.email);
    setFormPhone(org.phone || "");
    setFormAddress(org.address || "");
    setFormActive(org.active);
    setError(null);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
    setEditTarget(null);
  };

  const onSaveEditor = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      setError("Name and email are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editor === "create") {
        await createPlatformOrganization({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          active: formActive,
        });
        setSuccess("Organization created");
      } else if (editor === "edit" && editTarget) {
        await updatePlatformOrganization(editTarget.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          active: formActive,
        });
        setSuccess("Organization updated");
      }
      setEditor(null);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (org: PlatformOrg) => {
    setTarget(org);
    setConfirmName("");
    setConfirmPhrase("");
    setReason("test cleanup");
    setSuccess(null);
    setError(null);
  };

  const closeDelete = () => {
    if (deleting) return;
    setTarget(null);
  };

  const canSubmitDelete =
    target &&
    confirmName.trim() === target.name.trim() &&
    confirmPhrase.trim() === "DELETE" &&
    reason.trim().length >= 3;

  const onConfirmDelete = async () => {
    if (!target || !canSubmitDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await hardDeletePlatformOrganization(target.id, {
        confirm_name: confirmName.trim(),
        confirm_phrase: confirmPhrase.trim(),
        reason: reason.trim(),
      });
      const counts = result.pre_delete_counts || {};
      setSuccess(
        `Deleted ${result.name || target.name}. Removed sales=${counts.sales ?? 0}, staff=${counts.staff ?? 0}, businesses=${counts.businesses ?? 0}, products=${counts.products ?? 0}.`
      );
      setTarget(null);
      setDetail(null);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hard delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const visibleOrgs = useMemo(() => {
    if (statusFilter !== "grace") return orgs;
    return orgs.filter((org) =>
      (org.subscriptions ?? []).some((s) => {
        const phase = (s.access_phase || "").toLowerCase();
        if (phase === "grace") return true;
        if (!s.grace_end_date) return false;
        const t = Date.parse(s.grace_end_date);
        if (Number.isNaN(t)) return false;
        const days = Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
        return days >= 0 && days <= 14;
      })
    );
  }, [orgs, statusFilter]);

  const filteredHint = useMemo(() => {
    const n = visibleOrgs.length;
    const base = `${n} organization${n === 1 ? "" : "s"}`;
    if (statusFilter === "all" && !query.trim()) return base;
    return `${base} (filtered)`;
  }, [visibleOrgs.length, statusFilter, query]);

  const onExtendGrace = async () => {
    if (!graceTarget) return;
    if (graceDays < 1 || graceDays > 90) {
      setError("Grace days must be between 1 and 90");
      return;
    }
    const targetId = graceTarget.id;
    const targetName = graceTarget.name;
    setExtendingGrace(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await extendPlatformOrgGrace(targetId, graceDays);
      setSuccess(
        result.message ||
          `Grace extended for ${targetName} by ${graceDays} days`
      );
      setGraceTarget(null);
      await load(query);
      if (detail?.id === targetId) {
        try {
          const refreshed = await listPlatformOrganizations({ limit: 200 });
          const match = refreshed.find((o) => o.id === targetId);
          if (match) setDetail(match);
        } catch {
          /* list refresh best-effort */
        }
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Extend grace failed");
    } finally {
      setExtendingGrace(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-h3 text-foreground">Organizations</h1>
          <p className="text-sm text-muted">
            Create and update tenants, review subscriptions and usage, hard-delete
            only during a cleanup window.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          New organization
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="org-search" className="sr-only">
            Search
          </Label>
          <Input
            id="org-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(query);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/60 p-0.5">
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["inactive", "Inactive"],
              ["grace", "Grace"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                statusFilter === value
                  ? "rounded px-2.5 py-1 text-xs font-semibold bg-brand-primary/10 text-brand-primary"
                  : "rounded px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground"
              }
              onClick={() => {
                setStatusFilter(value);
                void load(query, value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load(query)}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
        <span className="text-xs text-muted">{filteredHint}</span>
      </div>

      {error ? (
        <p
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm text-foreground"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="rounded-md border border-[var(--success-border)] bg-brand-accent/10 px-3 py-2 text-sm text-foreground"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/60 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Biz</th>
                <th className="px-4 py-3 text-right">Staff</th>
                <th className="px-4 py-3 text-right">Sales</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                visibleOrgs.map((org) => {
                  const sub = org.subscriptions?.[0];
                  const subLabel =
                    sub?.plan_name ||
                    sub?.tier ||
                    (org.stats?.subscriptions
                      ? `${org.stats.subscriptions} sub(s)`
                      : "—");
                  return (
                    <tr
                      key={org.id}
                      className="border-b border-border/50 last:border-0 hover:bg-background/40"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-foreground hover:underline"
                          onClick={() => setDetail(org)}
                        >
                          {org.name}
                        </button>
                        <div className="text-xs text-muted">{org.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={org.active ? "success" : "neutral"}>
                          {org.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {org.stats?.businesses ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {org.stats?.staff ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {org.stats?.sales ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {subLabel}
                        {sub && !sub.active ? (
                          <span className="ml-1 text-[var(--error)]">off</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDetail(org)}
                          >
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openEdit(org)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openDelete(org)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit */}
      <Modal
        open={Boolean(editor)}
        onClose={closeEditor}
        title={editor === "create" ? "New organization" : "Edit organization"}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeEditor}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={saving}
              disabled={saving}
              onClick={() => void onSaveEditor()}
            >
              {editor === "create" ? "Create" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-email">Email</Label>
            <Input
              id="org-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-phone">Phone</Label>
            <Input
              id="org-phone"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-address">Address</Label>
            <Input
              id="org-address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              disabled={saving}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-border"
            />
            Active
          </label>
        </div>
      </Modal>

      {/* Detail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name || "Organization"}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
            {detail ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setGraceDays(7);
                    setGraceTarget(detail);
                  }}
                >
                  Extend grace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    openDelete(detail);
                    setDetail(null);
                  }}
                >
                  Hard delete
                </Button>
              </>
            ) : null}
          </>
        }
      >
        {detail ? (
          <div className="space-y-4 text-sm text-foreground">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd>{detail.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>{detail.phone || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Address</dt>
                <dd>{detail.address || "—"}</dd>
              </div>
            </dl>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MiniStat label="Businesses" value={detail.stats?.businesses} />
              <MiniStat label="Staff" value={detail.stats?.staff} />
              <MiniStat label="Sales" value={detail.stats?.sales} />
              <MiniStat label="Products" value={detail.stats?.products} />
              <MiniStat label="Customers" value={detail.stats?.customers} />
              <MiniStat
                label="Subscriptions"
                value={detail.stats?.subscriptions}
              />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Subscriptions
              </h3>
              {!detail.subscriptions?.length ? (
                <p className="text-muted">No subscription records.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.subscriptions.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-md border border-border/60 bg-background/50 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {s.plan_name || s.tier || "Plan"}
                        </span>
                        <Badge variant={s.active ? "success" : "neutral"}>
                          {s.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {s.start_date
                          ? `From ${new Date(s.start_date).toLocaleDateString("en-KE")}`
                          : null}
                        {s.end_date
                          ? ` · Until ${new Date(s.end_date).toLocaleDateString("en-KE")}`
                          : ""}
                        {s.grace_end_date
                          ? ` · Grace until ${new Date(s.grace_end_date).toLocaleDateString("en-KE")}`
                          : ""}
                        {s.access_phase ? ` · Phase: ${s.access_phase}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Extend grace */}
      <Modal
        open={Boolean(graceTarget)}
        onClose={() => {
          if (!extendingGrace) setGraceTarget(null);
        }}
        title={
          graceTarget
            ? `Extend grace — ${graceTarget.name}`
            : "Extend grace"
        }
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setGraceTarget(null)}
              disabled={extendingGrace}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={extendingGrace}
              disabled={extendingGrace}
              onClick={() => void onExtendGrace()}
            >
              Extend grace
            </Button>
          </>
        }
      >
        {graceTarget ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              Extends the subscription grace window so the organization can
              keep access while payment is arranged. Audited on the server.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="grace-days">Days to add (1–90)</Label>
              <Input
                id="grace-days"
                type="number"
                min={1}
                max={90}
                value={graceDays}
                onChange={(e) => setGraceDays(Number(e.target.value) || 7)}
                disabled={extendingGrace}
              />
            </div>
            {graceTarget.subscriptions?.[0]?.grace_end_date ? (
              <p className="text-xs text-muted">
                Current grace end:{" "}
                {new Date(
                  graceTarget.subscriptions[0].grace_end_date
                ).toLocaleString("en-KE")}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Destructive hard delete */}
      <Modal
        open={Boolean(target)}
        onClose={closeDelete}
        title="Permanently delete organization?"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              isLoading={deleting}
              disabled={!canSubmitDelete || deleting}
              onClick={() => void onConfirmDelete()}
              className="!bg-[var(--error)] !text-white hover:!opacity-90"
            >
              Delete forever
            </Button>
          </>
        }
      >
        {target ? (
          <div className="space-y-4 text-foreground">
            <div className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm">
              <strong>Irreversible.</strong> This removes{" "}
              <strong>{target.name}</strong> and connected tenant data (stores,
              staff, products, sales, customers, subscriptions, and related
              records). Restore is only possible from a database backup.
            </div>
            {target.stats ? (
              <p className="text-xs text-muted">
                Snapshot: {target.stats.businesses} businesses,{" "}
                {target.stats.staff} staff, {target.stats.sales} sales,{" "}
                {target.stats.products} products, {target.stats.customers}{" "}
                customers, {target.stats.subscriptions} subscriptions.
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Type the organization name exactly
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={target.name}
                autoComplete="off"
                disabled={deleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-phrase">
                Type <span className="font-mono font-semibold">DELETE</span>
              </Label>
              <Input
                id="confirm-phrase"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                disabled={deleting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason (min 3 characters)</Label>
              <Input
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="test cleanup"
                disabled={deleting}
              />
            </div>
            <p className="text-xs text-muted">
              Requires <code className="font-mono">PLATFORM_ORG_HARD_DELETE=true</code>{" "}
              and SUPER_ADMIN. Prefer soft-delete for normal product flows.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/40 px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
