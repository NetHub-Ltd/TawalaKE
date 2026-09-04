import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInviteForm } from "@/features/staff/components/AcceptInviteForm";

export const metadata: Metadata = {
  title: "Accept invite | Tawala",
  description: "Set your password to join your team on Tawala.",
  robots: { index: false, follow: false },
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Team invite
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Set your password
        </h1>
        <p className="mb-8 text-sm text-muted">
          Choose a password to activate your Tawala account. This link is single-use
          and expires after 48 hours.
        </p>
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
