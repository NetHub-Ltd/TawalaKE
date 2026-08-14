import React from "react";
import NavBar from "@/lib/components/NavBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col">
      {/* FIXED TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-card border-b border-border/40 flex items-center px-6 z-50">
        <div className="w-full">
          <NavBar />
        </div>
      </header>
      
      {/* ROUTE CONTENT SPACE */}
      <main className="flex-1 mt-20 pb-12">
        {children}
      </main>
    </div>
  );
}