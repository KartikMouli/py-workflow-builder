"use client";

import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Minus, XCircle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

type RunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
type NodeStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
type Filter = "ALL" | "RUNNING" | "SUCCESS" | "FAILED";

type RunListItem = {
  id: string;
  scope: "FULL" | "PARTIAL" | "SINGLE";
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  _count?: { nodeRuns: number };
};

type NodeRunItem = {
  id: string;
  nodeId: string;
  nodeType: string;
  status: NodeStatus;
  error: string | null;
  output: Record<string, unknown> | null;
  durationMs: number | null;
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
  RUNNING: { label: "Running", dot: "bg-blue-500" },
  SUCCESS: { label: "Completed", dot: "bg-green-500" },
  FAILED: { label: "Failed", dot: "bg-red-500" },
  PARTIAL: { label: "Partial", dot: "bg-amber-500" },
  CANCELED: { label: "Canceled", dot: "bg-gray-400" },
};

const NODE_LABEL: Record<string, string> = {
  "request-inputs": "Request Inputs",
  "crop-image": "Crop Image",
  gemini: "Gemini 3 Flash",
  response: "Response",
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "RUNNING", label: "Running" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
];

function StatusIcon({ status }: { status: RunStatus | NodeStatus }) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "RUNNING":
      return <Loader2 className="h-4 w-4 animate-spin text-brand" />;
    case "PARTIAL":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-300" />;
  }
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// Mock credit metric (Magica's "M" unit), consistent with the top-bar Est pill.
function creditsLabel(run: RunListItem): string {
  if (run.status === "RUNNING") return "0M";
  const c = (run._count?.nodeRuns ?? 0) * 0.0025;
  return c === 0 ? "0M" : `${c.toFixed(2)}M`;
}

export function RunHistoryPanel({
  open,
  workflowId,
  activeRunId,
  onClose,
}: {
  open: boolean;
  workflowId: string;
  activeRunId: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"ui" | "api">("ui");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, NodeRunItem[]>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  // activeRunId flips on run start/finish. Node-run rows are written only when a run
  // finishes, so the epoch keys the detail cache below — stale detail is bypassed.
  const epoch = activeRunId ?? "idle";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const r = await fetch(`/api/workflows/${workflowId}/runs`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!cancelled) setRuns(d.runs ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, workflowId, epoch]);

  const detailKey = expanded ? `${expanded}:${epoch}` : null;

  useEffect(() => {
    if (!detailKey || !expanded || details[detailKey]) return;
    let cancelled = false;
    const load = async () => {
      setDetailLoading(detailKey);
      try {
        const r = await fetch(`/api/runs/${expanded}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!cancelled) setDetails((m) => ({ ...m, [detailKey]: d.run?.nodeRuns ?? [] }));
      } catch {
        // leave unset — the row shows "No node runs recorded."
      } finally {
        if (!cancelled) setDetailLoading((cur) => (cur === detailKey ? null : cur));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [detailKey, expanded, details]);

  if (!open) return null;

  const visible = tab === "ui" ? runs.filter((r) => filter === "ALL" || r.status === filter) : [];

  return (
    <aside className="flex h-full w-105 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h2 className="text-sm font-semibold text-gray-900">Execution History</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          Close
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <TabButton active={tab === "ui"} onClick={() => setTab("ui")}>
            UI Runs
          </TabButton>
          <TabButton active={tab === "api"} onClick={() => setTab("api")}>
            API Runs
          </TabButton>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <span className="text-xs font-medium text-gray-600">Run history</span>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        {tab === "ui" && loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading runs…
          </div>
        ) : tab === "ui" && error ? (
          <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-sm text-red-500">
            Failed to load run history.
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            No runs for this filter yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((run) => {
              const key = `${run.id}:${epoch}`;
              return (
                <RunRow
                  key={run.id}
                  run={run}
                  open={expanded === run.id}
                  onToggle={() => setExpanded((cur) => (cur === run.id ? null : run.id))}
                  nodeRuns={details[key]}
                  loading={detailLoading === key}
                />
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function TabButton({
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
      className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

function FilterDropdown({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const [open, setOpen] = useState(false);
  const label = FILTERS.find((f) => f.value === value)?.label ?? "All";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onChange(f.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs ${
                  f.value === value
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RunRow({
  run,
  open,
  onToggle,
  nodeRuns,
  loading,
}: {
  run: RunListItem;
  open: boolean;
  onToggle: () => void;
  nodeRuns?: NodeRunItem[];
  loading: boolean;
}) {
  const meta = STATUS_META[run.status] ?? { label: run.status, dot: "bg-gray-400" };
  const active = run.status === "RUNNING";

  return (
    <li
      className={`overflow-hidden rounded-xl border ${
        active ? "border-brand bg-brand/5" : "border-gray-200 bg-white"
      }`}
    >
      <button type="button" onClick={onToggle} className="w-full px-4 py-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span className="text-[15px] font-medium text-gray-900">{meta.label}</span>
          </div>
          <span className="pt-0.5 text-xs text-gray-400">{formatDateTime(run.startedAt)}</span>
        </div>
        <p className="mt-1 pl-4.5 text-xs text-gray-400">Credits: {creditsLabel(run)}</p>
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          {loading ? (
            <div className="flex items-center gap-2 py-1 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : !nodeRuns || nodeRuns.length === 0 ? (
            <div className="py-1 text-xs text-gray-400">No node runs recorded.</div>
          ) : (
            nodeRuns.map((nr) => <NodeRunRow key={nr.id} nodeRun={nr} />)
          )}
        </div>
      )}
    </li>
  );
}

function NodeRunRow({ nodeRun }: { nodeRun: NodeRunItem }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2.5">
      <div className="flex items-center gap-2">
        <StatusIcon status={nodeRun.status} />
        <span className="flex-1 truncate text-xs font-medium text-gray-700">
          {NODE_LABEL[nodeRun.nodeType] ?? nodeRun.nodeType}
        </span>
        <span className="text-[11px] text-gray-400">{fmtDuration(nodeRun.durationMs)}</span>
      </div>
      {nodeRun.error && (
        <p className="mt-1.5 rounded bg-red-50 px-2 py-1 text-[11px] leading-snug text-red-600">
          {nodeRun.error}
        </p>
      )}
      {!nodeRun.error && <NodeOutput nodeRun={nodeRun} />}
    </div>
  );
}

function NodeOutput({ nodeRun }: { nodeRun: NodeRunItem }): ReactNode {
  const out = nodeRun.output ?? {};
  if (nodeRun.nodeType === "gemini" && typeof out.response === "string") {
    return (
      <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[11px] leading-snug text-gray-500">
        {out.response}
      </p>
    );
  }
  const image = out["output-image"];
  if (nodeRun.nodeType === "crop-image" && typeof image === "string") {
    return (
      <div
        className="mt-1.5 h-16 w-full rounded bg-gray-50 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${image}")` }}
      />
    );
  }
  return null;
}
