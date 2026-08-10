"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; // npm install sonner

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: `${data.firstName} ${data.lastName}`,
          email: data.email,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle field-level validation errors from the backend
        if (result.errors && typeof result.errors === "object") {
          Object.entries(result.errors).forEach(([field, message]) => {
            setError(field as keyof PersonalDetailsFormData, {
              type: "server",
              message: Array.isArray(message) ? message[0] : String(message),
            });
          });
        }

        throw new Error(
          result.message || result.error || "Something went wrong. Please try again."
        );
      }

      // Success
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      toast.success("Personal details saved successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      console.error("Failed to submit personal details:", err);
    }
  };

  // ─── Success State ───────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="text-center space-y-5 py-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Check your email
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We’ve sent a verification email to{" "}
            <span className="font-medium text-gray-900">{submittedEmail}</span>.
            <br />
            Please check your inbox (and spam folder) for the next instructions
            to proceed.
          </p>
        </div>

        <p className="text-xs text-gray-500">
          Didn’t receive the email?{" "}
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* First Name + Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName")}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent transition disabled:opacity-60"
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            {...register("lastName")}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent transition disabled:opacity-60"
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-transparent transition disabled:opacity-60"
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Terms */}
      <div className="rounded-xl bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
        <div className="flex items-start gap-3 pt-1">
          <input
            id="acceptTerms"
            type="checkbox"
            {...register("acceptTerms")}
            disabled={isSubmitting}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500 disabled:opacity-60"
          />
          <label htmlFor="acceptTerms" className="leading-snug">
            By creating an account, you agree to our{" "}
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Terms of Service
            </Link>
            ,{" "}
            <Link
              href="/legal/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Privacy Policy
            </Link>
            , and{" "}
            <Link
              href="/legal/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Data Policy
            </Link>
            .
          </label>
        </div>

        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !acceptTerms}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                   disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 
                   rounded-lg transition flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}