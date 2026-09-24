import { BrandLoader } from "@/lib/components/ui";

/**
 * Branch workspace route loading — brand pulse, plain language.
 */
export default function LoadingScreen() {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
    >
      <BrandLoader
        size="lg"
        label="Opening branch…"
        hint="Products and cart will appear in a moment"
      />
    </div>
  );
}
