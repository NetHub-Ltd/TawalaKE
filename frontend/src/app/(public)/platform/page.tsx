"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
} from "@/lib/platform/auth";

/**
 * Minimal platform landing after MFA login.
 * Org admin UI lands in #300; this confirms session only.
 */
export default function PlatformHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = getPlatformAccessToken();
    setAuthed(Boolean(token));
    setReady(true);
    if (!token) {
      router.replace("/platform/login");
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Checking session…</span>
      </div>
    );
  }

  if (!authed) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-h3 text-foreground">Platform console</h1>
        <p className="text-sm text-muted">
          You are signed in as a platform operator. Organization tools will
          appear here next (cleanup list &amp; hard delete).
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearPlatformSession();
            router.replace("/platform/login");
          }}
        >
          Sign out
        </Button>
      </div>
    </main>
  );
}
