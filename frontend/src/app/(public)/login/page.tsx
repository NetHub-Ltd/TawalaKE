// // src/app/login/page.tsx
// import React from 'react';
// import { Metadata } from 'next';
// import {LoginForm} from "@/features/auth/components/LoginForm";

// export const metadata: Metadata = {
//   title: 'Sign In | Operations & Inventory Management Console',
//   description: 'Log into your centralized corporate operations vault to run business analytics, product stock metrics, and billing workflows.',
//   alternates: { canonical: 'https://tawala.nethub.co.ke/login' }
// };

// export default function LoginPage() {
//   return (
//     <main id="main-content" className="min-h-screen flex bg-surface/20">
//       {/* Structural Column 1: Clean Form Module Layout */}
//       <section 
//         aria-label="User Authorization Form"
//         className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 shadow-xl z-10"
//       >
//         <LoginForm />
//       </section>

//       {/* Structural Column 2: Brand/Conversion Billboard Accent (Hidden on Mobile for speed/LCP optimization) */}
//       <section 
//         aria-hidden="true"
//         className="hidden md:flex md:w-[50%] bg-gradient-to-br from-brand-primary to-slate-900 relative items-center justify-center p-12 text-white overflow-hidden"
//       >
//         {/* Subtle decorative mesh network effect elements background overlay */}
//         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
//         <div className="max-w-md space-y-4 relative z-10">
//           <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mb-2">
//             <span className="font-mono text-xs font-black uppercase tracking-widest text-white/90">Platform Gateway</span>
//           </div>
//           <h2 className="text-3xl font-black tracking-tight leading-tight">
//             Unified Merchant Stock Operations
//           </h2>
//           <p className="text-sm text-white/70 leading-relaxed">
//             Monitor transaction variations, balance inventory discrepancies through physical audit cards, and evaluate historical vendor snapshots natively.
//           </p>
//         </div>
//       </section>
//     </main>
//   );
// }

// src/app/login/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: 'Sign In | Tawala - Take Control of Your Business',
  description: 'Log into Tawala to manage your sales, stock, staff, and finances effectively. Move your Kenyan biashara from manual chaos to organized growth.',
  alternates: { canonical: 'https://tawala.nethub.co.ke/login' }
};

export default function LoginPage() {
  return (
    <main id="main-content" className="min-h-screen flex bg-background">
      {/* Structural Column 1: Clean Form Module Layout */}
      <section 
        aria-label="User Authorization Form"
        className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-12 bg-card border-r border-border/40 shadow-xl z-10"
      >
        <LoginForm />
      </section>

      {/* Structural Column 2: Brand/Conversion Billboard Accent */}
      <section 
        aria-hidden="true"
        className="hidden md:flex md:w-[50%] bg-gradient-to-br from-brand-primary to-brand-primary/80 relative items-center justify-center p-12 text-white overflow-hidden"
      >
        {/* Subtle decorative grid network overlay matching the clean UI look */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-md space-y-6 relative z-10 text-center md:text-left">
          <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mb-2">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">
              Tawala biashara yako
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            From hustle to structure.
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-normal">
            Stop guessing and start knowing your numbers. Manage your sales, track your real-time stock, and hold your counter staff accountable with simple tools designed for Kenyan businesses.
          </p>
        </div>
      </section>
    </main>
  );
}