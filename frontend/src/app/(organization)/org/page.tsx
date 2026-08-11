// app/org/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
import { OrgNoSession } from "@/features/org/components/OrgNoSession";

type ResolveResult =
  | { type: "no-session" }
  | { type: "no-org" }
  | { type: "success"; orgId: string; businessId: string };

async function resolveOrganization(): Promise<ResolveResult> {
  const session = await auth();

  // 1. No valid session
  if (!session?.user || session.error || !session.accessToken) {
    return { type: "no-session" };
  }

  try {
    // 2. Fetch the full staff profile using the token from the session
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      // Important: don't cache this – we need fresh data
      cache: "no-store",
    });

    if (!res.ok) {
      // Token might be expired or invalid
      return { type: "no-session" };
    }

    const fullStaffData = await res.json();

    const resolvedOrgId = fullStaffData.organization_id;
    const resolvedBusinessId = fullStaffData.assigned_businesses?.[0]?.id;

    // 3. Missing organization or business context
    if (!resolvedOrgId || !resolvedBusinessId) {
      return { type: "no-org" };
    }

    // 4. Happy path
    return {
      type: "success",
      orgId: resolvedOrgId,
      businessId: resolvedBusinessId,
    };
  } catch (error) {
    console.error("[OrgResolution] Failed to resolve organization:", error);
    // Network / unexpected error → treat as no-org so user can recover
    return { type: "no-org" };
  }
}

export default function OrgPage() {
  return (
    <Suspense fallback={<OrgDecisionLoading />}>
      <OrgDecisionWrapper />
    </Suspense>
  );
}

async function OrgDecisionWrapper() {
  const result = await resolveOrganization();

  switch (result.type) {
    case "no-session":
      return <OrgNoSession />;

    case "no-org":
      return <OrgDecisionError />;

    case "success":
      // This redirect happens on the server – user never sees the page
      redirect(
        `/org/${result.orgId}/${result.businessId}/overview`
      );
  }
}