"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffRoleName } from "@/lib/rbac";

export interface StaffBusiness {
  id: string;
  name: string;
}

export interface StaffMember {
  id: string;
  organization_id?: string | null;
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
  if (detail?.message) return detail.message;
  return body?.error || body?.message || res.statusText || "Request failed";
}

export function useStaff(organizationId?: string) {
  const query = useQuery<StaffMember[]>({
    queryKey: ["staff", organizationId, "managed"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/org/staff/managed`);
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

export function useCreateStaff(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStaffInput) => {
      const res = await fetch(`/api/v1/org/staff/managed`, {
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", organizationId] });
    },
  });
}

/** @deprecated use useCreateStaff */
export function useRegisterStaff(organizationId?: string) {
  return useCreateStaff(organizationId);
}
