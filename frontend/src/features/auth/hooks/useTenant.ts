"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchUser } from "../../../lib/actions/fetchUser";


/**
 * HOOK: useTenantProfile
 * Logic: Fetches authenticated user profile from the server.
 * Performance: Implements a 5-minute staleTime to reduce redundant server-side hits.
 */
export function useTenantProfile() {
  const { data: session, status } = useSession();
  return useQuery({
    // Unique key including tenantId ensures cache isolation between accounts
    queryKey: ["tenant-profile", session?.user?.id],
    queryFn: async () => {
      // Logic: Ensure we have the necessary tokens before calling the server
      if (!session?.accessToken) {
        throw new Error("Unauthorized: Access token missing");
      }

      const data = await fetchUser();

      if (!data) {
        throw new Error("NotFound: No profile returned from server");
      }

      return data;
    },
    enabled:
      status === "authenticated" &&
      !!session?.user?.id &&
      !!session?.accessToken,
    staleTime: 1000 * 60 * 10, // 5 Minutes
    retry: 1, // Minimize unnecessary retries on 401s
  });
}
