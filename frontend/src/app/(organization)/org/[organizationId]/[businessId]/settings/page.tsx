import type { Metadata } from "next";
import { BusinessSettingsForm } from "@/features/business/components/BusinessSettingsForm";

export const metadata: Metadata = {
  title: "Branch settings | Tawala",
  description: "Tax rate, receipt footer, and branch profile.",
};

export default function BusinessSettingsPage() {
  return <BusinessSettingsForm />;
}
