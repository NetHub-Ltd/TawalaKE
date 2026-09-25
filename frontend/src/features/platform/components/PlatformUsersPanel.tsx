"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  createPlatformUser,
  getPlatformAccessToken,
  listPlatformUsers,
  updatePlatformUser,
  type PlatformRole,
  type PlatformUser,
} from "@/lib/platform/auth";

const ROLES: PlatformRole[] = [
  "SUPER_ADMIN",
  "SUPPORT",
  "BILLING",
  "AUDITOR",
];

/**
 * Platform operators — list, invite, role / active / force password change.
 */
export function PlatformUsersPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<PlatformRole>("SUPPORT");
  const [inviting, setInviting] = useState(false);

  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<PlatformRole>("SUPPORT");
  const [editActive, setEditActive] = useState(true);
  const [editForcePw, setEditForcePw] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPlatformUsers();
      setUsers(rows);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      if (status === 403) {
        setError(
          "You do not have permission to list operators (platform:users:read)."
        );
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load operators");
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

  const openInvite = () => {
    setInviteEmail("");
    setInviteName("");
    setInviteRole("SUPPORT");
    setInviteOpen(true);
    setError(null);
  };

  const onInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setError("Email and full name are required");
      return;
    }
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await createPlatformUser({
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        role: inviteRole,
        active: true,
      });
      setSuccess(
        `Invite sent to ${inviteEmail.trim()}. They must change password on first login.`
      );
      setInviteOpen(false);
      await load();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      if (status === 403) {
        setError("You do not have permission to invite operators.");
        return;
      }
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (u: PlatformUser) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditRole(u.role);
    setEditActive(u.active);
    setEditForcePw(false);
    setError(null);
  };

  const onSaveEdit = async () => {
    if (!editUser) return;
    if (!editName.trim()) {
      setError("Full name is required");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body: {
        full_name: string;
        role: PlatformRole;
        active: boolean;
        password?: string;
      } = {
        full_name: editName.trim(),
        role: editRole,
        active: editActive,
      };
      // Server forces must_change_password when password is set; generate a
      // temporary one only when the operator explicitly requests a force-reset.
      if (editForcePw) {
        body.password = `Tmp!${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      }
      await updatePlatformUser(editUser.id, body);
      setSuccess(
        editForcePw
          ? `Updated ${editName.trim()} and forced password change.`
          : `Updated ${editName.trim()}.`
      );
      setEditUser(null);
      await load();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      if (status === 403) {
        setError("You do not have permission to update this operator.");
        return;
      }
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
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
          <h1 className="text-h3 text-foreground">Operators</h1>
          <p className="text-sm text-muted">
            Platform users only — separate from store staff. Invite sends a
            temporary password by email.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openInvite}>
          Invite operator
        </Button>
      </header>

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

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner />
          <span className="text-sm">Loading operators…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted">
          No platform operators found. Invite the first SUPER_ADMIN or SUPPORT
          user to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-background/50 text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.full_name}
                      {u.must_change_password ? (
                        <span className="ml-2 text-xs text-muted">
                          (must change password)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.active ? "success" : "neutral"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString("en-KE")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => {
          if (!inviting) setInviteOpen(false);
        }}
        title="Invite operator"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteOpen(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={inviting}
              disabled={inviting}
              onClick={() => void onInvite()}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Full name</Label>
            <Input
              id="invite-name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              disabled={inviting}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as PlatformRole)}
              disabled={inviting}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted">
            A temporary password is emailed. The user must change it on first
            login. Only SUPER_ADMIN can create SUPER_ADMIN.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(editUser)}
        onClose={() => {
          if (!saving) setEditUser(null);
        }}
        title={editUser ? `Edit ${editUser.email}` : "Edit operator"}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditUser(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={saving}
              disabled={saving}
              onClick={() => void onSaveEdit()}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editUser ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as PlatformRole)}
                disabled={saving}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-border"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForcePw}
                onChange={(e) => setEditForcePw(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-border"
              />
              Force password change on next login
            </label>
            <p className="text-xs text-muted">
              Force password change sets a new temporary password server-side
              and requires the operator to change it after sign-in.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
