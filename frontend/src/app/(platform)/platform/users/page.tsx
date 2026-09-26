import type { Metadata } from "next";
import { PlatformUsersPanel } from "@/features/platform/components/PlatformUsersPanel";

export const metadata: Metadata = {
  title: "Platform operators | Tawala",
  description: "Invite and manage platform operator accounts.",
  robots: { index: false, follow: false },
};

export default function PlatformUsersPage() {
  return <PlatformUsersPanel />;
}
