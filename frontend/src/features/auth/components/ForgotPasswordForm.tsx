"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("That doesn’t look like a valid email"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      });
      const result = await res.json().catch(() => ({}));

      // Backend always returns 202 with a generic message (no enumeration).
      if (!res.ok && res.status !== 202) {
        throw new Error(
          (typeof result.message === "string" && result.message) ||
            (typeof result.error === "string" && result.error) ||
            "Unable to send reset email. Please try again."
        );
      }

      setSubmittedEmail(data.email.trim());
      setSent(true);
      toast.success("Check your email for a reset link");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <CheckCircle2 size={24} aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted">
            If an active account exists for{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>, we sent a
            password reset link. It expires in 15 minutes.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/60"
            size={18}
            aria-hidden
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground outline-none ring-brand-primary/30 transition focus:ring-2 disabled:opacity-60"
            placeholder="owner@mybusiness.co.ke"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={16} aria-hidden />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
