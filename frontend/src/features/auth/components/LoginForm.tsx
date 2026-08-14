'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { loginAction, type LoginState } from '@/features/auth/actions/login';

const loginSchema = z.object({
  email: z.string().email('That doesn’t look like a valid email'),
  password: z.string().min(6, 'Password should be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Friendly rotating status while the server action runs */
const LOADING_MESSAGES = [
  'Checking your details…',
  'Securing your session…',
  'Almost there…',
];

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [shakeError, setShakeError] = useState(false);

  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Cycle loading copy so the wait feels alive
  useEffect(() => {
    if (!isPending) {
      setLoadingIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(id);
  }, [isPending]);

  // Gentle shake when the server returns an error
  useEffect(() => {
    if (!state?.error) return;
    setShakeError(true);
    const t = setTimeout(() => setShakeError(false), 500);
    return () => clearTimeout(t);
  }, [state?.error]);

  const onSubmit = (data: LoginFormValues) => {
    const formData = new FormData();
    formData.set('email', data.email);
    formData.set('password', data.password);
    formAction(formData);
  };

  const emailOk =
    touchedFields.email && !errors.email && Boolean(emailValue);
  const passwordOk =
    touchedFields.password && !errors.password && Boolean(passwordValue);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted/80">
          Sign in to continue managing your shop — sales, stock, and team in one
          place.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-4 transition-transform ${
          shakeError ? 'animate-pulse' : ''
        }`}
        noValidate
      >
        {/* Server error — human tone */}
        {state?.error && (
          <div
            className="flex gap-3 rounded-xl bg-destructive/10 p-4 border border-destructive/20 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold">We couldn’t sign you in</p>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {state.error}
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-muted mb-2"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-4 top-3.5 transition-colors ${
                emailOk ? 'text-brand-accent' : 'text-muted/50'
              }`}
              size={18}
            />
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              className="w-full pl-11 pr-10 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary
                         placeholder:text-muted/40 text-foreground transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="owner@mybusiness.co.ke"
            />
            {emailOk && (
              <CheckCircle2
                size={16}
                className="absolute right-4 top-3.5 text-brand-accent"
                aria-hidden
              />
            )}
          </div>
          {errors.email ? (
            <p className="text-destructive text-xs font-medium mt-1.5 pl-1">
              {errors.email.message}
            </p>
          ) : (
            <p className="text-[11px] text-muted/70 mt-1.5 pl-1">
              Use the email you registered with Tawala
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-muted"
            >
              Password
            </label>
            <Link
              href="/#"
              className="text-xs font-semibold text-brand-primary hover:underline outline-none focus:ring-1 focus:ring-brand-primary rounded"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className={`absolute left-4 top-3.5 transition-colors ${
                passwordOk ? 'text-brand-accent' : 'text-muted/50'
              }`}
              size={18}
            />
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isPending}
              className="w-full pl-11 pr-12 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary
                         placeholder:text-muted/40 text-foreground transition-all
                         disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              className="absolute right-4 top-3.5 text-muted/50 hover:text-foreground transition-colors outline-none focus:text-foreground disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs font-medium mt-1.5 pl-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit + live status */}
        <div className="space-y-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-70 text-white text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/10 min-h-[48px] disabled:cursor-wait"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{LOADING_MESSAGES[loadingIndex]}</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>

          {isPending && (
            <p className="text-center text-[11px] text-muted animate-pulse">
              Please wait — we’re logging you into your console
            </p>
          )}
        </div>
      </form>

      <footer className="text-center pt-2 space-y-4">
        <p className="text-sm text-muted/80">
          New to Tawala?{' '}
          <Link
            href="/onboarding/personal-details"
            className="font-bold text-brand-primary hover:underline"
          >
            Start free
          </Link>
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface/60 border border-border/40 rounded-full text-[11px] text-muted/70 mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Your login is encrypted and private</span>
        </div>
      </footer>
    </div>
  );
}