import type { NextConfig } from "next";

function backendApiBase(): string {
  const raw = (process.env.BACKEND_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  );
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1:3000", "localhost:3000", "127.0.0.1"],
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Same-origin BFF for support WebSockets: browser → Next → BACKEND_URL.
   * BACKEND_URL is server-only (never NEXT_PUBLIC).
   * Hosting must forward WebSocket upgrade on these paths (k3s/nginx usually does).
   */
  async rewrites() {
    const api = backendApiBase();
    return [
      {
        source: "/api/v1/ws/:path*",
        destination: `${api}/ws/:path*`,
      },
    ];
  },

  /** Private conversation surfaces: keep out of search indexes. */
  async headers() {
    const noindex = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive, nosnippet",
      },
    ];
    return [
      { source: "/support/c/:path*", headers: noindex },
      { source: "/org/support", headers: noindex },
      { source: "/org/support/:path*", headers: noindex },
      { source: "/org/messages", headers: noindex },
      { source: "/org/messages/:path*", headers: noindex },
      { source: "/org/contact-us", headers: noindex },
    ];
  },
};

export default nextConfig;
