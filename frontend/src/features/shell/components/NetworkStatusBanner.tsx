"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * App-wide offline indicator. Does not block UI; makes degraded state visible.
 */
export function NetworkStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[90] flex items-center justify-center gap-2 border-b border-[var(--error)]/30 bg-[var(--error-container)] px-3 py-2 text-center text-xs font-semibold text-[var(--error)]"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>You appear to be offline. Some actions may fail until connection returns.</span>
    </div>
  );
}
