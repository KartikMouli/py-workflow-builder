"use client";

import { AlignLeft, File, Hash, Image as ImageIcon, Loader2, Play, ToggleLeft } from "lucide-react";
import { type ComponentType, useCallback, useMemo, useState } from "react";
import { serializeGraph, validateRunInputs } from "@/components/canvas/graph";
import { ImageUploadButton } from "@/components/canvas/nodes/image-upload-button";
import type { AppEdge, AppNode, FieldType, InputField } from "@/components/canvas/types";
import { type PlaygroundNodeRun, PlaygroundRunSubscriber } from "./playground-run-subscriber";
import { RunHistoryTable } from "./run-history-table";

type Graph = { nodes: AppNode[]; edges: AppEdge[] };

const NODE_COST_M: Record<string, number> = { gemini: 0.0025, "crop-image": 0.001 };

const FIELD_META: Record<FieldType, { label: string; icon: ComponentType<{ className?: string }> }> = {
  text: { label: "Text", icon: AlignLeft },
  number: { label: "Number", icon: Hash },
  boolean: { label: "Boolean", icon: ToggleLeft },
  image: { label: "Image", icon: ImageIcon },
  media: { label: "Media", icon: ImageIcon },
  audio: { label: "Audio", icon: File },
  video: { label: "Video", icon: File },
  file: { label: "File", icon: File },
};

type OutputItem = { kind: "text" | "image"; value: string };

function collectOutputs(nodeRuns: PlaygroundNodeRun[]): OutputItem[] {
  const toItems = (values: unknown[]): OutputItem[] =>
    values
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .map((v) => ({ kind: v.startsWith("data:") ? "image" : "text", value: v }));

  const response = nodeRuns.find((nr) => nr.nodeType === "response");
  if (response?.output) return toItems(Object.values(response.output));

  const items: OutputItem[] = [];
  for (const nr of nodeRuns) {
    if (nr.nodeType === "gemini") items.push(...toItems([nr.output?.response]));
    if (nr.nodeType === "crop-image") items.push(...toItems([nr.output?.["output-image"]]));
  }
  return items;
}

export function PlaygroundTab({ workflowId, graph }: { workflowId: string; graph: Graph }) {
  const fields = useMemo(() => {
    const node = graph.nodes.find((n) => n.type === "request-inputs");
    return node && node.type === "request-inputs" ? node.data.fields : [];
  }, [graph]);

  const estimate = useMemo(
    () => graph.nodes.reduce((sum, n) => sum + (NODE_COST_M[n.type ?? ""] ?? 0), 0),
    [graph],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.value ?? ""])),
  );
  const [run, setRun] = useState<{ dbRunId: string; triggerRunId: string; token: string } | null>(
    null,
  );
  const [running, setRunning] = useState(false);
  const [outputs, setOutputs] = useState<OutputItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const setField = (id: string, value: string) => setValues((v) => ({ ...v, [id]: value }));

  async function onRun() {
    const nodes = graph.nodes.map((n) =>
      n.type === "request-inputs"
        ? {
            ...n,
            data: {
              ...n.data,
              fields: n.data.fields.map((f) => ({ ...f, value: values[f.id] ?? f.value })),
            },
          }
        : n,
    ) as AppNode[];

    const validation = validateRunInputs(nodes, graph.edges, "FULL");
    if (validation) {
      setError(validation);
      return;
    }

    setRunning(true);
    setOutputs(null);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "FULL", graph: serializeGraph(nodes, graph.edges) }),
      });
      if (!res.ok) throw new Error();
      const { dbRunId, triggerRunId, publicAccessToken } = await res.json();
      setRun({ dbRunId, triggerRunId, token: publicAccessToken });
      setHistoryKey((k) => k + 1);
    } catch {
      setError("Couldn't start the run.");
      setRunning(false);
    }
  }

  const onDone = useCallback((nodeRuns: PlaygroundNodeRun[], failed: boolean) => {
    setOutputs(collectOutputs(nodeRuns));
    if (failed) setError(nodeRuns.find((nr) => nr.error)?.error ?? "Run failed.");
    setRunning(false);
    setRun(null);
    setHistoryKey((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-h-160 flex-col rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Inputs</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Configure the input fields for this workflow run
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              Est. ~{estimate.toFixed(2)} M
            </span>
          </div>

          <div className="mt-6 flex-1 space-y-5">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-400">This workflow has no inputs.</p>
            ) : (
              fields.map((f) => (
                <PlaygroundField
                  key={f.id}
                  field={f}
                  value={values[f.id] ?? ""}
                  onChange={(v) => setField(f.id, v)}
                />
              ))
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-medium text-white shadow-sm hover:bg-brand-hover disabled:opacity-60"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </button>
        </section>

        <section className="flex min-h-160 flex-col rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Output</h2>
          <p className="mt-0.5 text-sm text-gray-500">Results from workflow execution</p>
          <div className="mt-4 flex flex-1 flex-col">
            <OutputView running={running} outputs={outputs} />
          </div>
        </section>
      </div>

      <RunHistoryTable workflowId={workflowId} reloadKey={historyKey} />

      {run && (
        <PlaygroundRunSubscriber
          triggerRunId={run.triggerRunId}
          token={run.token}
          dbRunId={run.dbRunId}
          onDone={onDone}
        />
      )}
    </div>
  );
}

function PlaygroundField({
  field,
  value,
  onChange,
}: {
  field: InputField;
  value: string;
  onChange: (v: string) => void;
}) {
  const meta = FIELD_META[field.type];
  const Icon = meta.icon;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <Icon className="h-4 w-4 text-gray-400" />
          {field.name}
        </label>
        <span className="text-xs text-gray-400">{meta.label}</span>
      </div>
      {field.type === "image" || field.type === "media" ? (
        <ImageUploadButton value={value} onChange={onChange} label={`Upload ${field.name}`} />
      ) : field.type === "boolean" ? (
        <select
          value={value || "false"}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand/50"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name}…`}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand/50"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name}…`}
          rows={3}
          className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand/50"
        />
      )}
    </div>
  );
}

function OutputView({ running, outputs }: { running: boolean; outputs: OutputItem[] | null }) {
  if (running) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-gray-500">Running the workflow…</p>
      </div>
    );
  }
  if (!outputs || outputs.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <Play className="h-6 w-6 text-gray-300" />
        </div>
        <p className="mt-1 text-sm font-medium text-gray-500">No output yet</p>
        <p className="text-xs text-gray-400">Run the workflow to see results here</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {outputs.map((item, i) =>
        item.kind === "image" ? (
          <div
            key={`${i}-img`}
            className="h-48 w-full rounded-lg border border-gray-100 bg-gray-50 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${item.value}")` }}
          />
        ) : (
          <div
            key={`${i}-txt`}
            className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
          >
            {item.value}
          </div>
        ),
      )}
    </div>
  );
}
