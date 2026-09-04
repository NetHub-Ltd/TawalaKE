import type { Metadata } from "next";
import React from "react";
import { PersonalDetailsForm } from "@/features/org/components/PersonalDetailsForm";

export const metadata: Metadata = {
  title: "Start your free trial",
  description:
    "Start a 14-day free Ndovu trial on Tawala. No credit card required. Built for Kenyan shops.",
  alternates: { canonical: "/onboarding/personal-details" },
  robots: { index: false, follow: true },
};

export default function PersonalDetailsPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Step 1 of 3 · Account
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
