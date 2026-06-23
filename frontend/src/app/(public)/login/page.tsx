import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: 'Sign In | Tawala - Take Control of Your Business',
  description: 'Log into Tawala to manage your sales, stock, staff, and finances effectively. Move your Kenyan biashara from manual chaos to organized growth.',
  alternates: { canonical: 'https://tawala.nethub.co.ke/login' }
};

export default function LoginPage() {
  // JSON-LD structured data engine injection for structural clarity
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Tawala",
    "url": "https://tawala.nethub.co.ke",
    "applicationCategory": "BusinessApplication",
    "browserRequirements": "Requires HTML5 support",
    "description": "Business Management System designed for Kenyan SMEs to manage sales, stock, staff, and finances."
  };

  return (
    <>
      {/* Structural Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="min-h-screen flex bg-background">
        {/* Structural Column 1: Clean Form Module Layout */}
        <section 
          aria-label="User Authorization Form"
          className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-12 bg-card border-r border-border/40 shadow-xl z-10"
        >
          <LoginForm />
        </section>

        {/* Structural Column 2: Brand/Conversion Billboard Accent (Muted Elegant Slate Canvas Style) */}
        <section 
          aria-hidden="true"
          className="hidden md:flex md:w-[50%] bg-surface border-l border-border/10 relative items-center justify-center p-12 text-foreground overflow-hidden"
        >
          {/* Subtle signature decorative grid layer matching global canvas guidelines */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="max-w-md space-y-6 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center justify-center p-2.5 bg-foreground/5 rounded-xl border border-border/60 mb-2">
              <span className="font-sans text-xs font-black uppercase tracking-wider text-muted">
                Tawala biashara yako
              </span>
            </div>
            
            <h2 className="text-h2 font-extrabold tracking-tight leading-tight text-foreground">
              From hustle to structure.
            </h2>
            
            <p className="text-regular leading-relaxed font-normal text-muted">
              Stop guessing and start knowing your numbers. Manage your sales, track your real-time stock, and hold your counter staff accountable with simple tools designed for Kenyan businesses.
            </p>

            <div className="pt-2">
              <Link
                href="/features"
                className="inline-flex items-center justify-center bg-foreground text-background font-black uppercase text-xs tracking-wider h-11 px-6 rounded-xl border-2 border-foreground/10 hover:bg-foreground/90 transition-all shadow-xs min-h-[44px]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}