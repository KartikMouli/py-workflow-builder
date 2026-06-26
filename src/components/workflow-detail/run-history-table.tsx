"use client";

import { Clock, Search } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

type RunRow = {
  id: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL" | "CANCELED";
  startedAt: string;
  _count?: { nodeRuns: number };
};

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  RUNNING: { label: "Running", dot: "bg-blue-500", text: "text-blue-600" },
  SUCCESS: { label: "Completed", dot: "bg-green-500", text: "text-green-600" },
  FAILED: { label: "Failed", dot: "bg-red-500", text: "text-red-600" },
  PARTIAL: { label: "Partial", dot: "bg-amber-500", text: "text-amber-600" },
  CANCELED: { label: "Canceled", dot: "bg-gray-400", text: "text-gray-500" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function creditsLabel(run: RunRow): string {
  if (run.status === "RUNNING") return "0M";
  const c = (run._count?.nodeRuns ?? 0) * 0.0025;
  return c === 0 ? "0M" : `${c.toFixed(2)}M`;
}

export function RunHistoryTable({
  workflowId,
  reloadKey,
}: {
  workflowId: string;
  reloadKey: number;
}) {
  const [tab, setTab] = useState<"ui" | "api">("ui");
  const [query, setQuery] = useState("");
  const [runs, setRuns] = useState<RunRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/workflows/${workflowId}/runs`);
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setRuns(d.runs ?? []);
      } catch {
        // leave previous rows
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [workflowId, reloadKey]);

  const rows =
    tab === "api"
      ? []
      : runs.filter((r) => r.id.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Run History</h2>
          <span className="text-sm text-gray-400">({tab === "ui" ? runs.length : 0})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <TabBtn active={tab === "ui"} onClick={() => setTab("ui")}>
              UI Runs
            </TabBtn>
            <TabBtn active={tab === "api"} onClick={() => setTab("api")}>
              API Runs
            </TabBtn>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Run ID…"
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand/50"
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.4fr] gap-4 border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
          <span>Date &amp; Time</span>
          <span>Status</span>
          <span>Used credits</span>
          <span className="text-right">Run ID</span>
        </div>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No {tab === "ui" ? "UI" : "API"} run yet.
          </p>
        ) : (
          rows.map((run) => {
            const meta = STATUS_META[run.status] ?? STATUS_META.RUNNING;
            return (
              <div
                key={run.id}
                className="grid grid-cols-[1.4fr_1fr_1fr_1.4fr] items-center gap-4 border-b border-gray-50 py-3 text-sm last:border-0"
              >
                <span className="text-gray-600">{formatDateTime(run.startedAt)}</span>
                <span className={`flex items-center gap-2 ${meta.text}`}>
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="text-gray-600">{creditsLabel(run)}</span>
                <span className="truncate text-right font-mono text-xs text-gray-400">
                  {run.id}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}
