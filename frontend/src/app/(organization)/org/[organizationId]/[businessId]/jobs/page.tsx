import { OrgJobsClient } from "@/features/jobs/components/OrgJobsClient";

type Props = {
  params: Promise<{ organizationId: string; businessId: string }>;
};

export default async function OrgJobsPage({ params }: Props) {
  const { organizationId, businessId } = await params;
  return (
    <OrgJobsClient organizationId={organizationId} businessId={businessId} />
  );
}
