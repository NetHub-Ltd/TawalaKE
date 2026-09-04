import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "../articles";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Not Found" };
  return {
    title: `${article.title} | Tawala Blog`,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://tawala.nethub.co.ke/blog/${article.slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return notFound();

  const base = "https://tawala.nethub.co.ke";
  const url = `${base}/blog/${article.slug}`;

  const stepParagraphs = article.content.filter((p) =>
    /^Step\s+\d+/i.test(p.trim()),
  );

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: {
      "@type": "Organization",
      name: article.author,
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "Tawala",
      logo: {
        "@type": "ImageObject",
        url: `${base}/web-app-manifest-512x512.png`,
      },
    },
    image: `${base}/web-app-manifest-512x512.png`,
    mainEntityOfPage: url,
    keywords: article.tags.join(", "),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${base}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  };

  const howToLd =
    stepParagraphs.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: article.title,
          description: article.description,
          image: `${base}/web-app-manifest-512x512.png`,
          step: stepParagraphs.map((step, i) => {
            const colon = step.indexOf(":");
            const name =
              colon > 0 && colon < 80
                ? step.slice(0, colon).trim()
                : `Step ${i + 1}`;
            return {
              "@type": "HowToStep",
              position: i + 1,
              name,
              text: step,
            };
          }),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {howToLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      ) : null}
      <main className="min-h-screen w-full bg-background text-foreground">
        <article className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-brand-primary">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="hover:text-brand-primary">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground line-clamp-1">{article.title}</li>
            </ol>
          </nav>
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-primary"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to blog
          </Link>
          <div className="mb-4 flex items-center gap-2 text-xs text-muted">
            <Calendar size={13} aria-hidden="true" />
            <time dateTime={article.date}>{article.date}</time>
            <span aria-hidden="true">·</span>
            <span>{article.author}</span>
          </div>
          <h1 className="text-h1 tracking-tight">{article.title}</h1>
          <p className="mt-4 text-lg text-muted">{article.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary"
              >
                <Tag size={12} aria-hidden="true" />
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-10 space-y-6">
            {article.content.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm text-muted">
              Ready to put these controls into practice?{" "}
              <Link
                href="/onboarding/personal-details"
                className="font-semibold text-brand-primary hover:underline"
              >
                Start a 14-day free trial
              </Link>{" "}
              or explore{" "}
              <Link
                href="/solutions"
                className="font-semibold text-brand-primary hover:underline"
              >
                industry solutions
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
