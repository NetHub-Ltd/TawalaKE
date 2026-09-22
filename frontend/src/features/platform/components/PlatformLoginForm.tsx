"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  platformLogin,
  platformResendCode,
  platformVerifyCode,
  setPlatformSession,
} from "@/lib/platform/auth";

type Step = "password" | "code";

const RESEND_COOLDOWN_SEC = 60;

/**
 * Two-step platform operator login: password → email MFA code.
 * Uses dedicated sessionStorage keys (not staff NextAuth).
 */
export function PlatformLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const onPasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        clearPlatformSession();
        const challenge = await platformLogin(email.trim(), password);
        setChallengeId(challenge.challenge_id);
        setEmailHint(challenge.email_hint);
        setStep("code");
        setCode("");
        setResendIn(RESEND_COOLDOWN_SEC);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Sign-in failed. Try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [email, password]
  );

  const onCodeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!challengeId) return;
      setError(null);
      setLoading(true);
      try {
        const token = await platformVerifyCode(challengeId, code.trim());
        setPlatformSession(token.access_token, token.expires_at);
        router.replace("/platform");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Incorrect or expired code. Try again.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [challengeId, code, router]
  );

  const onResend = useCallback(async () => {
    if (!challengeId || resendIn > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const challenge = await platformResendCode(challengeId);
      setChallengeId(challenge.challenge_id);
      setEmailHint(challenge.email_hint);
      setResendIn(RESEND_COOLDOWN_SEC);
      setCode("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not resend code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [challengeId, resendIn, loading]);

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="text-h3 text-foreground">Platform sign in</h1>
        <p className="text-sm text-muted">
          {step === "password"
            ? "Operator access for NetHub / Tawala platform staff. Not for store accounts."
            : `Enter the code sent to ${emailHint || "your email"}.`}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm text-foreground"
        >
          {error}
        </div>
      ) : null}

      {step === "password" ? (
        <form onSubmit={onPasswordSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="platform-email">Email</Label>
            <Input
              id="platform-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nethub.co.ke"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-password">Password</Label>
            <Input
              id="platform-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loading}
            disabled={loading || !email || password.length < 8}
          >
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={onCodeSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="platform-code">Verification code</Label>
            <Input
              id="platform-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={8}
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="6-digit code"
              disabled={loading}
              className="tracking-[0.3em] text-center text-h4 tabular"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loading}
            disabled={loading || code.length < 6}
          >
            Verify and sign in
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline disabled:opacity-40"
              onClick={onResend}
              disabled={loading || resendIn > 0}
            >
              {resendIn > 0
                ? `Resend code in ${resendIn}s`
                : "Resend code"}
            </button>
            <button
              type="button"
              className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => {
                setStep("password");
                setChallengeId(null);
                setCode("");
                setError(null);
              }}
              disabled={loading}
            >
              Use a different account
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
          <Spinner className="h-3.5 w-3.5" />
          {step === "password" ? "Checking credentials…" : "Verifying code…"}
        </p>
      ) : null}
    </div>
  );
}
