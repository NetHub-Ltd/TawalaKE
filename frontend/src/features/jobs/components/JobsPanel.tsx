"use client";

/**
 * Background jobs — history table (SSE), optional Celery cluster snapshot, retry.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Label, Spinner } from "@/lib/components/ui";
import { toast } from "sonner";
import { RefreshCw, Play, Radio } from "lucide-react";

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

export type JobRow = {
  id: string;
  celery_task_id?: string | null;
  name: string;
  status: string;
  organization_id?: string | null;
  business_id?: string | null;
  sale_id?: string | null;
  triggered_by_email?: string | null;
  triggered_by_role?: string | null;
  args_summary?: Record<string, unknown>;
  error_message?: string | null;
  result_preview?: string | null;
  retries?: number;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string | null;
};

type Props = {
  statusPath: string;
  replayPath: string;
  historyPath: string;
  streamPath: string;
  retryPath?: (jobId: string) => string;
  authHeaders?: Record<string, string>;
  title?: string;
  /** Org UI: allow retry of failed jobs */
  allowRetry?: boolean;
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

function statusBadge(status: string) {
  const s = (status || "").toUpperCase();
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide";
  if (s === "SUCCESS")
    return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200`;
  if (s === "FAILURE")
    return `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`;
  if (s === "STARTED" || s === "RETRY")
    return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100`;
  if (s === "PENDING")
    return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  return `${base} bg-muted text-foreground`;
}

function shortName(name: string) {
  if (!name) return "—";
  const parts = name.split(".");
  return parts.length > 1 ? parts.slice(-1)[0] : name;
}

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function JobsPanel({
  statusPath,
  replayPath,
  historyPath,
  streamPath,
  retryPath,
  authHeaders = {},
  title = "Background jobs",
  allowRetry = true,
  allowReplay = true,
}: Props) {
  const [status, setStatus] = useState<JobsStatus | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saleId, setSaleId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "offline">(
    "connecting",
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const loadStatus = useCallback(async () => {
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

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const q = statusFilter
        ? `?status=${encodeURIComponent(statusFilter)}&limit=50`
        : "?limit=50";
      const res = await fetch(`${historyPath}${q}`, {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders },
        cache: "no-store",
      });
      const data = await parseJson(res);
      setJobs((data?.items as JobRow[]) || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
      setJobs([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPath, authHeaders, statusFilter]);

  useEffect(() => {
    void loadStatus();
    void loadHistory();
  }, [loadStatus, loadHistory]);

  // Live SSE via fetch (supports cookie session + Bearer; auto-reconnect, no polling)
  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const applyJobUpdate = (row: JobRow) => {
      setJobs((prev) => {
        const idx = prev.findIndex((j) => j.id === row.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...row };
          return next;
        }
        return [row, ...prev].slice(0, 100);
      });
    };

    const consumeSse = async (signal: AbortSignal) => {
      setStreamState("connecting");
      const res = await fetch(streamPath, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "text/event-stream",
          ...authHeaders,
        },
        cache: "no-store",
        signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`SSE HTTP ${res.status}`);
      }
      setStreamState("live");
      setLive(true);
      attempt = 0;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const dataLine = chunk
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.replace(/^data:\s?/, "");
          if (!raw || raw === ": heartbeat" || raw.startsWith(":")) continue;
          try {
            const payload = JSON.parse(raw);
            if (payload?.type === "job_updated" && payload.job) {
              applyJobUpdate(payload.job as JobRow);
            }
          } catch {
            /* ignore heartbeats / non-json */
          }
        }
      }
      throw new Error("SSE stream closed");
    };

    const loop = async () => {
      while (!cancelled) {
        const ac = new AbortController();
        abortRef.current = ac;
        try {
          await consumeSse(ac.signal);
        } catch {
          if (cancelled) return;
          setLive(false);
          setStreamState("offline");
          attempt += 1;
          const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
          await new Promise<void>((resolve) => {
            reconnectTimer = setTimeout(resolve, delay);
          });
        }
      }
    };

    void loop();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      abortRef.current?.abort();
      abortRef.current = null;
      setLive(false);
      setStreamState("offline");
    };
  }, [streamPath, authHeaders]);

  const replay = async (task: string, body: Record<string, unknown>) => {
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
        body: JSON.stringify({ task, ...body }),
      });
      await parseJson(res);
      toast.success("Job queued");
      void loadHistory();
      void loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Replay failed");
    } finally {
      setBusy(null);
    }
  };

  const retryJob = async (job: JobRow) => {
    if (!retryPath || !allowRetry) return;
    setBusy(job.id);
    try {
      const res = await fetch(retryPath(job.id), {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders },
      });
      await parseJson(res);
      toast.success("Retry queued");
      void loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted">
            Job history for this workspace.{" "}
            {streamState === "live" || live ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Radio className="h-3 w-3" /> Live
              </span>
            ) : streamState === "connecting" ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <Radio className="h-3 w-3 animate-pulse" /> Connecting…
              </span>
            ) : (
              <span className="text-muted">Reconnecting…</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-border bg-card px-2 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="STARTED">Started</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="RETRY">Retry</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void loadHistory();
              void loadStatus();
            }}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* History table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Job</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Detail</th>
                {allowRetry ? (
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {historyLoading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={allowRetry ? 6 : 5} className="px-3 py-10 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={allowRetry ? 6 : 5}
                    className="px-3 py-10 text-center text-sm text-muted"
                  >
                    No jobs yet. They appear here when documents or dashboard
                    tasks are queued.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/20"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                      {formatWhen(job.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground">
                        {shortName(job.name)}
                      </div>
                      <div className="text-[11px] text-muted">
                        {job.sale_id
                          ? `Sale ${job.sale_id.slice(0, 8)}…`
                          : job.business_id
                            ? `Store ${job.business_id.slice(0, 8)}…`
                            : job.celery_task_id
                              ? job.celery_task_id.slice(0, 10) + "…"
                              : "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={statusBadge(job.status)}>
                        {job.status}
                      </span>
                      {(job.retries ?? 0) > 0 ? (
                        <span className="ml-1 text-[11px] text-muted">
                          ×{job.retries}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {job.triggered_by_email ||
                        job.triggered_by_role ||
                        "System"}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-muted">
                      {job.error_message ||
                        job.result_preview ||
                        "—"}
                    </td>
                    {allowRetry ? (
                      <td className="px-3 py-2.5 text-right">
                        {job.status === "FAILURE" && retryPath ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy === job.id}
                            onClick={() => void retryJob(job)}
                          >
                            {busy === job.id ? (
                              <Spinner className="h-3.5 w-3.5" />
                            ) : (
                              <>
                                <Play className="mr-1 h-3.5 w-3.5" />
                                Retry
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual replay forms (org) */}
      {allowReplay ? (
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sale-id">Re-queue document for sale</Label>
            <div className="flex gap-2">
              <Input
                id="sale-id"
                placeholder="Sale UUID"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
              />
              <Button
                type="button"
                disabled={!saleId || busy === "doc"}
                onClick={() =>
                  void replay("documents.generate_financial_document", {
                    sale_id: saleId,
                  })
                }
              >
                Queue
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-id">Backfill dashboard for store</Label>
            <div className="flex gap-2">
              <Input
                id="biz-id"
                placeholder="Business UUID"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              />
              <Button
                type="button"
                disabled={!businessId || busy === "dash"}
                onClick={() =>
                  void replay("dashboard.backfill_business_days", {
                    business_id: businessId,
                  })
                }
              >
                Queue
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cluster snapshot */}
      <details className="rounded-lg border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-medium text-foreground">
          Celery workers snapshot
          {loading ? " (loading…)" : status?.ok ? ` · ${status.worker_count ?? 0} workers` : " · unavailable"}
        </summary>
        {status?.error ? (
          <p className="mt-2 text-xs text-red-600">{status.error}</p>
        ) : (
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/40 p-2 text-[11px]">
            {JSON.stringify(
              {
                workers: status?.workers,
                queues: status?.queues,
                active: status?.active,
                reserved: status?.reserved,
              },
              null,
              2,
            )}
          </pre>
        )}
      </details>
    </div>
  );
}
