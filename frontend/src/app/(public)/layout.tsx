import React from "react";
import NavBar from "@/lib/components/NavBar";

/**
 * Public shell inside the root locked viewport (body/main overflow-hidden).
 * Navbar is fixed-height; content region scrolls so tall pages (e.g. plans) are not clipped.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col text-foreground antialiased">
      <NavBar />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {children}
      </div>
    </div>
  );
}
