import React from "react";
import NavBar from "@/lib/components/NavBar";

/**
 * Public routes (marketing, auth, onboarding): document scroll.
 * Do not use h-full / nested overflow traps — parent height is not a fixed viewport.
 * Org app shells under (organization) keep their own locked layouts.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground antialiased">
      <NavBar />
      <div className="w-full flex-1">{children}</div>
    </div>
  );
}
