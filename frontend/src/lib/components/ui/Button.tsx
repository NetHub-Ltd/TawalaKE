// "use client";

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
    
//     // Core structural resets utilizing native border-color configurations and clean focus curves
//     const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-wider text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

//     // Variant style matrix reading unified tokens directly from global system tokens
//     const variantStyles = {
//       primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lift border border-brand-primary/10',
//       secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-lift border border-brand-secondary/10',
//       outline: 'bg-transparent border border-border/80 text-foreground hover:bg-surface/60 hover:text-foreground',
//     };

//     // Fitts's Law Target Map: Enforcing unified border configurations and touch bounds
//     const sizeStyles = {
//       /** Minimum 40px layout size optimized for compact components or micro header actions */
//       sm: 'h-10 px-4 text-[11px] rounded-xl gap-2',
//       /** Strict 48px target — The desktop and web application sweet spot for form density controls */
//       md: 'h-12 px-6 text-xs rounded-xl gap-2.5',
//       /** Heavy 56px landing page / core visual marketing checkout conversions */
//       lg: 'h-14 px-8 text-sm rounded-2xl gap-3',
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
//           <React.Fragment>
//             {/* Optimized hardware-accelerated inline rendering spinner utilizing current color profiles */}
//             <svg
//               className="animate-spin h-4 w-4 text-current shrink-0"
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
//                 strokeWidth="3"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//               />
//             </svg>
//             <span className="font-black text-[10px] tracking-widest uppercase">
//               Processing
//             </span>
//           </React.Fragment>
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
      type, // Removed hardcoded default assignment from destructured assignment to prevent overrides
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
        // Enforce native browser layout defaults ('submit') if type is omitted or undefined
        type={type || 'submit'}
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
            <span className="font-black text-[10px] tracking-widest uppercase ml-2">
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