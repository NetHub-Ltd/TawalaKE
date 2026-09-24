import Link from "next/link";
import { ArrowLeft, Home, LogIn } from "lucide-react";
import { auth } from "@/auth";

/**
 * Global 404 — orient and recover, no jargon.
 */
export default async function NotFound() {
  const session = await auth().catch(() => null);
  const signedIn = Boolean(session?.user && !session.error);
  const orgId = session?.user?.organization_id as string | undefined;

  const primaryHref = signedIn
    ? orgId
      ? `/org/${orgId}`
      : "/org"
    : "/login";
  const primaryLabel = signedIn ? "Go to organization home" : "Sign in";
  const PrimaryIcon = signedIn ? Home : LogIn;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 antialiased">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lift sm:p-10">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/5 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Tawala"
            width={48}
            height={48}
            className="h-12 w-12 object-contain opacity-90"
          />
        </div>

        <div className="relative space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            404
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            This page isn&apos;t here
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
            The link may be wrong or out of date
            {signedIn
              ? ", or you might not have access to this area."
              : ". Sign in if you have an account, or head home."}
          </p>
        </div>

        <div className="relative mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            <PrimaryIcon className="h-4 w-4" aria-hidden />
            {primaryLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Tawala home
          </Link>
        </div>

        {signedIn && orgId ? (
          <div className="relative mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-border/60 pt-5 text-center text-xs font-medium text-muted">
            <Link
              href={`/org/${orgId}/stores`}
              className="hover:text-foreground hover:underline"
            >
              Branches
            </Link>
            <Link
              href={`/org/${orgId}/staff`}
              className="hover:text-foreground hover:underline"
            >
              Team
            </Link>
          </div>
        ) : null}

        <p className="relative mt-6 text-center text-[11px] text-muted">
          Need help? Contact your organization admin or{" "}
          <Link href="/org/contact-us" className="text-brand-primary hover:underline">
            support
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
