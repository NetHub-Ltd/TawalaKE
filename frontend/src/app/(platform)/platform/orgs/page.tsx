import type { Metadata } from "next";
import { PlatformOrgsPanel } from "@/features/platform/components/PlatformOrgsPanel";

export const metadata: Metadata = {
  title: "Platform organizations | Tawala",
  description: "List and hard-delete organizations as a platform operator.",
  robots: { index: false, follow: false },
};

export default function PlatformOrgsPage() {
  return <PlatformOrgsPanel />;
}
