import { redirect } from "next/navigation";

/** Staff is org-scoped; keep deep link but land on Team directory. */
export default async function BusinessStaffRedirect({
  params,
}: {
  params: Promise<{ organizationId: string; businessId: string }>;
}) {
  const { organizationId } = await params;
  redirect(`/org/${organizationId}/staff`);
}
