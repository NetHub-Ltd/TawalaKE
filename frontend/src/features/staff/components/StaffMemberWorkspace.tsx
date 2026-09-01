"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useStaffMember,
  useUpdateStaff,
  useSetStaffBusinesses,
  useResetStaffPassword,
  useStaffActivity,
} from "@/features/staff/hooks/useStaff";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission, STAFF_ROLES, StaffRoleName } from "@/lib/rbac";
import {
  ArrowLeft,
  Loader2,
  KeyRound,
  Building2,
  Shield,
  UserX,
  UserCheck,
  AlertCircle,
} from "lucide-react";

function roleBadge(role: string) {
  const styles: Record<string, string> = {
    OWNER: "bg-violet-500/10 text-violet-700 border-violet-500/25",
    ADMIN: "bg-sky-500/10 text-sky-700 border-sky-500/25",
    MANAGER: "bg-amber-500/10 text-amber-700 border-amber-500/25",
    CASHIER: "bg-slate-500/10 text-slate-700 border-slate-500/25",
  };
  return styles[role] || styles.CASHIER;
}

type Tab = "overview" | "access" | "security" | "activity";

export default function StaffMemberWorkspace({
  organizationId,
  staffId,
}: {
  organizationId: string;
  staffId: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const tabParam = (search.get("tab") as Tab) || "overview";
  const action = search.get("action");

  const { can, role: actorRole } = usePermissions();
  const canManage = can(Permission.ORG_STAFF_MANAGE);

  const { data: member, isLoading, isError, error, refetch } = useStaffMember(
    organizationId,
    staffId,
  );
  const updateMut = useUpdateStaff(organizationId);
  const assignMut = useSetStaffBusinesses(organizationId);
  const resetMut = useResetStaffPassword(organizationId);
  const { data: activity = [], isLoading: activityLoading } = useStaffActivity(
    organizationId,
    staffId,
  );
  const { businesses } = useBusiness(organizationId);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [selectedBiz, setSelectedBiz] = useState<string[]>([]);
  const [tempPassword, setTempPassword] = useState("");

  React.useEffect(() => {
    if (member) {
      setNewRole(String(member.role).toUpperCase());
      setSelectedBiz((member.assigned_businesses || []).map((b) => b.id));
    }
  }, [member]);

  const setTab = (t: Tab) => {
    router.replace(`/org/${organizationId}/staff/${staffId}?tab=${t}`);
  };

  const setAction = (a: string | null) => {
    const base = `/org/${organizationId}/staff/${staffId}?tab=${tabParam}`;
    router.replace(a ? `${base}&action=${a}` : base);
  };

  const storeNames = useMemo(
    () => (member?.assigned_businesses || []).map((b) => b.name).join(", ") || "—",
    [member],
  );

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-slate-600">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="text-sm">You do not have permission to view this workspace.</p>
        <Link href={`/org/${organizationId}/staff`} className="text-sm text-emerald-600">
          Back to Team
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading member…
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="p-6">
        <Link
          href={`/org/${organizationId}/staff`}
          className="inline-flex items-center gap-1 text-sm text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Team
        </Link>
        <p className="mt-4 text-sm text-red-600">
          {error instanceof Error ? error.message : "Staff not found"}
        </p>
      </div>
    );
  }

  const role = String(member.role).toUpperCase();

  const saveRole = async () => {
    setErr(null);
    setMsg(null);
    try {
      await updateMut.mutateAsync({
        staffId,
        role: newRole as StaffRoleName,
      });
      setMsg("Role updated");
      setAction(null);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  };

  const saveStores = async () => {
    setErr(null);
    setMsg(null);
    try {
      await assignMut.mutateAsync({ staffId, business_ids: selectedBiz });
      setMsg("Store access updated");
      setAction(null);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  };

  const toggleActive = async () => {
    setErr(null);
    setMsg(null);
    try {
      await updateMut.mutateAsync({ staffId, active: !member.active });
      setMsg(member.active ? "Member deactivated" : "Member reactivated");
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  };

  const resetPassword = async () => {
    setErr(null);
    setMsg(null);
    try {
      await resetMut.mutateAsync({ staffId, password: tempPassword });
      setMsg("Password updated");
      setTempPassword("");
      setAction(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reset failed");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
      <div>
        <Link
          href={`/org/${organizationId}/staff`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Team
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {member.full_name}
            </h1>
            <p className="text-sm text-slate-500">{member.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${roleBadge(role)}`}
              >
                {role}
              </span>
              <span className={member.active ? "text-emerald-600" : "text-slate-400"}>
                {member.active ? "Active" : "Inactive"}
              </span>
              <span className="text-slate-500">{storeNames}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex gap-4 border-b border-slate-200 text-sm dark:border-slate-800">
        {(
          [
            ["overview", "Overview"],
            ["access", "Access"],
            ["security", "Security"],
            ["activity", "Activity"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`border-b-2 pb-2 font-medium ${
              tabParam === id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {(msg || err) && (
        <div
          className={`rounded-xl px-3 py-2 text-sm ${
            err ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {err || msg}
        </div>
      )}

      {tabParam === "overview" && !action && (
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-xs text-slate-500">Role</div>
              <div className="mt-1 font-semibold">{role}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-xs text-slate-500">Stores</div>
              <div className="mt-1 font-semibold">
                {member.assigned_businesses?.length ?? 0} assigned
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-xs text-slate-500">Status</div>
              <div className="mt-1 font-semibold">
                {member.active ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-xs text-slate-500">Email</div>
              <div className="mt-1 truncate text-sm font-medium">{member.email}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Quick actions
            </p>
            <button
              type="button"
              onClick={() => {
                setTab("access");
                setAction("role");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700"
            >
              <Shield className="h-4 w-4 text-emerald-600" /> Change role
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("access");
                setAction("assign");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700"
            >
              <Building2 className="h-4 w-4 text-emerald-600" /> Assign stores
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("security");
                setAction("reset-password");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700"
            >
              <KeyRound className="h-4 w-4 text-emerald-600" /> Reset password
            </button>
            <button
              type="button"
              onClick={toggleActive}
              disabled={updateMut.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700"
            >
              {member.active ? (
                <UserX className="h-4 w-4 text-amber-600" />
              ) : (
                <UserCheck className="h-4 w-4 text-emerald-600" />
              )}
              {member.active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 lg:col-span-2 dark:border-slate-800">
            Activity history (events on this member and actions they performed) arrives in a later phase.
          </div>
        </div>
      )}

      {(tabParam === "access" || action === "role" || action === "assign") && (
        <div className="max-w-lg space-y-6">
          {(action === "role" || tabParam === "access") && (
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h2 className="font-semibold">Change role</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current: {role}. Only OWNER may assign OWNER.
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {STAFF_ROLES.filter(
                  (r) => r !== "OWNER" || actorRole === "OWNER" || role === "OWNER",
                ).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveRole}
                disabled={updateMut.isPending || newRole === role}
                className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save role change
              </button>
            </section>
          )}

          {(action === "assign" || tabParam === "access") && (
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h2 className="font-semibold">Assign stores</h2>
              <div className="mt-3 max-h-48 space-y-2 overflow-auto text-sm">
                {(businesses || []).map((b: { id: string; name: string }) => (
                  <label key={b.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBiz.includes(b.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBiz((prev) => [...prev, b.id]);
                        } else {
                          setSelectedBiz((prev) => prev.filter((id) => id !== b.id));
                        }
                      }}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={saveStores}
                disabled={assignMut.isPending}
                className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save assignments
              </button>
            </section>
          )}
        </div>
      )}

      {(tabParam === "security" || action === "reset-password") && (
        <section className="max-w-lg rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-semibold">Reset password</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sets a temporary password. Invite-by-email is planned next.
          </p>
          <input
            type="password"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            placeholder="New temporary password"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="button"
            onClick={resetPassword}
            disabled={resetMut.isPending || tempPassword.length < 8}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {resetMut.isPending ? "Saving…" : "Update password"}
          </button>
        </section>
      )}
      {tabParam === "activity" && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Activity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Actions taken on this member (create, role, stores, password, status).
          </p>
          {activityLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading activity…</p>
          ) : activity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No recorded actions yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-col gap-0.5 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {a.action}
                    </span>
                    <span className="text-xs text-slate-400">
                      {a.created_at
                        ? new Date(a.created_at).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {a.actor_email || "System"}
                    {a.actor_role ? ` · ${a.actor_role}` : ""}
                    {a.outcome ? ` · ${a.outcome}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

    </div>
  );
}
