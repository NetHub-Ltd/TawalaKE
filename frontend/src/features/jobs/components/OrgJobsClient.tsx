"use client";

import React from "react";
import Link from "next/link";
import { JobsPanel } from "@/features/jobs/components/JobsPanel";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { Spinner } from "@/lib/components/ui";

export function OrgJobsClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const { can, isLoading } = usePermissions();
  const allowed = can(Permission.JOBS_MANAGE);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-muted">
        You need the <strong>jobs:manage</strong> permission (Owner, Admin, or
        Manager) to view background jobs.
        <div className="mt-4">
          <Link
            href={`/org/${organizationId}/${businessId}/overview`}
            className="text-brand-primary hover:underline"
          >
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Background jobs</h1>
        <p className="text-sm text-muted">
          History of document and dashboard jobs for this organization. Failed
          jobs can be retried.
        </p>
      </div>
      <JobsPanel
        statusPath="/api/v1/jobs/status"
        replayPath="/api/v1/jobs/replay"
        historyPath="/api/v1/jobs/history"
        streamPath="/api/v1/jobs/stream"
        retryPath={(id) => `/api/v1/jobs/${id}/retry`}
        title="Organization jobs"
        allowRetry
        allowReplay
      />
    </div>
  );
}
