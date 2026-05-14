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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move reactCompiler out of experimental
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

  // eslint: {
  //   ignoreDuringBuilds: false,
  // },
};

export default nextConfig;