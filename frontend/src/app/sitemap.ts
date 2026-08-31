import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tawala.nethub.co.ke";

  const publicRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/solutions", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/support", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/login", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/onboarding/plans", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/policy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return publicRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
