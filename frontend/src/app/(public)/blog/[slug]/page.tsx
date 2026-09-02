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

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: article.title,
    description: article.description,
    image: "https://tawala.nethub.co.ke/web-app-manifest-512x512.png",
    totalTime: "PT10M",
    step: article.content.slice(1).map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.includes(":")
        ? step.split(":")[0]
        : `Step ${i + 1}`,
      text: step,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <article className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
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
        </article>
      </main>
    </>
  );
}
