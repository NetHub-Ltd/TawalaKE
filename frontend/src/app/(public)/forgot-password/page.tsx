import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | Tawala",
  description: "Request a secure link to reset your Tawala account password.",
  alternates: {
    canonical: "https://tawala.nethub.co.ke/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lift">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-primary">
          Account recovery
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Forgot password?</h1>
        <p className="mb-8 text-sm text-muted">
          Enter the email on your account. If it matches an active user, we&apos;ll send a
          reset link that expires in 15 minutes.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
