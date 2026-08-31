import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://tawala.nethub.co.ke";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/solutions", "/support", "/login", "/onboarding", "/legal"],
        disallow: ["/org/", "/api/", "/themetest"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
