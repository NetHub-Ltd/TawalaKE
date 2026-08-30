import type { Metadata } from "next";
import { Suspense } from "react";
import StaffMemberWorkspace from "@/features/staff/components/StaffMemberWorkspace";

export const metadata: Metadata = {
  title: "Staff workspace | Tawala",
  description: "Manage role, store access, and security for a team member.",
};

export default async function StaffWorkspacePage({
  params,
}: {
  params: Promise<{ organizationId: string; staffId: string }>;
}) {
  const { organizationId, staffId } = await params;
  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <Suspense
        fallback={
          <div className="p-8 text-sm text-slate-500">Loading workspace…</div>
        }
      >
        <StaffMemberWorkspace
          organizationId={organizationId}
          staffId={staffId}
        />
      </Suspense>
    </div>
  );
}
