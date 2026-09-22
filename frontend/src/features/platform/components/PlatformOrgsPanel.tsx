"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  Badge,
} from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
  hardDeletePlatformOrganization,
  listPlatformOrganizations,
  type PlatformOrg,
} from "@/lib/platform/auth";

/**
 * Platform orgs list + hard-delete friction modal (issue #300).
 * Requires PLATFORM_ORG_HARD_DELETE=true and SUPER_ADMIN for delete to succeed.
 */
export function PlatformOrgsPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [target, setTarget] = useState<PlatformOrg | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPlatformOrganizations({
        q: q?.trim() || undefined,
        limit: 100,
      });
      setOrgs(rows);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getPlatformAccessToken()) {
      router.replace("/platform/login");
      return;
    }
    setReady(true);
    void load();
  }, [router, load]);

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
      setSuccess(
        `Deleted “${result.name || target.name}” (sales: ${result.pre_delete_counts?.sales ?? "—"}, staff: ${result.pre_delete_counts?.staff ?? "—"}).`
      );
      setTarget(null);
      await load(query);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed. Flag may be off or role insufficient."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner size="sm" />
        <span className="text-sm">Checking session…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-h3 text-foreground">Organizations</h1>
          <p className="text-sm text-muted">
            Cross-tenant list for platform operators. Hard delete is irreversible
            and requires the server flag{" "}
            <span className="tabular font-mono text-xs">PLATFORM_ORG_HARD_DELETE</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/platform")}
          >
            Console
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearPlatformSession();
              router.replace("/platform/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void load(query);
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search organizations"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setQuery("");
            void load("");
          }}
        >
          Refresh
        </Button>
      </form>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" /> Loading…
        </div>
      ) : orgs.length === 0 ? (
        <p className="text-sm text-muted">No organizations found.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {orgs.map((org) => (
            <li
              key={org.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {org.name}
                  </span>
                  <Badge variant={org.active ? "success" : "neutral"}>
                    {org.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted">{org.email}</p>
                <p className="text-xs text-muted tabular">
                  {org.id}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openDelete(org)}
              >
                Hard delete
              </Button>
            </li>
          ))}
        </ul>
      )}

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
            >
              Delete forever
            </Button>
          </>
        }
      >
        {target ? (
          <div className="space-y-4 text-foreground">
            <p>
              This removes{" "}
              <strong className="text-foreground">{target.name}</strong> and
              related tenant data. It cannot be undone from this console.
            </p>
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
                Type <span className="font-mono">DELETE</span>
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
              <Label htmlFor="delete-reason">Reason</Label>
              <Input
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="test cleanup"
                disabled={deleting}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
