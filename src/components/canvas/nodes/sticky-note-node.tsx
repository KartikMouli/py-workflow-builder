"use client";

import type { NodeProps } from "@xyflow/react";
import { GripHorizontal } from "lucide-react";
import { useCanvasStore } from "../store";
import type { StickyNoteNode } from "../types";

export function StickyNoteNodeView({ id, data, selected }: NodeProps<StickyNoteNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <div
      className={`overflow-hidden rounded-md border bg-amber-100 shadow-sm ${
        selected ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-200"
      }`}
      style={{ width: 220 }}
    >
      <div className="flex h-5 cursor-grab items-center justify-center bg-amber-200/70 active:cursor-grabbing">
        <GripHorizontal className="h-3.5 w-3.5 text-amber-600" />
      </div>
      <textarea
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        placeholder="Write a note..."
        className="nodrag h-28 w-full resize-y bg-amber-100 p-2.5 text-xs text-amber-900 outline-none placeholder:text-amber-500"
      />
    </div>
  );
}
