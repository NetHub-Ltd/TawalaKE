import React, { Suspense } from "react";
import { SetPasswordForm } from "@/features/org/components/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Secure your account
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Set password &amp; start trial
        </h1>
        <p className="mb-8 text-sm text-muted">
          Choose a strong password. You&apos;ll get 14 days of Ndovu access
          right after this step — no credit card required.
        </p>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
