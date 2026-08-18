'use client';

import React, { useState, useActionState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { loginAction, type LoginState } from '@/features/auth/actions/login';

const loginSchema = z.object({
  email: z.string().email('That doesn’t look like a valid email'),
  password: z.string().min(6, 'Password should be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LOADING_MESSAGES = [
  'Checking your details…',
  'Securing your session…',
  'Almost there…',
];

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Manual transition state to lock UI instantly upon click
  const [isPendingTransition, startTransition] = useTransition();

  const [state, formAction, isActionPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  // Single truth for pending state prevents micro-task state gaps
  const isLoading = isSubmitting || isActionPending || isPendingTransition;

  const emailValue = watch('email');
  const passwordValue = watch('password');

  useEffect(() => {
    if (!isLoading) {
      setLoadingIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(id);
  }, [isLoading]);

  const onSubmit = (data: LoginFormValues) => {
    if (isLoading) return; // Strict execution lock

    startTransition(() => {
      const formData = new FormData();
      formData.set('email', data.email);
      formData.set('password', data.password);
      formAction(formData);
    });
  };

  const emailOk = touchedFields.email && !errors.email && Boolean(emailValue);
  const passwordOk = touchedFields.password && !errors.password && Boolean(passwordValue);

  return (
    <motion.div 
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-6"
    >
      <header className="space-y-1.5 text-center sm:text-left">
        <h1 className="text-h2 font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted">
          Sign in to continue managing your shop sales, stock, and team.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-busy={isLoading}
      >
        {/* Animated Server Error Banner */}
        <AnimatePresence mode="wait">
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ 
                opacity: 1, 
                height: 'auto', 
                y: 0,
                x: [0, -6, 6, -4, 4, 0] // Playful shake sequence on mount
              }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div
                className="flex gap-3 rounded-xl bg-red-500/10 p-4 border border-red-500/20 text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">We couldn’t sign you in</p>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {state.error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className={`absolute left-4 top-3.5 transition-colors duration-200 ${
                emailOk ? 'text-brand-accent' : 'text-muted/50'
              }`}
              size={18}
              aria-hidden="true"
            />
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : 'email-hint'}
              className="w-full pl-11 pr-10 py-3 bg-surface/60 border border-border/80 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         placeholder:text-muted/40 text-foreground transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
              placeholder="owner@mybusiness.co.ke"
            />
            
            <AnimatePresence>
              {emailOk && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute right-4 top-4 text-brand-accent pointer-events-none"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {errors.email ? (
            <p id="email-error" className="text-red-500 text-xs font-medium pl-1" role="alert">
              {errors.email.message}
            </p>
          ) : (
            <p id="email-hint" className="text-[11px] text-muted/70 pl-1">
              Use the email registered with Tawala
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-muted"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-primary hover:underline outline-none focus:ring-2 focus:ring-brand-primary/40 rounded px-1 py-0.5 transition-all"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className={`absolute left-4 top-3.5 transition-colors duration-200 ${
                passwordOk ? 'text-brand-accent' : 'text-muted/50'
              }`}
              size={18}
              aria-hidden="true"
            />
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className="w-full pl-11 pr-12 py-3 bg-surface/60 border border-border/80 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                         placeholder:text-muted/40 text-foreground transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
              placeholder="Your password"
            />
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3.5 top-3 text-muted/60 hover:text-foreground transition-colors outline-none focus:ring-2 focus:ring-brand-primary/40 rounded-lg p-1 disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.button>
          </div>
          
          {errors.password && (
            <p id="password-error" className="text-red-500 text-xs font-medium pl-1" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 space-y-2">
          <motion.button
            whileHover={!isLoading ? { scale: 1.01 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white text-sm font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/15 min-h-[48px] disabled:opacity-70 disabled:cursor-wait disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-white" size={18} aria-hidden="true" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={loadingIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    aria-live="polite"
                  >
                    {LOADING_MESSAGES[loadingIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Sign in</span>
                <ArrowRight size={16} />
              </span>
            )}
          </motion.button>

          {isLoading && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[11px] text-muted animate-pulse" 
              aria-live="polite"
            >
              Please wait — authenticating your session
            </motion.p>
          )}
        </div>
      </form>

      {/* Conversion Footer Link */}
      <footer className="text-center pt-2">
        <p className="text-sm text-muted">
          New to Tawala?{' '}
          <Link
            href="/onboarding/personal-details"
            className="font-bold text-brand-primary hover:underline outline-none focus:ring-2 focus:ring-brand-primary/40 rounded px-1 py-0.5 transition-all"
          >
            Start free
          </Link>
        </p>
      </footer>
    </motion.div>
  );
}