import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OrgShell } from "@/features/org/components/OrgShell";
import {
  Permission,
  can,
  permissionsForRole,
} from "@/lib/rbac";

/** Org updates — any staff with org:read */
export default async function UpdatesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const session = await auth();
  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}/updates`)}`,
    );
  }
  const userRole =
    (session.user as { role?: string }).role ||
    (session as { role?: string }).role ||
    "";
  const perms = permissionsForRole(String(userRole).toUpperCase());
  if (!can(perms, Permission.ORG_READ)) {
    redirect(`/org/${organizationId}`);
  }

  return (
    <OrgShell organizationId={organizationId} userRole={String(userRole)}>
      {children}
    </OrgShell>
  );
}
