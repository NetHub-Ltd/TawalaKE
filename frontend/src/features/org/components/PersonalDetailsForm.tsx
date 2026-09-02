"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const personalDetailsSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message:
      "You have to accept the Terms of Service, Privacy Policy, and Data Policy to continue",
  }),
});

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

export function PersonalDetailsForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      acceptTerms: false as true,
    },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: PersonalDetailsFormData) => {
    try {
      const res = await fetch("/api/v1/org/onboarding/personal-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          result.message ||
          result.error ||
          (typeof result.detail === "string" ? result.detail : null) ||
          "Something went wrong. Please try again.";

        if (res.status === 409) {
          setError("email", { type: "server", message: String(message) });
        }

        throw new Error(String(message));
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
      toast.success("Check your email to start your trial");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
          <p className="text-sm text-muted leading-relaxed">
            We sent a link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>.
            Open it and tap <strong className="text-foreground">Set password &amp; start trial</strong>{" "}
            to activate your 14-day Ndovu trial.
          </p>
        </div>
        <p className="text-xs text-muted">
          Didn&apos;t get it? Check spam, or{" "}
          <Link href="/login" className="text-brand-primary underline-offset-2 hover:underline">
            return to login
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none ring-brand-primary/30 transition focus:ring-2"
            placeholder="Jane"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none ring-brand-primary/30 transition focus:ring-2"
            placeholder="Doe"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none ring-brand-primary/30 transition focus:ring-2"
          placeholder="you@company.com"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <input
            id="acceptTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
            {...register("acceptTerms")}
          />
          <label htmlFor="acceptTerms" className="text-sm text-muted leading-relaxed">
            I agree to the{" "}
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline-offset-2 hover:underline"
            >
              Terms of Service
            </Link>
            ,{" "}
            <Link
              href="/legal/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            , and Data Policy.
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !acceptTerms}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Creating account…" : "Continue — send me the link"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-primary underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
