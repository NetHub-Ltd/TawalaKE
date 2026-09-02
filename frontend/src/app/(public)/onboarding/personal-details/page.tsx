import React from "react";
import { PersonalDetailsForm } from "@/features/org/components/PersonalDetailsForm";

export default function PersonalDetailsPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Account
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Start your 14-day free trial
        </h1>
        <p className="mb-8 text-sm text-muted">
          Ndovu plan · no credit card · about 2 minutes. We&apos;ll email you a
          link to set your password and activate access.
        </p>
        <PersonalDetailsForm />
      </div>
    </div>
  );
}
