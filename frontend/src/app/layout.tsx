import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";
import { MonitorX } from "lucide-react"; // Import an elegant fallback indicator icon

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

// 1. FIXED: Simplified to lock the device viewport exclusively onto the Light Theme spectrum
export const viewport: Viewport = {
  themeColor: "#6366f1", // Fixed to Light mode --brand-primary (Indigo)
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "OmniPOS | High-Performance Cloud Commerce",
  description:
    "The enterprise-grade POS engine built for sub-second speeds and global multi-tenant scale.",
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
      className={`${geistSans.variable} ${jetBrainsMono.variable} light`} // Explicitly force light utility styles
      style={{ colorScheme: "light" }} // Prevent OS or browser native dark configuration overrides
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand-primary/20">
        <Providers>
          
          {/* 2. FIXED: Mobile Blocker Layer - Automatically triggered when screen size falls below 'md' */}
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

          {/* 3. FIXED: Desktop Core Shell Framework - Enforces fixed NavBar and Footer positioning */}
          <div className="hidden md:flex flex-col min-h-screen pt-14 pb-8">
            
            

            {/* LIVE SYSTEM APP INTERFACE STREAM */}
            <main id="main-content" className="flex-1 w-full bg-surface relative mt-2">
              {children}
            </main>

            {/* FIXED LIGHT BOTTOM FOOTER */}
            {/* <footer className="fixed bottom-0 left-0 right-0 h-8 bg-card border-t border-border/40 flex items-center justify-center text-[10px] font-mono font-medium text-muted z-50 tracking-wide select-none">
              OmniPOS Cloud Node &copy; {new Date().getFullYear()}. Secure Encryption Pipeline Active.
            </footer> */}

          </div>

        </Providers>
      </body>
    </html>
  );
}