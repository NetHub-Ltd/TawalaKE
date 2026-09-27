import type { Metadata } from "next";
import { PlatformPlansPanel } from "@/features/platform/components/PlatformPlansPanel";

export const metadata: Metadata = {
  title: "Platform plans | Tawala",
  description: "Subscription plan catalogue for platform operators.",
  robots: { index: false, follow: false },
};

export default function PlatformPlansPage() {
  return <PlatformPlansPanel />;
}
