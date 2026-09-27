"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
  listPlatformAuditEvents,
  type PlatformAuditEvent,
} from "@/lib/platform/auth";

const PAGE_SIZE = 40;

/**
 * Platform audit event stream (Phase B) — read-only.
 */
export function PlatformAuditPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PlatformAuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextOffset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listPlatformAuditEvents({
          limit: PAGE_SIZE,
          offset: nextOffset,
          action: actionFilter.trim() || undefined,
          actor_email: emailFilter.trim() || undefined,
        });
        setItems(data.items);
        setTotal(data.total);
        setOffset(data.offset);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          clearPlatformSession();
          router.replace("/platform/login");
          return;
        }
        if (status === 403) {
          setError(
            "You do not have permission to read audit events (platform:audit:read)."
          );
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load audit");
      } finally {
        setLoading(false);
      }
    },
    [router, actionFilter, emailFilter]
  );

  useEffect(() => {
    if (!getPlatformAccessToken()) {
      router.replace("/platform/login");
      return;
    }
    setReady(true);
    void load(0);
  }, [router, load]);

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  const pageEnd = Math.min(offset + items.length, total);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-h3 text-foreground">Audit stream</h1>
        <p className="text-sm text-muted">
          Recent platform and tenant audit events. Read-only; writes are
          recorded automatically by server actions.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label htmlFor="audit-action">Action contains</Label>
          <Input
            id="audit-action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="e.g. platform.orgs"
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(0);
            }}
          />
        </div>
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label htmlFor="audit-email">Actor email</Label>
          <Input
            id="audit-email"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="operator@…"
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(0);
            }}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => void load(0)}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {error ? (
        <p
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        {total === 0
          ? "No events"
          : `Showing ${offset + 1}–${pageEnd} of ${total}`}
      </p>

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner />
          <span className="text-sm">Loading events…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted">
          No audit events match these filters.
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
          {items.map((ev) => (
            <li key={ev.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {ev.action}
                </span>
                <Badge
                  variant={
                    ev.outcome === "success"
                      ? "success"
                      : ev.outcome === "denied" || ev.outcome === "failure"
                        ? "error"
                        : "neutral"
                  }
                >
                  {ev.outcome}
                </Badge>
                {ev.resource_type ? (
                  <span className="text-xs text-muted">
                    {ev.resource_type}
                    {ev.resource_id ? ` · ${ev.resource_id.slice(0, 8)}…` : ""}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                {ev.created_at ? (
                  <span>
                    {new Date(ev.created_at).toLocaleString("en-KE")}
                  </span>
                ) : null}
                {ev.actor_email ? <span>{ev.actor_email}</span> : null}
                {ev.actor_role ? <span>{ev.actor_role}</span> : null}
                {ev.organization_id ? (
                  <span className="font-mono">
                    org {ev.organization_id.slice(0, 8)}…
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading || offset <= 0}
          onClick={() => void load(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || offset + items.length >= total}
          onClick={() => void load(offset + PAGE_SIZE)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
