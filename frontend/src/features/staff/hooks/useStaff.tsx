"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StaffRoleName } from "@/lib/rbac";

export interface StaffBusiness {
  id: string;
  name: string;
}

export interface StaffMember {
  id: string;
  organization_id?: string;
  email: string;
  full_name: string;
  role: StaffRoleName | string;
  active: boolean;
  assigned_businesses?: StaffBusiness[];
}

export interface CreateStaffInput {
  email: string;
  full_name: string;
  role: StaffRoleName;
  password: string;
  business_ids: string[];
  organization_id?: string;
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message?: string }).message);
  }
  // BFF diagnostic shape from upstream FastAPI
  const upstream = body?.upstream_body;
  if (upstream?.detail) {
    if (typeof upstream.detail === "string") return upstream.detail;
    if (typeof upstream.detail === "object" && upstream.detail?.message) {
      return String(upstream.detail.message);
    }
  }
  if (body?.error && body?.upstream_status) {
    return `${body.error} (${body.upstream_status})`;
  }
  return body?.error || body?.message || res.statusText || "Request failed";
}

export interface StaffActivityItem {
  id: string;
  action: string;
  outcome: string;
  actor_staff_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  resource_id?: string | null;
  meta?: Record<string, unknown>;
  created_at?: string | null;
}

export function useStaffActivity(organizationId?: string, staffId?: string) {
  return useQuery<StaffActivityItem[]>({
    queryKey: ["staff", organizationId, staffId, "activity"],
    queryFn: async () => {
      const q = staffId
        ? `/api/v1/org/staff/${staffId}/activity`
        : `/api/v1/org/staff/activity`;
      const res = await fetch(q);
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!organizationId,
  });
}

/** Org staff directory — single source (managed staff module). */
export function useStaff(organizationId?: string) {
  const query = useQuery<StaffMember[]>({
    queryKey: ["staff", organizationId, "directory"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/org/staff`);
      if (!res.ok) throw new Error(await parseError(res));
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });

  return {
    staff: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Single staff workspace payload. */
export function useStaffMember(organizationId?: string, staffId?: string) {
  return useQuery<StaffMember>({
    queryKey: ["staff", organizationId, staffId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/org/staff/${staffId}`);
      if (!res.ok) throw new Error(await parseError(res));
      return res.json() as Promise<StaffMember>;
    },
    enabled: !!organizationId && !!staffId,
    staleTime: 15_000,
  });
}

export function useCreateStaff(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStaffInput) => {
      const res = await fetch(`/api/v1/org/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json() as Promise<StaffMember>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
    },
  });
}

export function useUpdateStaff(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      ...payload
    }: {
      staffId: string;
      full_name?: string;
      role?: StaffRoleName;
      active?: boolean;
    }) => {
      const res = await fetch(`/api/v1/org/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json() as Promise<StaffMember>;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
      qc.invalidateQueries({ queryKey: ["staff", organizationId, vars.staffId] });
    },
  });
}

export function useSetStaffBusinesses(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      business_ids,
    }: {
      staffId: string;
      business_ids: string[];
    }) => {
      const res = await fetch(`/api/v1/org/staff/${staffId}/businesses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_ids }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json() as Promise<StaffMember>;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
      qc.invalidateQueries({ queryKey: ["staff", organizationId, vars.staffId] });
    },
  });
}

export function useResetStaffPassword(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      staffId,
      password,
    }: {
      staffId: string;
      password: string;
    }) => {
      const res = await fetch(`/api/v1/org/staff/${staffId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId, vars.staffId] });
    },
  });
}
