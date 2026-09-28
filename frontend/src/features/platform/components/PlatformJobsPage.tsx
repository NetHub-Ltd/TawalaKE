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

  const headers = useMemo((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  if (!token) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Background jobs</h1>
          <p className="text-sm text-muted">
            Read-only view of job history across the platform.
          </p>
        </div>
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
        historyPath="/api/v1/platform/jobs/history"
        streamPath="/api/v1/platform/jobs/stream"
        authHeaders={headers}
        title="Platform jobs"
        allowRetry={false}
        allowReplay={false}
      />
    </div>
  );
}
