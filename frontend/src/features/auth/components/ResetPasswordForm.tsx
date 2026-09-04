"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  passwordConfirmSchema,
  type PasswordConfirmValues,
} from "@/lib/auth/password-policy";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams]
  );
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordConfirmValues>({
    resolver: zodResolver(passwordConfirmSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: PasswordConfirmValues) => {
    if (!token) {
      toast.error("Missing or invalid reset link. Request a new one.");
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: data.password }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (typeof result.message === "string" && result.message) ||
            (typeof result.error === "string" && result.error) ||
            (typeof result.detail === "string" && result.detail) ||
            "Unable to reset password. The link may be invalid or expired."
        );
      }

      setDone(true);
      toast.success("Password updated — you can sign in now");
      router.prefetch("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          This reset link is missing or invalid. Request a new link from the forgot-password
          page.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/forgot-password"
            className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Request new link
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted">
          Your password has been updated. Sign in with your new password to continue.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 pr-12 text-sm text-foreground outline-none ring-brand-primary/30 transition focus:ring-2 disabled:opacity-60"
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
        {errors.password && (
          <p className="text-sm text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
        <p className="text-[11px] text-muted">At least 8 characters.</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-brand-primary/30 transition focus:ring-2 disabled:opacity-60"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600" role="alert">
            {errors.confirmPassword.message}
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
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}
