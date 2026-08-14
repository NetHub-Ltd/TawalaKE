import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";
import { MonitorX } from "lucide-react";

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
  title: "OmniPOS | High-Performance Cloud Commerce",
  description: "The enterprise-grade POS engine built for sub-second speeds and global multi-tenant scale.",
  metadataBase: new URL("https://tawala.nethub.co.ke"),
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tawala Business Management System",
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
      <body className="h-screen w-screen bg-background text-foreground antialiased selection:bg-brand-primary/20 overflow-hidden m-0 p-0">
        <Providers>
          
          {/* Mobile Blocker Layer */}
          <div className="flex md:hidden fixed inset-0 bg-background flex-col items-center justify-center p-6 text-center z-[100] font-sans">
            <div className="h-10 w-10 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl flex items-center justify-center">
              <MonitorX size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Display Resolution Not Supported
              </h2>
              <p className="text-[11px] text-muted max-w-xs mt-1 leading-relaxed font-medium">
                The OmniPOS checkout platform is optimized strictly for widescreen terminal environments. Please maximize your view space or connect via a desktop workspace interface.
              </p>
            </div>
          </div>

          {/* DESKTOP SHELL FRAMEWORK: Locked down to prevent window leaks */}
          <div className="hidden md:flex flex-col h-full w-full overflow-hidden relative">
            {/* LIVE SYSTEM APP INTERFACE STREAM */}
            <main id="main-content" className="flex-1 w-full h-full bg-surface relative overflow-hidden">
              {children}
            </main>
          </div>

        </Providers>
      </body>
    </html>
  );
}