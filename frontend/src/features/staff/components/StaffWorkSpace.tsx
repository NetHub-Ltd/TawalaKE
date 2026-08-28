"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useSetStaffBusinesses,
  useResetStaffPassword,
  StaffMember,
} from "@/features/staff/hooks/useStaff";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission, STAFF_ROLES, StaffRoleName } from "@/lib/rbac";
import {
  UserPlus,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  Users,
  ShieldCheck,
  X,
  KeyRound,
  Building2,
} from "lucide-react";

const passwordSchema = z
  .string()
  .min(8, "Min 8 characters")
  .regex(/[A-Z]/, "Need uppercase")
  .regex(/[a-z]/, "Need lowercase")
  .regex(/[0-9]/, "Need a number");

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  password: passwordSchema,
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

export default function StaffWorkspace() {
  const { businessId, organizationId } = useBusinessContext();
  const { can, role: actorRole } = usePermissions();
  const canManage = can(Permission.ORG_STAFF_MANAGE);

  const orgId = Array.isArray(organizationId)
    ? organizationId[0]
    : organizationId || "";
  const currentBiz = Array.isArray(businessId) ? businessId[0] : businessId || "";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { staff, isLoading, isFetching, isError, error, refetch } =
    useStaff(orgId);
  const createMut = useCreateStaff(orgId);
  const updateMut = useUpdateStaff(orgId);
  const assignMut = useSetStaffBusinesses(orgId);
  const resetMut = useResetStaffPassword(orgId);

  const creatableRoles = useMemo(() => {
    if (actorRole === "OWNER") return STAFF_ROLES;
    return STAFF_ROLES.filter((r) => r !== "OWNER");
  }, [actorRole]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      role: "CASHIER",
      full_name: "",
      email: "",
      password: "",
      business_ids: currentBiz ? [currentBiz] : [],
    },
  });

  const selectedBizIds = watch("business_ids") || [];

  const filtered = useMemo(() => {
    return staff.filter((m) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q);
      const matchR = roleFilter === "ALL" || m.role === roleFilter;
      return matchQ && matchR;
    });
  }, [staff, search, roleFilter]);

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <AlertCircle className="text-amber-600" size={28} />
        <h2 className="text-base font-semibold">Staff management restricted</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You need the <code className="text-xs">org:staff:manage</code>{" "}
          permission (Owner or Admin).
        </p>
      </div>
    );
  }

  const onCreate = async (values: CreateValues) => {
    setFormError(null);
    try {
      await createMut.mutateAsync({
        ...values,
        role: values.role as StaffRoleName,
        organization_id: orgId || undefined,
      });
      reset({
        role: "CASHIER",
        full_name: "",
        email: "",
        password: "",
        business_ids: currentBiz ? [currentBiz] : [],
      });
      setShowCreate(false);
      refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Create failed");
    }
  };

  const toggleActive = async (m: StaffMember) => {
    try {
      await updateMut.mutateAsync({ staffId: m.id, active: !m.active });
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    }
  };

  const changeRole = async (m: StaffMember, role: StaffRoleName) => {
    try {
      await updateMut.mutateAsync({ staffId: m.id, role });
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Role change failed");
    }
  };

  const resetPassword = async (m: StaffMember) => {
    const password = window.prompt(
      `New password for ${m.full_name} (min 8 chars, mixed case + number)`,
    );
    if (!password) return;
    try {
      await resetMut.mutateAsync({ staffId: m.id, password });
      alert("Password updated");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset failed");
    }
  };

  const ensureCurrentBiz = async (m: StaffMember) => {
    if (!currentBiz) return;
    const ids = (m.assigned_businesses || []).map((b) => b.id);
    if (ids.includes(currentBiz)) {
      alert("Already assigned to this business");
      return;
    }
    try {
      await assignMut.mutateAsync({
        staffId: m.id,
        business_ids: [...ids, currentBiz],
      });
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Assign failed");
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} /> Staff
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, assign shops, roles, deactivate, reset passwords
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Sync
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="h-9 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Add staff
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-sm bg-background"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg border text-xs px-2 bg-background"
        >
          <option value="ALL">All roles</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-primary" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-rose-600">
            {(error as Error)?.message || "Failed to load staff"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No staff match this filter.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b bg-surface/30">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Businesses</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/40 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.email}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleBadge(String(m.role))}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-xs font-medium ${m.active ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {(m.assigned_businesses || []).map((b) => b.name).join(", ") ||
                      "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <select
                        className="h-8 text-[10px] border rounded-md px-1 bg-background"
                        value={String(m.role)}
                        onChange={(e) =>
                          changeRole(m, e.target.value as StaffRoleName)
                        }
                        disabled={
                          m.role === "OWNER" && actorRole !== "OWNER"
                        }
                      >
                        {creatableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="h-8 px-2 text-[10px] font-semibold border rounded-md"
                        onClick={() => toggleActive(m)}
                      >
                        {m.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="h-8 px-2 text-[10px] font-semibold border rounded-md inline-flex items-center gap-1"
                        onClick={() => resetPassword(m)}
                        title="Reset password"
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        type="button"
                        className="h-8 px-2 text-[10px] font-semibold border rounded-md inline-flex items-center gap-1"
                        onClick={() => ensureCurrentBiz(m)}
                        title="Assign current business"
                      >
                        <Building2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck size={12} className="text-brand-primary" />
        Changes enforce last-OWNER protection and role rules on the API.
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Create staff</h2>
              <button type="button" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Full name
                </label>
                <input
                  className="w-full h-9 mt-1 rounded-lg border px-3 text-sm"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-xs text-rose-600 mt-0.5">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Email
                </label>
                <input
                  className="w-full h-9 mt-1 rounded-lg border px-3 text-sm"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-0.5">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full h-9 mt-1 rounded-lg border px-3 text-sm"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-0.5">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Role
                </label>
                <select
                  className="w-full h-9 mt-1 rounded-lg border px-3 text-sm"
                  {...register("role")}
                >
                  {creatableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Business assignment
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Current business is pre-selected. Use row actions to add more
                  shops after create.
                </p>
                <input type="hidden" {...register("business_ids")} />
                {currentBiz && (
                  <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
                    <Building2 size={12} />
                    Assigned to current business
                    <button
                      type="button"
                      className="underline ml-1"
                      onClick={() =>
                        setValue(
                          "business_ids",
                          selectedBizIds.includes(currentBiz)
                            ? selectedBizIds
                            : [...selectedBizIds, currentBiz],
                        )
                      }
                    >
                      ensure
                    </button>
                  </div>
                )}
                {errors.business_ids && (
                  <p className="text-xs text-rose-600 mt-0.5">
                    {errors.business_ids.message}
                  </p>
                )}
              </div>
              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}
              <button
                type="submit"
                disabled={createMut.isPending}
                className="w-full h-10 rounded-xl bg-brand-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {createMut.isPending ? "Creating…" : "Create staff"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
