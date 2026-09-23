import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://tawala.nethub.co.ke";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/solutions",
          "/solutions/",
          "/support",
          "/onboarding/plans",
          "/blog",
          "/blog/",
          "/legal",
          "/legal/",
        ],
        disallow: [
          "/org/",
          "/platform",
          "/platform/",
          "/api/",
          "/themetest",
          "/onboarding/personal-details",
          "/onboarding/set-password",
          "/onboarding/organization",
          "/invite/",
          "/auth/",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
