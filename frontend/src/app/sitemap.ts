import type { MetadataRoute } from "next";
import { articles } from "./(public)/blog/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tawala.nethub.co.ke";

  const routes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/solutions", priority: 0.9, changeFrequency: "weekly" },
    { path: "/solutions/retail", priority: 0.85, changeFrequency: "weekly" },
    { path: "/solutions/pharmacy", priority: 0.85, changeFrequency: "weekly" },
    { path: "/solutions/hardware", priority: 0.85, changeFrequency: "weekly" },
    { path: "/solutions/wholesale", priority: 0.85, changeFrequency: "weekly" },
    { path: "/onboarding/plans", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/support", priority: 0.7, changeFrequency: "monthly" },
    { path: "/login", priority: 0.6, changeFrequency: "monthly" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/policy", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries = routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogEntries = articles.map((article) => ({
    url: `${base}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
