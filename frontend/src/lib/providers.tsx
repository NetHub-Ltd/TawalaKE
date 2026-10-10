"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useState } from "react";
import { NetworkStatusBanner } from "@/features/shell/components/NetworkStatusBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <SessionProvider refetchInterval={300} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusBanner />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </SessionProvider>
  );
}
