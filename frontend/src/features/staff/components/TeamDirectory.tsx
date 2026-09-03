"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStaff,
  useCreateStaff,
  StaffMember,
} from "@/features/staff/hooks/useStaff";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission, STAFF_ROLES, StaffRoleName } from "@/lib/rbac";
import {
  UserPlus,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBusiness } from "@/features/business/hooks/useBusiness";

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "CASHIER"]),
  business_ids: z.array(z.string()).min(1, "Assign at least one business"),
});

type CreateValues = z.infer<typeof createSchema>;

function roleBadge(role: string) {
  const styles: Record<string, string> = {
    OWNER: "bg-violet-500/10 text-violet-700 border-violet-500/25",
    ADMIN: "bg-sky-500/10 text-sky-700 border-sky-500/25",
    MANAGER: "bg-amber-500/10 text-amber-700 border-amber-500/25",
    CASHIER: "bg-slate-500/10 text-slate-700 border-slate-500/25",
  };
  return styles[role] || styles.CASHIER;
}

export default function TeamDirectory({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const { can, role: actorRole } = usePermissions();
  const canManage = can(Permission.ORG_STAFF_MANAGE);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { staff, isLoading, isFetching, isError, error, refetch } =
    useStaff(organizationId);
  const createMut = useCreateStaff(organizationId);
  const { businesses } = useBusiness(organizationId);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "CASHIER",
      business_ids: [],
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((s) => {
      if (roleFilter !== "ALL" && String(s.role).toUpperCase() !== roleFilter) {
        return false;
      }
      if (statusFilter === "ACTIVE" && !s.active) return false;
      if (statusFilter === "INACTIVE" && s.active) return false;
      if (!q) return true;
      return (
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    });
  }, [staff, search, roleFilter, statusFilter]);

  const openWorkspace = (member: StaffMember) => {
    router.push(`/org/${organizationId}/staff/${member.id}`);
  };

  const onCreate = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const created = await createMut.mutateAsync({
        ...values,
        role: values.role as StaffRoleName,
        organization_id: organizationId,
      });
      setShowCreate(false);
      createForm.reset();
      if (created?.id) {
        router.push(`/org/${organizationId}/staff/${created.id}`);
      } else {
        refetch();
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create staff");
    }
  });

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-slate-600">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium">You do not have permission to manage team members.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Team
          </h1>
          <p className="text-sm text-slate-500">
            {staff.length} member{staff.length === 1 ? "" : "s"} · click a row to open workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="ALL">All roles</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading team…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load staff"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 p-12 text-slate-500">
          <Users className="h-8 w-8" />
          <p className="text-sm font-medium">No team members match</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Stores</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openWorkspace(s)}
                  className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {s.full_name}
                    </div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadge(String(s.role).toUpperCase())}`}
                    >
                      {String(s.role).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {s.assigned_businesses?.length
                      ? s.assigned_businesses.map((b) => b.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.active
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {s.active ? "Active" : "Pending invite"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Invite member</h2>
            <p className="mt-1 text-sm text-slate-500">
              We will email them a secure link to set their own password (expires in 48 hours).
            </p>
            <form onSubmit={onCreate} className="mt-4 space-y-3">
              <input
                {...createForm.register("full_name")}
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                {...createForm.register("email")}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <select
                {...createForm.register("role")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {STAFF_ROLES.filter(
                  (r) => r !== "OWNER" || actorRole === "OWNER",
                ).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="max-h-32 space-y-1 overflow-auto rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700">
                {(businesses || []).map((b: { id: string; name: string }) => (
                  <label key={b.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={b.id}
                      onChange={(e) => {
                        const cur = createForm.getValues("business_ids") || [];
                        if (e.target.checked) {
                          createForm.setValue("business_ids", [...cur, b.id]);
                        } else {
                          createForm.setValue(
                            "business_ids",
                            cur.filter((id) => id !== b.id),
                          );
                        }
                      }}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl px-3 py-2 text-sm text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {createMut.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}