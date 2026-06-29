// app/(public)/layout.tsx
import React from "react";
// import NavBar from "@/components/NavBar"; // Adjust this path to your actual NavBar component
import NavBar from "@/lib/components/NavBar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 1. Your public navigation bar renders here */}
      {/* FIXED TOP NAVBAR */}
        <header className="fixed top-0 left-0 right-0 bg-card border-b border-border/40 flex items-center px-6 z-50">
        <div className="w-full ">
            <NavBar />
        </div>
        </header>
      
      {/* 2. Your route content (billing, features, home page) renders here */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}