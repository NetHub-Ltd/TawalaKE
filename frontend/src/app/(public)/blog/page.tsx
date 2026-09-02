import { Metadata } from "next";
import Link from "next/link";
import { articles } from "./articles";
import { ArrowRight, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Business Tips for Kenyan Shop Owners",
  description:
    "Practical guides on stock management, POS systems, M-Pesa reconciliation, and profit tracking for Kenyan SMEs.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Business Tips for Kenyan Shop Owners",
    description:
      "Practical guides on stock management, POS systems, M-Pesa reconciliation, and profit tracking for Kenyan SMEs.",
    url: "https://tawala.nethub.co.ke/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-h1 tracking-tight">
          Grow Your <span className="text-gradient">Biashara.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Practical guides for Kenyan shop owners, pharmacy managers, and
          wholesale distributors.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block"
            >
              <article className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                  <Calendar size={13} aria-hidden="true" />
                  <time dateTime={article.date}>{article.date}</time>
                  <span aria-hidden="true">·</span>
                  <span>{article.author}</span>
                </div>
                <h2 className="text-xl font-bold transition-colors group-hover:text-brand-primary">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">
                  {article.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-primary">
                  Read article
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
