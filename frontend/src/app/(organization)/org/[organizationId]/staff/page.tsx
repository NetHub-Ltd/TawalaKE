import type { Metadata } from "next";
import TeamDirectory from "@/features/staff/components/TeamDirectory";

export const metadata: Metadata = {
  title: "Team | Tawala",
  description: "Organization staff directory and invitations.",
};

export default async function OrgStaffPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <TeamDirectory organizationId={organizationId} />
    </div>
  );
}
