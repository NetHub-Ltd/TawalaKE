import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";
import { OrganizationDetailsForm } from "@/features/org/components/OrganizationDetailsForm";

export const metadata: Metadata = {
  title: "Organization details",
  description: "Complete your Tawala organization setup.",
  robots: { index: false, follow: true },
};

export default async function OrganizationOnboardingPage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login?callbackUrl=%2Fonboarding%2Forganization");
  }

  const res = await fetch(backendUrl("/organizations/onboarding-status"), {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    redirect("/org");
  }
  const json = await res.json();
  const status = json.data;
  const role = (status?.role || "").toUpperCase();
  if (role && role !== "OWNER") {
    redirect("/org");
  }
  if (!status?.has_active_subscription) {
    redirect("/onboarding/plans");
  }
  if (status?.onboarding) {
    redirect("/org");
  }

  const org = status.organization || {};

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Step 3 of 3 · Organization profile
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Complete your organization
        </h1>
        <p className="mb-8 text-sm text-muted">
          Confirm the details for your workspace. Store setup is optional and can wait.
        </p>
        <OrganizationDetailsForm prefill={org} />
      </div>
    </div>
  );
}
