"use client";

import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "../store";
import type { StickyNoteNode } from "../types";

export function StickyNoteNodeView({ id, data, selected }: NodeProps<StickyNoteNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <div
      className={`rounded-md border shadow-sm ${
        selected ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-200"
      }`}
      style={{ width: 220 }}
    >
      <textarea
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        placeholder="Write a note..."
        className="nodrag h-32 w-full resize-y rounded-md bg-amber-100 p-2.5 text-xs text-amber-900 outline-none placeholder:text-amber-500"
      />
    </div>
  );
}
