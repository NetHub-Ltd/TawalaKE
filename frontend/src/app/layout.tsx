import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

// Premium interface typography designed for ultra-crisp scaling and a modern professional feel
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// High-performance tabular mono font optimized for financial registers, currency, and stock codes
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Syncing viewport themeColor perfectly with your updated playful-pro brand colors
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" }, // Maps to Light --brand-primary (Indigo)
    { media: "(prefers-color-scheme: dark)", color: "#818cf8" }   // Maps to Dark --brand-primary (Indigo Muted)
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "OmniPOS | High-Performance Cloud Commerce",
  description:
    "The enterprise-grade POS engine built for sub-second speeds and global multi-tenant scale.",
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
      className={`${geistSans.variable} ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
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