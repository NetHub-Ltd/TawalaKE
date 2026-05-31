import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StaffResponse } from "@/lib/api/generated/models/staffResponse";

export default async function GlobalOrgRootPage() {
  // 1. Fetch server-side session via Auth.js v5 universal engine
  const session = await auth();

  // Guard: Redirect to login if unauthenticated
  if (!session?.user) {
    redirect("/login");
  }

  const staffData = session.user as unknown as StaffResponse;

  // Guard: Block disabled staff records instantly
  if (!staffData.active) {
    redirect("/login?error=account_deactivated");
  }

  // 2. Resolve Multi-Tenant & Migration Boundaries
  const resolvedOrgId = staffData.organization_id || staffData.tenant_id;

  if (!resolvedOrgId) {
    redirect("/login?error=invalid_organization_context");
  }

  // 3. Central Router Switchboard Action Gates
  if (staffData.role === "CASHIER" && staffData.business_id) {
    redirect(`/org/${resolvedOrgId}/terminal/${staffData.business_id}/sale`);
  }

  if (staffData.role === "OWNER" || staffData.role === "MANAGER") {
    redirect(`/org/${resolvedOrgId}`);
  }

  // 4. Ultra-Clean, Ultra-Friendly, Full-Width Workspace Central View
  return (
    <div className="min-h-screen bg-surface px-6 py-12 transition-colors duration-300 dark:bg-surface md:px-16 md:py-20 flex items-center justify-center">
      <main className="w-full max-w-4xl" id="main-content">
        
        {/* Reassuring Core Status Board Card */}
        <section className="card-layered bg-background p-8 md:p-12 text-center flex flex-col items-center justify-center" aria-labelledby="welcome-heading">
          
          {/* Large Success Check Ring */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-accent/10 text-brand-accent animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-10 w-10" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>

          {/* Friendly Greeting */}
          <header className="mb-6">
            <h1 id="welcome-heading" className="text-h2 font-black tracking-tight text-foreground">
              Hello, <span className="text-gradient font-black">{staffData.full_name || session.user.name}</span>!
            </h1>
            <p className="mt-2 text-sm text-brand-accent font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              Your account is fully active and secure
            </p>
          </header>

          {/* Warm Reassurance Message */}
          <div className="max-w-2xl space-y-4 text-base md:text-lg leading-relaxed text-muted border-b border-border/40 pb-8">
            <p>
              Great news! Your login was completely successful, and everything is perfectly set up with your account profile. You are officially connected to the store network.
            </p>
            <p>
              This is a standard, normal step for team setups. To get you selling, a manager or store owner just needs to register this device station to your profile on their admin side panel. 
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}