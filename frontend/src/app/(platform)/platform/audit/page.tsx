import type { Metadata } from "next";
import { PlatformAuditPanel } from "@/features/platform/components/PlatformAuditPanel";

export const metadata: Metadata = {
  title: "Platform audit | Tawala",
  description: "Audit event stream for platform operators.",
  robots: { index: false, follow: false },
};

export default function PlatformAuditPage() {
  return <PlatformAuditPanel />;
}
