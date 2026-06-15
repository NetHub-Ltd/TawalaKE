// app/(organization)/org/page.tsx
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

  // 🚀 SUCCESS ROUTE: If they are healthy and have an org, forward them immediately 
  // to your server-side Decision Page. No layout overhead or visual flashes.
  if (resolvedOrgId) {
    redirect(`/org/${resolvedOrgId}`);
  }

  // 3. FALLBACK STATE: Active account but missing an organization framework match.
  // We keep your clean, accessible theme framework here exclusively for this edge case.
  return (
    <div className="min-h-screen bg-surface px-6 py-12 transition-colors duration-300 dark:bg-surface md:px-16 md:py-20 flex items-center justify-center">
      <main className="w-full max-w-4xl" id="main-content">
        
        {/* Reassuring Core Status Board Card */}
        <section className="card-layered bg-background p-8 md:p-12 text-center flex flex-col items-center justify-center" aria-labelledby="welcome-heading">
          
          {/* Large Success Check Ring */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-accent/10 text-brand-accent animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-10 w-10" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>

          {/* Friendly Greeting */}
          <header className="mb-6">
            <h1 id="welcome-heading" className="text-h2 font-black tracking-tight text-foreground">
              Hello, <span className="text-gradient font-black">{staffData.full_name || session.user.name}</span>!
            </h1>
            <p className="mt-2 text-sm text-brand-accent font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              Pending Tenant Assignment
            </p>
          </header>

          {/* Warm Reassurance Message */}
          <div className="max-w-2xl space-y-4 text-base md:text-lg leading-relaxed text-muted border-b border-border/40 pb-8">
            <p>
              Your authentication was successful and your identity verification credentials are valid within the network layer.
            </p>
            <p>
              However, your operator profile is not currently linked to an active corporate organization branch context. To initialize your station dashboard, a manager or administrator must assign your team profile to a store division inside their console.
            </p>
          </div>

          {/* Action Call for clean exit */}
          <div className="mt-6">
            <a 
              href="/login?error=context_resolution_timeout" 
              className="text-sm font-bold text-muted hover:text-foreground transition-colors uppercase tracking-wider underline underline-offset-4"
            >
              Return to Authentication Portal
            </a>
          </div>

        </section>

      </main>
    </div>
  );
}