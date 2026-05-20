"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessService } from "@/features/business/services/businessService";
// import { Business } from "@/types/business";
import { Business } from "@/features/business/types/business";
import { createContext, useContext } from "react";

export function useBusiness(tenantId?: string) {
  const queryClient = useQueryClient();

  // Query logic: Fetch and cache the business list
  const {
    data: businesses = [],
    isLoading,
    isError,
    error,
  } = useQuery<Business[]>({
    queryKey: ["businesses", tenantId],
    queryFn: () => businessService.getBusinesses(),
    staleTime: 1000 * 60 * 5, // 5 mins: prevents excessive refetching during session
  });

  // Mutation logic: Handle new business creation
  const registerMutation = useMutation({
    mutationFn: businessService.createBusiness,
    onSuccess: () => {
      // Logic: Invalidate the "businesses" key to trigger an immediate refetch
      queryClient.invalidateQueries({ queryKey: ["businesses", tenantId] });
    },
  });

  return {
    // State
    businesses,
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