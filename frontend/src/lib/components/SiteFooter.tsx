import Link from "next/link";
import Image from "next/image";

const PRODUCT = [
  { name: "Pricing", href: "/pricing" },
  { name: "Solutions", href: "/solutions" },
  { name: "Retail", href: "/solutions/retail" },
  { name: "Pharmacies", href: "/solutions/pharmacy" },
] as const;

const COMPANY = [
  { name: "Blog", href: "/blog" },
  { name: "Support", href: "/support" },
  { name: "Log in", href: "/login" },
  { name: "Start free trial", href: "/onboarding/personal-details" },
] as const;

const LEGAL = [
  { name: "Terms of service", href: "/legal/terms" },
  { name: "Privacy policy", href: "/legal/privacy" },
  { name: "Data policy", href: "/legal/policy" },
] as const;

/**
 * Public marketing footer — canonical tokens, shared across (public) routes.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-base font-semibold tracking-tight">
                Tawala
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Tawala biashara yako. Modern retail OS for Kenyan shops — sales,
              stock, staff PINs, and real daily profit.
            </p>
            <p className="mt-4 text-xs text-muted">
              Built by{" "}
              <span className="font-medium text-foreground">Nethub</span>
              {" · "}
              <a
                href="https://tawala.nethub.co.ke"
                className="font-medium text-brand-primary hover:underline"
              >
                tawala.nethub.co.ke
              </a>
            </p>
            <p className="mt-2 text-xs text-muted">
              Questions?{" "}
              <Link
                href="/support"
                className="font-medium text-brand-primary hover:underline"
              >
                Support centre
              </Link>
              {" · "}
              <a
                href="mailto:support@nethub.co.ke"
                className="font-medium text-brand-primary hover:underline"
              >
                support@nethub.co.ke
              </a>
            </p>
          </div>

          {/* Product */}
          <nav className="lg:col-span-2" aria-label="Product">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground transition-colors hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav className="lg:col-span-3" aria-label="Company">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Get started
            </p>
            <ul className="mt-4 space-y-2.5">
              {COMPANY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground transition-colors hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav className="lg:col-span-3" aria-label="Legal">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground transition-colors hover:text-brand-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} Tawala · Nethub. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-accent"
                aria-hidden
              />
              Made for Kenyan retail
            </span>
            <Link
              href="/onboarding/personal-details"
              className="font-semibold text-brand-primary hover:underline"
            >
              Start free trial →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
