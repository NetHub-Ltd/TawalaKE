'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        // callbackUrl: "/org"
      });

      if (result?.error) {
        setAuthError(result.error === "CredentialsSignin" 
          ? "Invalid email address or access password. Please try again." 
          : result.error
        );
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.refresh();
        router.push("/org");
      }
    } catch (error) {
      setAuthError("A network synchronization error occurred. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted/80">
          Enter your credentials to access your business console
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 text-xs font-semibold text-destructive animate-fade-in" role="alert">
            {authError}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-muted/50" size={18} />
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-11 pr-4 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-muted/40 text-foreground transition-all"
              placeholder="owner@mybusiness.co.ke"
            />
          </div>
          {errors.email && (
            <p className="text-destructive text-xs font-medium mt-1.5 pl-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted">
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
            <Lock className="absolute left-4 top-3.5 text-muted/50" size={18} />
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="w-full pl-11 pr-12 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-muted/40 text-foreground transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-muted/50 hover:text-foreground transition-colors outline-none focus:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-primary hover:bg-brand-primary/95 disabled:opacity-60 text-white text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/10 min-h-[48px] mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>Sign In to Console</span>
          )}
        </button>
      </form>

      {/* Secondary Conversion / Intent Footers */}
      <footer className="text-center pt-2 space-y-4">
        <p className="text-sm text-muted/80">
          Don&apos;t have an account?{' '}
          <Link href="/#" className="font-bold text-brand-primary hover:underline">
            Get Started Free
          </Link>
        </p>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface/60 border border-border/40 rounded-full text-[11px] text-muted/70 mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by enterprise encryption protocols</span>
        </div>
      </footer>
    </div>
  );
}