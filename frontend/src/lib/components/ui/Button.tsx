"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default 'primary' */
  variant?: "primary" | "secondary" | "success" | "outline" | "ghost";
  /** @default 'md' — md is 48px touch target */
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * Canonical retail OS button.
 * Primary = petrol command · Secondary = terracotta void · Success = mint settle.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold text-center transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer rounded-md";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-brand-primary text-white hover:opacity-90 border border-transparent shadow-none",
      secondary:
        "bg-brand-secondary text-white hover:opacity-90 border border-transparent",
      success:
        "bg-brand-accent text-white hover:opacity-90 border border-transparent",
      outline:
        "bg-transparent border border-border text-foreground hover:bg-register",
      ghost: "bg-transparent text-foreground hover:bg-register border border-transparent",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-10 px-4 text-xs",
      md: "h-12 px-6 text-sm",
      lg: "h-14 px-8 text-sm",
    };

    return (
      <button
        ref={ref}
        type={type || "button"}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" className="text-current" />
            <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
