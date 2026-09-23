import type { Metadata } from "next";
import { PlatformLoginForm } from "@/features/platform/components/PlatformLoginForm";

export const metadata: Metadata = {
  title: "Platform sign in | Tawala",
  description:
    "Sign in to the Tawala platform operator console. Not for store staff accounts.",
  robots: { index: false, follow: false },
};

/**
 * Platform operator login (password + email MFA).
 * Separate from store /login (NextAuth staff flow).
 */
export default function PlatformLoginPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-[70dvh] w-full flex-col items-center justify-center px-4 py-10"
    >
      <section
        aria-label="Platform authorization"
        className="w-full max-w-md"
      >
        <div className="card-layered border border-border bg-card p-6 sm:p-8">
          <PlatformLoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Store owners and cashiers should use{" "}
          <a href="/login" className="underline underline-offset-2 hover:text-foreground">
            store sign in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
