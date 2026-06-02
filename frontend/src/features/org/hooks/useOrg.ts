"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Business } from "@/features/business/types/business";
import { createContext, useContext } from "react";

export function useOrganization(organizationId?: string) {
  const queryClient = useQueryClient();

  // Query logic: Fetch and aggressively cache the business list
  const {
    data: organization,
    isLoading,
    isError,
    error,
  } = useQuery<Business[]>({
    queryKey: ["organization", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required to fetch organization data.");
      }

      const response = await fetch(`/api/v1/organization/${organizationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Ensures switchboard always shows current business list
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to synchronize business data");
      }

      // Per your structure: Next.js API route returns data.data directly as the business object
      return response.json() as Promise<Business[]>;
    },

    // ⚡ AGGRESSIVE POS/DESKTOP CACHING STRATEGY:
    staleTime: 1000 * 60 * 60 * 4,       // 4 Hours: Consider this data fresh for a long time
    gcTime: 1000 * 60 * 60 * 24,          // 24 Hours: Keep this data in memory, never delete it during session
    refetchOnMount: false,                // 🔥 INSTANT UI: Pull from cache immediately; skip loading states on route change
    refetchOnWindowFocus: false,          // Stops app from lagging/re-fetching when user clicks away and comes back
    // refetchOnReconnect: "ifStale",        // Only care about re-fetching if network drops and data is older than 4 hours
  });
 
  return {
    // State
    organization,
    isLoading,
    isError,
    error,
  };
}


// 1. Create the Context
export const orgnizationContext = createContext<{
  organizationId: string | undefined;
  organizationName: string | undefined;
  active: boolean | undefined;
  email: string | undefined;
  plan: string | undefined;
  createdAt: Date | undefined;
} | null>(null);

export const useOrganizationContext = () => {
  const context = useContext(orgnizationContext);
  if (!context) {
    throw new Error(
      "useOrganizationContext must be used within an OrganizationProvider",
    );
  }
  return context;
};