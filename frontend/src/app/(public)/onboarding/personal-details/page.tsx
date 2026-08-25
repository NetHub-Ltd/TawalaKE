import React from "react";
import { PersonalDetailsForm } from "@/features/org/components/PersonalDetailsForm";

export default function PersonalDetailsPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Step 1 of 2
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mb-8 text-sm text-muted">
          Tell us who you are. We&apos;ll email you a link to set your password.
        </p>
        <PersonalDetailsForm />
      </div>
    </div>
  );
}
