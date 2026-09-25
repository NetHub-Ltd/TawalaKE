"use client";

import { PlatformDashboard } from "@/features/platform/components/PlatformDashboard";

/**
 * Platform operator home (`/platform`).
 * Auth and data loading live in PlatformDashboard (client, platform JWT).
 */
export default function PlatformHomePage() {
  return <PlatformDashboard />;
}
