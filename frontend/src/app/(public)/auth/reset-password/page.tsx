import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | Tawala",
  description: "Choose a new password for your Tawala account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Account recovery
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Set a new password</h1>
        <p className="mb-8 text-sm text-muted">
          Choose a strong password (at least 8 characters). You&apos;ll use it to sign in to
          Tawala.
        </p>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
