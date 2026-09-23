import React from "react";
import { PlatformShell } from "@/features/platform/components/PlatformShell";

/**
 * Platform operator console — isolated from public marketing chrome.
 * Auth is platform JWT (sessionStorage), not tenant NextAuth.
 */
export default function PlatformRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell>{children}</PlatformShell>;
}
