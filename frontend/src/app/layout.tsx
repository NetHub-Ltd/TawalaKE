import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tawala.nethub.co.ke"),
  title: {
    default: "Tawala | Tawala biashara yako",
    template: "%s | Tawala",
  },
  description:
    "Simple business management for Kenyan SMEs. Stop stock leakages, hold staff accountable with PIN login, and see your real daily net profit. Built for retail shops, minimarts, and pharmacies.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://tawala.nethub.co.ke",
    siteName: "Tawala",
    title: "Tawala | Tawala biashara yako",
    description:
      "Take control of your biashara. Track sales, stop stock leakages, and hold staff accountable — built for Kenyan shops.",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Tawala Business Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tawala | Tawala biashara yako",
    description:
      "Take control of your biashara. Track sales, stop stock leakages, and hold staff accountable — built for Kenyan shops.",
    images: ["/web-app-manifest-512x512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tawala",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${jetBrainsMono.variable} light`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-screen w-full text-foreground antialiased selection:bg-brand-primary/20 m-0 p-0">
        <Providers>
          <main id="main-content" className="min-h-screen w-full bg-surface relative">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
