"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Missing or invalid setup link. Please use the link from your email.");
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/onboarding/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: data.password }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          result.message ||
            result.error ||
            (typeof result.detail === "string" ? result.detail : null) ||
            "Unable to set password"
        );
      }

      toast.success("Password set — signing you in…");
      const email = typeof result.email === "string" ? result.email : "";
      if (email) {
        const signInResult = await signIn("credentials", {
          email,
          password: data.password,
          redirect: false,
        });
        if (signInResult?.error) {
          toast.message("Password saved. Please log in.");
          router.replace("/login");
          return;
        }
        router.replace("/org");
        return;
      }
      router.replace("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to set password";
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          This setup link is missing or invalid. Request a new account from the registration page,
          or log in if you already finished setup.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/onboarding/personal-details"
            className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 pr-12 text-sm text-foreground outline-none ring-brand-primary/30 transition focus:ring-2"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-xs text-muted hover:text-foreground"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 transition focus:ring-2"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Set password & continue"}
      </button>
    </form>
  );
}
