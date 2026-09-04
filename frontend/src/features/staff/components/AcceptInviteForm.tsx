"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  passwordConfirmSchema,
  type PasswordConfirmValues,
} from "@/lib/auth/password-policy";

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
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
      toast.error("Missing invite link. Ask a team manager to resend.");
      return;
    }
    try {
      const res = await fetch("/api/v1/auth/staff-invite/accept", {
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
            "Unable to accept invite. The link may be invalid or expired."
        );
      }
      setDone(true);
      toast.success("Password set — you can sign in now");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          This invite link is missing or invalid. Ask a team manager to resend your
          invite from the staff page.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm text-muted">
          Your password is set. Sign in with your email and new password to continue.
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
          Password
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
            Activating…
          </>
        ) : (
          "Set password & join"
        )}
      </button>
    </form>
  );
}
