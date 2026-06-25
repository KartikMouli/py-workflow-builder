"use client";

import type { NodeProps } from "@xyflow/react";
import { LogIn } from "lucide-react";
import { useCanvasStore } from "../store";
import type { ResponseNode } from "../types";
import { NodeFrame, RowHandle } from "./node-frame";

export function ResponseNodeView({ id, selected }: NodeProps<ResponseNode>) {
  const runState = useCanvasStore((s) => s.runStates[id]);
  const result = useCanvasStore((s) => s.outputs[id]?.result);
  const text = runState?.text ?? (typeof result === "string" ? result : undefined);

  return (
    <NodeFrame
      title="Response"
      selected={selected}
      running={runState?.status === "RUNNING"}
      icon={<LogIn className="h-3.5 w-3.5 text-brand" />}
    >
      <div className="relative">
        <span className="text-xs font-medium text-gray-600">result</span>
        <RowHandle side="left" kind="target" id="result" dataType="any" />
        {text ? (
          <div className="nodrag mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 px-2 py-2 text-xs text-gray-700">
            {text}
          </div>
        ) : (
          <div className="mt-2 rounded-md bg-gray-50 px-2 py-3 text-center text-xs text-gray-400">
            {runState?.error ?? (runState?.status === "RUNNING" ? "Collecting…" : "No output yet")}
          </div>
        )}
      </div>
    </NodeFrame>
  );
}
