"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchUser } from "../../../lib/actions/fetchUser";

/**
 * Fetches authenticated user profile via server action (token stays server-side).
 */
export function useTenantProfile() {
  const { data: session, status } = useSession();
  return useQuery({
    queryKey: ["tenant-profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized: session missing");
      }

      const data = await fetchUser();

      if (!data) {
        throw new Error("NotFound: No profile returned from server");
      }

      return data;
    },
    enabled: status === "authenticated" && !!session?.user?.id && !session?.error,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
