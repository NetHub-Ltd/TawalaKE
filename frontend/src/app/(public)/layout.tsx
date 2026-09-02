import React from "react";
import NavBar from "@/lib/components/NavBar";

/**
 * Public marketing / onboarding shell.
 * Document scroll (not a locked nested viewport) so tall pages remain scrollable.
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
