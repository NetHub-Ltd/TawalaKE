import React from "react";
import NavBar from "@/lib/components/NavBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased">
      {/* Sticky Top Bar (NavBar owns the single semantic <header> tag) */}
      <NavBar />

      {/* Main Content Area - Rendered cleanly below navbar without overlap */}
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}