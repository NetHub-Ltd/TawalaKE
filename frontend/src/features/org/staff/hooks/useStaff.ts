"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessService } from "@/features/business/services/businessService";
import { Business } from "@/features/business/types/business";
import { createContext, useContext } from "react";

export function useStaff(tenantId?: string) {
  const queryClient = useQueryClient();

  // Query logic: Fetch and aggressively cache the business list
  const {
    data: staff = [],
    isLoading,
    isError,
    error,
  } = useQuery<Business[]>({
    queryKey: ["staff", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/org/staff?organization_id=${tenantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    },

    // ⚡ AGGRESSIVE POS/DESKTOP CACHING STRATEGY:
    staleTime: 1000 * 60 * 60 * 4,       // 4 Hours: Consider this data fresh for a long time
    gcTime: 1000 * 60 * 60 * 24,          // 24 Hours: Keep this data in memory, never delete it during session
    refetchOnMount: false,                // 🔥 INSTANT UI: Pull from cache immediately; skip loading states on route change
    refetchOnWindowFocus: false,          // Stops app from lagging/re-fetching when user clicks away and comes back
    // refetchOnReconnect: "ifStale",        // Only care about re-fetching if network drops and data is older than 4 hours
  });

  // Mutation logic: Handle new staff creation
  const registerMutation = useMutation({
    mutationFn: businessService.createBusiness,
    onSuccess: () => {
      // Logic: Invalidate the "staff" key to trigger an immediate refetch when a new one is added
      queryClient.invalidateQueries({ queryKey: ["staff", tenantId] });
    },
  });

  return {
    // State
    staff,
    isLoading,
    isError,
    error,

    // Actions
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registrationError: registerMutation.error,
  };
}

// 1. Create the Context
export const BusinessContext = createContext<{
  organizationId: string | string[] | undefined;
  businessId: string | string[] | undefined;
  businessName: string | undefined;
} | null>(null);

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error(
      "useBusinessContext must be used within a BusinessProvider",
    );
  }
  return context;
};