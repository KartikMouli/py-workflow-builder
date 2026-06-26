"use client";

import type { NodeProps } from "@xyflow/react";
import { useMemo } from "react";
import { useCanvasStore } from "../store";
import type { ResponseNode } from "../types";
import { NodeFrame, type RunPhase, RowHandle } from "./node-frame";

const BASE_NAME: Record<string, string> = {
  gemini: "gemini_3_flash",
  "crop-image": "crop_image",
  "request-inputs": "request_inputs",
};

export function ResponseNodeView({ id, selected }: NodeProps<ResponseNode>) {
  const liveRun = useCanvasStore((s) => s.liveRun);
  const runState = useCanvasStore((s) => s.runStates[id]);
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);
  const runStates = useCanvasStore((s) => s.runStates);
  const outputs = useCanvasStore((s) => s.outputs);

  const collectors = useMemo(() => {
    const incoming = edges.filter((e) => e.target === id && e.targetHandle === "result");
    const counts: Record<string, number> = {};
    return incoming.map((e) => {
      const base = BASE_NAME[nodes.find((n) => n.id === e.source)?.type ?? ""] ?? "input";
      counts[base] = (counts[base] ?? 0) + 1;
      const name = counts[base] === 1 ? base : `${base}_${counts[base]}`;
      const value = runStates[e.source]?.text ?? outputs[e.source]?.[e.sourceHandle ?? "default"];
      return { key: e.id, name, value };
    });
  }, [edges, nodes, id, runStates, outputs]);

  return (
    <NodeFrame
      title="Response"
      info="Collects the final outputs of your workflow. Connect any node's output here."
      selected={selected}
      runStatus={liveRun ? (runState?.status as RunPhase | undefined) : undefined}
    >
      <div className="relative">
        <span className="text-xs font-medium text-gray-600">result</span>
        <RowHandle side="left" kind="target" id="result" dataType="any" />
        <div className="mt-2 space-y-2">
          {collectors.length === 0 ? (
            <div className="rounded-md bg-gray-50 px-2 py-3 text-center text-xs text-gray-400">
              No output yet
            </div>
          ) : (
            collectors.map((c) => <Collector key={c.key} name={c.name} value={c.value} />)
          )}
        </div>
      </div>
    </NodeFrame>
  );
}

function Collector({ name, value }: { name: string; value: unknown }) {
  const isImage = typeof value === "string" && value.startsWith("data:");
  const text = typeof value === "string" && !isImage ? value : undefined;
  return (
    <div className="rounded-lg border border-gray-100 p-2">
      <div className="mb-1 text-xs font-medium text-gray-700">{name}</div>
      {isImage ? (
        <div
          className="h-20 w-full rounded bg-gray-50 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${value}")` }}
        />
      ) : text ? (
        <div className="nodrag max-h-28 overflow-auto whitespace-pre-wrap text-xs text-gray-700">
          {text}
        </div>
      ) : (
        <div className="py-2 text-center text-xs text-gray-400">No output yet</div>
      )}
    </div>
  );
}
