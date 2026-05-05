// // next.config.ts
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* High-Performance Production Settings */

//   // Enforce the new React Compiler (Stable in v16)
//   experimental: {
//     reactCompiler: true,
//   },

//   images: {
//     // Restrict your hostname patterns for security
//     // replacing "**" with actual providers when known.
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "**",
//       },
//     ],
//     // v16 Optimization: Optimized defaults for modern browsers
//     formats: ["image/avif", "image/webp"],
//   },

//   // v16 best practice: Ensure strict linting during builds
//   eslint: {
//     ignoreDuringBuilds: false,
//   },
// };

// export default nextConfig;

// next.config.ts
import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // swMinify: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // This empty object is the key to silencing the Turbopack error
  // while allowing the PWA Webpack logic to run.
  // experimental: {
  //   turbopack: {},
  // },
};

export default withPWA(nextConfig);
