import { BrandLoader } from "@/lib/components/ui";

export default function OrgLoading() {
  return (
    <BrandLoader
      fullScreen
      size="md"
      label="Loading organization…"
      hint="Fetching your workspace"
    />
  );
}
