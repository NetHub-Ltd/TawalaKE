'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, Link2 } from 'lucide-react';
import { z } from 'zod';

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
    setIsLoading(false);
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Dynamic Security Verification Alert Catch */}
      {authError && (
        <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 text-xs font-semibold text-destructive animate-fade-in" role="alert">
          {authError}
        </div>
      )}

      {/* Email Input Field */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-muted/60" size={18} />
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className="w-full pl-11 pr-4 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-muted/50 text-foreground transition-all"
            placeholder="owner@mybusiness.co.ke"
          />
        </div>
        {errors.email && (
          <p className="text-destructive text-xs font-medium mt-1.5 pl-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Input Field */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-muted/60" size={18} />
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full pl-11 pr-12 py-3 bg-surface/40 dark:bg-surface/10 border border-border/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-muted/50 text-foreground transition-all"
            placeholder="password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-muted/60 hover:text-foreground transition-colors"
            tabIndex={-1}
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

      {/* Primary Submit Action Trigger */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white text-sm font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/10"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Logging You In...</span>
          </>
        ) : (
          <span>Secure Sign In</span>
        )}
      </button>
    </form>
  );
}