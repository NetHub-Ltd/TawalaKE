import type { Metadata } from "next";
import { OrgSettingsClient } from "@/features/org/components/OrgSettingsClient";

export const metadata: Metadata = {
  title: "Organization settings | Tawala",
  description: "Organization profile and identity.",
};

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <OrgSettingsClient organizationId={organizationId} />;
}
