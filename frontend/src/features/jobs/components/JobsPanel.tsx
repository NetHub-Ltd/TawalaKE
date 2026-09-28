"use client";

/**
 * Celery workers / queues / replay — used on platform and org dashboards.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Button, Input, Label, Spinner } from "@/lib/components/ui";
import { toast } from "sonner";
import { RefreshCw, Play } from "lucide-react";

export type JobsStatus = {
  ok: boolean;
  error?: string;
  workers?: string[];
  worker_count?: number;
  queues?: string[];
  active?: Array<{
    worker?: string;
    id?: string;
    name?: string;
    args?: unknown;
    kwargs?: unknown;
  }>;
  reserved?: Array<{
    worker?: string;
    id?: string;
    name?: string;
  }>;
  known_tasks?: Record<
    string,
    { queue: string; description?: string; args?: string[] }
  >;
};

type Props = {
  /** Absolute path under /api/v1 */
  statusPath: string;
  replayPath: string;
  /** Extra headers (e.g. platform Bearer) */
  authHeaders?: Record<string, string>;
  title?: string;
  /** Org UI: show sale_id / business_id replay forms */
  allowReplay?: boolean;
};

async function parseJson(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body.detail || body.error || body.message || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return body?.data !== undefined ? body.data : body;
}

export function JobsPanel({
  statusPath,
  replayPath,
  authHeaders = {},
  title = "Background jobs",
  allowReplay = true,
}: Props) {
  const [status, setStatus] = useState<JobsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saleId, setSaleId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(statusPath, {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders },
        cache: "no-store",
      });
      const data = await parseJson(res);
      setStatus(data as JobsStatus);
    } catch (e) {
      setStatus({
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load",
      });
    } finally {
      setLoading(false);
    }
  }, [statusPath, authHeaders]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  const replay = async (task: string, extra: Record<string, string>) => {
    setBusy(task);
    try {
      const res = await fetch(replayPath, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ task, ...extra }),
      });
      const data = await parseJson(res);
      toast.success(`Queued ${task}`, {
        description: data?.task_id ? `Task ${data.task_id}` : undefined,
      });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Replay failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted">
            Celery workers and queues — refresh every 15s
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted">
          <Spinner size="sm" /> Loading workers…
        </div>
      ) : status?.error && !status.ok ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {status.error}. If no workers are online, start the Celery worker
          with queues <code className="text-xs">tawala.default,tawala.documents</code>.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-register px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-muted">
                Workers
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {status?.worker_count ?? 0}
              </p>
              <p className="truncate text-xs text-muted">
                {(status?.workers || []).join(", ") || "None online"}
              </p>
            </div>
            <div className="rounded-md border border-border bg-register px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-muted">
                Queues
              </p>
              <p className="mt-1 text-xs font-medium">
                {(status?.queues || []).join(" · ") || "—"}
              </p>
            </div>
            <div className="rounded-md border border-border bg-register px-3 py-2">
              <p className="text-[11px] font-semibold uppercase text-muted">
                Active / reserved
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {(status?.active || []).length} / {(status?.reserved || []).length}
              </p>
            </div>
          </div>

          {(status?.active || []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Running now</p>
              <ul className="space-y-1 rounded-md border border-border divide-y divide-border">
                {(status?.active || []).map((t) => (
                  <li
                    key={t.id || `${t.name}-${t.worker}`}
                    className="px-3 py-2 font-mono text-xs"
                  >
                    <span className="font-semibold text-foreground">{t.name}</span>
                    <span className="text-muted"> · {t.worker}</span>
                    {t.id ? (
                      <span className="block truncate text-muted">{t.id}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allowReplay && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted">Replay</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium">Receipt / invoice snapshot</p>
                  <Label htmlFor="job-sale">Sale ID</Label>
                  <Input
                    id="job-sale"
                    value={saleId}
                    onChange={(e) => setSaleId(e.target.value.trim())}
                    placeholder="uuid"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!saleId || busy !== null}
                    onClick={() =>
                      void replay("documents.generate_financial_document", {
                        sale_id: saleId,
                      })
                    }
                  >
                    <Play size={14} />
                    {busy === "documents.generate_financial_document"
                      ? "Queuing…"
                      : "Replay document"}
                  </Button>
                </div>
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium">Dashboard day backfill</p>
                  <Label htmlFor="job-biz">Business ID</Label>
                  <Input
                    id="job-biz"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value.trim())}
                    placeholder="uuid"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!businessId || busy !== null}
                    onClick={() =>
                      void replay("dashboard.backfill_business_days", {
                        business_id: businessId,
                      })
                    }
                  >
                    <Play size={14} />
                    {busy === "dashboard.backfill_business_days"
                      ? "Queuing…"
                      : "Replay backfill"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
