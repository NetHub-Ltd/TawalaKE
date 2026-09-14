import React from "react";
import NavBar from "@/lib/components/NavBar";

/**
 * Public routes (marketing, auth, onboarding, legal, blog).
 *
 * Phase F isolation rules:
 * - Inherits canonical tokens from root `globals.css` / body surface.
 * - MUST NOT redefine CSS variables (--brand-*, --background, fonts).
 * - Marketing pages may use denser prose and layout patterns, but chrome
 *   colors/type must stay on semantic tokens (see AGENTS.md §5, theme.md).
 * - Org app shells under (organization) keep their own locked layouts.
 * - Document scroll (not a locked nested viewport).
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
      <div className="w-full flex-1">{children}</div>
    </div>
  );
}
