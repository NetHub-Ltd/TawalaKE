import React from "react";
import NavBar from "@/lib/components/NavBar";
import SiteFooter from "@/lib/components/SiteFooter";

/**
 * Public routes (marketing, auth, onboarding, legal, blog).
 * NavBar is position:fixed — content needs top offset (h-14 / sm:h-16).
 *
 * Phase F: inherits canonical tokens; must not redefine shell CSS variables.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-shell="public"
      className="flex min-h-dvh w-full flex-col bg-background text-foreground antialiased"
    >
      <NavBar />
      {/* Matches NavBar height: h-14 mobile, sm:h-16 desktop */}
      <div className="h-14 shrink-0 sm:h-16" aria-hidden="true" />
      <div className="w-full flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
