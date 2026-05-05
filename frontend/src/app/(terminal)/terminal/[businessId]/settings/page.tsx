"use client";
// import { useBusinessContext } from "../layout";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";


export default function SettingsPage() {
  const { businessId, businessName } = useBusinessContext();

  return (
    <div>
      <h1>Settings for Business: {businessName}</h1>
      {/* Your settings logic here */}
    </div>
  );
}
