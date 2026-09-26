import type { Metadata } from "next";
import { OrgPermissionsPolicy } from "@/features/org/components/OrgPermissionsPolicy";

export const metadata: Metadata = {
  title: "Permission policy | Tawala",
  description: "Organization-wide permission policy for team roles.",
};

export default function OrgPermissionsPage() {
  return (
    <div className="p-4 sm:p-6">
      <OrgPermissionsPolicy />
    </div>
  );
}
