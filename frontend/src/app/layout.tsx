// import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import { Providers } from "@/lib/providers"; // Assuming standard lib structure
// import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
//   display: "swap",
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
//   display: "swap",
// });

// export const viewport: Viewport = {
//   themeColor: "#2563eb",
//   width: "device-width",
//   initialScale: 1,
//   maximumScale: 5, // WCAG compliance for accessibility
// };

// export const metadata: Metadata = {
//   title: "OmniPOS | High-Performance Cloud Commerce",
//   description:
//     "The enterprise-grade POS engine built for sub-second speeds and global scale.",
//   metadataBase: new URL("https://omnipos.io"), // Replace with actual domain
//   alternates: { canonical: "/" },
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "default",
//     title: "OmniPOS",
//   },
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html
//       lang="en"
//       className={`${geistSans.variable} ${geistMono.variable}`}
//       suppressHydrationWarning
//     >
//       <body className="min-h-screen bg-background text-foreground selection:bg-primary/20">
//         <Providers>
//           {/* Main Landmark for SEO/a11y */}
//           <main id="main-content" className="relative flex flex-col">
//             {children}
//           </main>
//         </Providers>
//       </body>
//     </html>
//   );
// }

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

// Premium interface typography designed for dense SaaS dashboards and legibility
const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
});

// High-performance tabular mono font optimized for financial records, tables, and statistics
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Viewport settings supporting full user scalability for strict accessibility (WCAG AA compliance)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" }, // Maps to Light --brand-primary
    { media: "(prefers-color-scheme: dark)", color: "#818cf8" }   // Maps to Dark --brand-primary
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "OmniPOS | High-Performance Cloud Commerce",
  description:
    "The enterprise-grade POS engine built for sub-second speeds and global scale.",
  metadataBase: new URL("https://omnipos.io"),
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OmniPOS",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      {/* Note: Standardized background behavior is defined inside your globals.css @layer base body hooks.
        We do not hardcode 'bg-background' here so that the platform correctly drops down to 'var(--surface)' 
        automatically, enabling your distinct layered lifting card pattern across dashboards.
      */}
      <body className="min-h-screen antialiased selection:bg-brand-primary/20">
        <Providers>
          {/* Main Structural Landmark ensuring standard accessible layout parsing */}
          <main id="main-content" className="relative flex flex-col min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}