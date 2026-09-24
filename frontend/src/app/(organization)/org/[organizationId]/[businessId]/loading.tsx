import { BrandLoader } from "@/lib/components/ui";

/**
 * Branch workspace loading — blur only; layout chrome visible as outlines.
 */
export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 z-50" aria-busy="true" aria-live="polite">
      {/* No tint — only blur so existing terminal chrome can show through when present */}
      <BrandLoader
        overlay
        size="lg"
        label="Opening branch…"
        hint="Products and cart will appear in a moment"
      />
    </div>
  );
}
