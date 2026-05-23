// components/Header.tsx
import Link from "next/link";
import { Terminal } from "lucide-react";

export default function Header() {
  return (
    <>
      {/* Accessibility: Skip link for keyboard navigation focus */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-xs"
      >
        Skip to main content
      </a>

      <header className="w-full flex items-center justify-between pb-6 border-b border-border shrink-0 z-10">
        {/* Brand Architecture */}
        <Link href="/" className="flex items-center gap-3 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:brightness-110 transition-all">
            <Terminal size={20} aria-hidden="true" />
          </div>
          <div>
            <span className="text-base font-black text-foreground tracking-tight block">TAWALA</span>
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-secondary block leading-none">Business Management and Operating System</span>
          </div>
        </Link>

        {/* Marketing & System Navigation */}
        <nav className="flex items-center gap-6" aria-label="Main Navigation">
          <ul className="hidden md:flex items-center gap-6 text-xs font-bold text-secondary tracking-wide uppercase">
            <li>
              <Link href="/features" className="hover:text-foreground transition-colors outline-none focus-visible:text-primary">
                Features
              </Link>
            </li>
            <li>
              <Link href="/billing" className="hover:text-foreground transition-colors outline-none focus-visible:text-primary">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-foreground transition-colors outline-none focus-visible:text-primary">
                Support
              </Link>
            </li>
          </ul>

          {/* <div className="flex items-center gap-4 pl-0 md:pl-4 border-l-0 md:border-l md:border-border">
            <span className="text-xs font-semibold text-secondary hidden sm:inline-block">
              System Status: <span className="text-emerald-500 font-bold">Operational</span>
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          </div> */}
        </nav>
      </header>
    </>
  );
}