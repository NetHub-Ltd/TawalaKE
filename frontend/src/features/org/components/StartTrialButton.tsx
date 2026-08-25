"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function StartTrialButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/org/trial/start", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.detail || "Could not start trial");
      }
      toast.success("Trial started — check your email for the invoice");
      const onboarding = data?.data?.onboarding;
      if (onboarding) {
        router.replace("/org");
      } else {
        router.replace("/onboarding/organization");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Starting trial…" : "Start 7-day free trial"}
    </button>
  );
}
