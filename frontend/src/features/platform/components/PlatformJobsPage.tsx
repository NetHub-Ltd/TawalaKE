"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobsPanel } from "@/features/jobs/components/JobsPanel";
import {
  getPlatformAccessToken,
  clearPlatformSession,
} from "@/lib/platform/auth";
import { Spinner } from "@/lib/components/ui";

export function PlatformJobsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = getPlatformAccessToken();
    if (!t) {
      router.replace("/platform/login");
      return;
    }
    setToken(t);
  }, [router]);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  if (!token) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Background jobs</h1>
        <button
          type="button"
          className="text-xs text-muted hover:underline"
          onClick={() => {
            clearPlatformSession();
            router.replace("/platform/login");
          }}
        >
          Sign out
        </button>
      </div>
      <JobsPanel
        statusPath="/api/v1/platform/jobs/status"
        replayPath="/api/v1/platform/jobs/replay"
        authHeaders={headers}
        title="Celery cluster"
      />
    </div>
  );
}
