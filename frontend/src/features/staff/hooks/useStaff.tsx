"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface StaffMember {
  id: string;
  tenant_id: string;
  organization_id: string;
  business_id: string;
  email: string;
  full_name: string;
  role: "CASHIER"
  active: boolean;
}

export interface RegisterStaffInput {
  tenant_id: string;
  organization_id: string;
  business_id: string;
  email: string;
  full_name: string;
  role: StaffMember["role"];
  active: boolean;
}

/**
 * Hook for fetching and caching the organization's staff roster.
 */
export function useStaff(organizationId?: string) {
  const {
    data: staff = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<StaffMember[]>({
    queryKey: ["staff", organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/org/staff?organizationId=${organizationId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch organization staff roster allocations.");
      }
      return res.json();
    },
    enabled: !!organizationId,
    
    // ⚡ AGGRESSIVE POS/DESKTOP CACHING STRATEGY:
    staleTime: 1000 * 60 * 60 * 4,       // 4 Hours: Cache data is considered fresh
    gcTime: 1000 * 60 * 60 * 24,         // 24 Hours: Retain in memory during session
    refetchOnMount: false,                // Pull from cache immediately; skip loading flags
    refetchOnWindowFocus: false,          // Prevent UI lagging during rapid POS operations
  });

  return { staff, isLoading, isFetching, isError, error, refetch };
}

/**
 * Hook for registering a new staff member into a specific organization and business.
 */
export function useRegisterStaff(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation<StaffMember, Error, RegisterStaffInput>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/v1/org/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const structuralError = await res.json().catch(() => ({}));
        throw new Error(structuralError.message || "Failed to create new staff");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to trigger clean background synchronization
      queryClient.invalidateQueries({ queryKey: ["staff", organizationId] });
    },
  });
}