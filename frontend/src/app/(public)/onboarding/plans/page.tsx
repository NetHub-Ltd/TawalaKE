import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";
import { StartTrialButton } from "@/features/org/components/StartTrialButton";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  currency: string;
  trial_days: number;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
};

async function loadPlans(token: string): Promise<Plan[]> {
  const res = await fetch(backendUrl("/organizations/plans"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? json) as Plan[];
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

  let plans: Plan[] = [];
  try {
    plans = await loadPlans(session.accessToken);
  } catch {
    plans = [];
  }

  const ndovu = plans.find((p) => p.code === "NDOVU");
  const others = plans.filter((p) => p.code !== "NDOVU");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
            Choose your plan
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Start growing with Tawala
          </h1>
          <p className="mt-2 text-muted">
            Owners without an active plan start here. Pick Ndovu to begin a 7-day free trial —
            no charge today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ndovu && (
            <article className="relative flex flex-col rounded-2xl border-2 border-brand-primary bg-card p-6 shadow-lift">
              <span className="absolute -top-3 left-6 rounded-full bg-brand-primary px-3 py-0.5 text-xs font-semibold text-white">
                Recommended
              </span>
              <h2 className="text-xl font-semibold text-foreground">{ndovu.name}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{ndovu.description}</p>
              <p className="mt-4 text-3xl font-semibold text-foreground">
                {ndovu.currency} {Number(ndovu.price_monthly).toLocaleString()}
                <span className="text-sm font-normal text-muted"> /mo after trial</span>
              </p>
              <p className="mt-1 text-sm text-brand-accent">7-day free trial · invoice emailed</p>
              <StartTrialButton />
            </article>
          )}

          {others.map((plan) => (
            <article
              key={plan.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{plan.description}</p>
              <p className="mt-4 text-2xl font-semibold text-foreground">
                {plan.currency} {Number(plan.price_monthly).toLocaleString()}
                <span className="text-sm font-normal text-muted"> /mo</span>
              </p>
              <p className="mt-4 text-sm text-muted">
                Available after you start with Ndovu trial, or contact support to switch.
              </p>
            </article>
          ))}
        </div>

        {!ndovu && (
          <p className="mt-8 text-sm text-muted">
            Plans could not be loaded. Confirm the API is reachable and plans are seeded.
          </p>
        )}
      </div>
    </div>
  );
}
