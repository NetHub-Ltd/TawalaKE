import Link from "next/link";
import {
  MessageCircle,
  Mail,
  HelpCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    detail: "Best for counter issues and quick how-to questions during business hours.",
    href: "https://wa.me/254700000000",
    cta: "Message on WhatsApp",
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    detail: "For account, billing, and detailed support requests. We reply on business days.",
    href: "mailto:support@nethub.co.ke",
    cta: "support@nethub.co.ke",
    external: true,
  },
] as const;

const TOPICS = [
  {
    title: "Getting started",
    body: "Trial signup, password setup, and first store configuration.",
    href: "/onboarding/personal-details",
  },
  {
    title: "Stock & theft controls",
    body: "PIN accountability, daily counts, and mismatch alerts.",
    href: "/blog/stop-stock-theft-small-shop-kenya",
  },
  {
    title: "M-Pesa & daily profit",
    body: "Reconciliation habits and true net profit at close of day.",
    href: "/blog/mpesa-reconciliation-retail-business",
  },
  {
    title: "Industry solutions",
    body: "Retail, pharmacy, hardware, and wholesale workflows.",
    href: "/solutions",
  },
] as const;

export default function SupportPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-16 text-center sm:px-6 lg:px-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
          <HelpCircle size={14} aria-hidden="true" />
          Support
        </p>
        <h1 className="text-h1 tracking-tight">
          Help for your <span className="text-gradient">biashara</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Running a shop is hard enough. Reach the Tawala team for account help,
          or use the guides below for stock, payments, and setup.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-h2 mb-4">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <a
                key={ch.title}
                href={ch.href}
                {...(ch.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">{ch.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{ch.detail}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-primary">
                  {ch.cta}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          Replace the WhatsApp number with your live support line before launch.
          Email uses the existing{" "}
          <span className="font-medium">support@nethub.co.ke</span> address.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-4 flex items-center gap-2 text-h2">
          <BookOpen size={22} aria-hidden="true" />
          Guides
        </h2>
        <ul className="space-y-3">
          {TOPICS.map((t) => (
            <li key={t.title}>
              <Link
                href={t.href}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-foreground">{t.title}</p>
                  <p className="mt-1 text-sm text-muted">{t.body}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-brand-primary"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 pt-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted">
          New to Tawala?{" "}
          <Link
            href="/onboarding/personal-details"
            className="font-semibold text-brand-primary hover:underline"
          >
            Start a 14-day free trial
          </Link>{" "}
          — no credit card required.
        </p>
      </section>
    </main>
  );
}
