// 'use client';

// import * as React from 'react';
// import { cn } from '@/lib/utils';

// // ============================================================================
// // TYPE DEFINITIONS & VARIANT SPECIFICATIONS
// // ============================================================================
// export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   /**
//    * Visual aesthetic mapping to brand authority targets
//    * @default 'primary'
//    */
//   variant?: 'primary' | 'secondary' | 'outline';
//   /**
//    * Size configurations balancing layout density vs touch compatibility
//    * @default 'md'
//    */
//   size?: 'sm' | 'md' | 'lg';
//   /**
//    * Displays an animated loading spinner and disables interactions
//    * @default false
//    */
//   isLoading?: boolean;
// }

// export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   (
//     {
//       children,
//       className,
//       variant = 'primary',
//       size = 'md',
//       isLoading = false,
//       disabled,
//       type = 'button',
//       ...props
//     },
//     ref
//   ) => {
    
//     // Core structural resets utilizing global transition-all curves
//     const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-500 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

//     // Variant style matrix reading unified tokens directly from globals.css theme mapping
//     const variantStyles = {
//       primary: 'bg-brand-primary text-background hover:bg-brand-secondary focus-visible:outline-brand-primary shadow-lift hover:shadow-glow',
//       secondary: 'bg-brand-secondary text-background hover:bg-brand-primary focus-visible:outline-brand-secondary shadow-lift',
//       outline: 'bg-transparent border border-border text-foreground hover:bg-surface focus-visible:outline-brand-primary',
//     };

//     // Fitts's Law Target Map: Enforcing unified border configurations and touch bounds
//     const sizeStyles = {
//       /** Minimum 40px layout size optimized for compact components or micro header actions */
//       sm: 'min-h-[40px] px-4 py-2 text-xs rounded-xl',
//       /** Strict 48px target — The desktop and web application sweet spot for form density controls */
//       md: 'min-h-[48px] px-6 py-3 text-sm rounded-xl',
//       /** Heavy 56px landing page / core visual marketing checkout conversions */
//       lg: 'min-h-[56px] px-8 py-4 text-base rounded-2xl',
//     };

//     return (
//       <button
//         ref={ref}
//         type={type}
//         disabled={disabled || isLoading}
//         className={cn(
//           baseStyles,
//           variantStyles[variant],
//           sizeStyles[size],
//           className
//         )}
//         {...props}
//       >
//         {isLoading ? (
//           <span className="flex items-center gap-2">
//             {/* Optimized hardware-accelerated inline rendering spinner utilizing current color profiles */}
//             <svg
//               className="animate-spin h-4 w-4 text-current"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               aria-hidden="true"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//               />
//             </svg>
//             <span className="font-semibold text-xs tracking-wider uppercase">Processing...</span>
//           </span>
//         ) : (
//           children
//         )}
//       </button>
//     );
//   }
// );

// Button.displayName = 'Button';

"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS & VARIANT SPECIFICATIONS
// ============================================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual aesthetic mapping to brand authority targets
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline';
  /**
   * Size configurations balancing layout density vs touch compatibility
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Displays an animated loading spinner and disables interactions
   * @default false
   */
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    
    // Core structural resets utilizing native border-color configurations and clean focus curves
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-wider text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

    // Variant style matrix reading unified tokens directly from global system tokens
    const variantStyles = {
      primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lift border border-brand-primary/10',
      secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-lift border border-brand-secondary/10',
      outline: 'bg-transparent border border-border/80 text-foreground hover:bg-surface/60 hover:text-foreground',
    };

    // Fitts's Law Target Map: Enforcing unified border configurations and touch bounds
    const sizeStyles = {
      /** Minimum 40px layout size optimized for compact components or micro header actions */
      sm: 'h-10 px-4 text-[11px] rounded-xl gap-2',
      /** Strict 48px target — The desktop and web application sweet spot for form density controls */
      md: 'h-12 px-6 text-xs rounded-xl gap-2.5',
      /** Heavy 56px landing page / core visual marketing checkout conversions */
      lg: 'h-14 px-8 text-sm rounded-2xl gap-3',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <React.Fragment>
            {/* Optimized hardware-accelerated inline rendering spinner utilizing current color profiles */}
            <svg
              className="animate-spin h-4 w-4 text-current shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-black text-[10px] tracking-widest uppercase">
              Processing
            </span>
          </React.Fragment>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';