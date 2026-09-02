import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";
import { PlanCard, type PlanCardData } from "@/features/org/components/PlanCard";

function orderPlans(plans: PlanCardData[]): PlanCardData[] {
  const rank = (c: string) =>
    c === "BASIC" ? 0 : c === "NDOVU" ? 1 : c === "ENTERPRISE" ? 2 : 99;
  return [...plans].sort((a, b) => rank(a.code) - rank(b.code));
}

async function loadPlans(token: string): Promise<PlanCardData[]> {
  const res = await fetch(backendUrl("/organizations/plans"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return orderPlans((json.data ?? json) as PlanCardData[]);
}

async function loadStatus(token: string) {
  const res = await fetch(backendUrl("/organizations/onboarding-status"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function PlansOnboardingPage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login?callbackUrl=%2Fonboarding%2Fplans");
  }

  const status = await loadStatus(session.accessToken);
  const role = (status?.role || session.user?.role || "").toString().toUpperCase();

  if (role && role !== "OWNER") {
    redirect("/org");
  }
  if (status?.has_active_subscription && status?.profile_complete) {
    redirect("/org");
  }
  if (status?.has_active_subscription && !status?.profile_complete) {
    redirect("/onboarding/organization");
  }

  let plans: PlanCardData[] = [];
  try {
    plans = await loadPlans(session.accessToken);
  } catch {
    plans = [];
  }

  return (
    <div className="relative w-full bg-background pb-20">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-brand-secondary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Pricing
          </p>
          <h1 className="text-h2">Plans that grow with your biashara</h1>
          <p className="mt-3 text-muted">
            New accounts start a 14-day Ndovu trial after verification. Use this
            page to change plan or recover a trial. Clear limits — built for
            Kenyan SMEs.
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-sm text-muted">
            Plans could not be loaded. Confirm the API is reachable and plans are
            seeded.
          </p>
        ) : (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted">
          Need help choosing?{" "}
          <Link
            href="/org/contact-us"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Talk to our team
          </Link>
        </p>
      </div>
    </div>
  );
}
