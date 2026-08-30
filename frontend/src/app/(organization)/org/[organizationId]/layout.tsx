import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

/**
 * Bind URL organizationId to authenticated staff organization.
 * Backend still enforces tenant on every API call; this prevents cross-tenant UI.
 */
export default async function OrganizationIdLayout({
  children,
  params,
}: LayoutProps) {
  const { organizationId } = await params;
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}`)}`,
    );
  }

  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  return children;
}
