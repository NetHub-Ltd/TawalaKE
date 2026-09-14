import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#003F4E",
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
      className={`${inter.variable} ${plusJakarta.variable} ${jetBrainsMono.variable} light`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
