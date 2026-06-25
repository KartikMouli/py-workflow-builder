"use client";

import { type NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { GripHorizontal } from "lucide-react";
import { useCanvasStore } from "../store";
import type { StickyColor, StickyNoteData, StickyNoteNode } from "../types";

const COLORS: Record<StickyColor, { bg: string; header: string; border: string; text: string }> = {
  yellow: { bg: "#fef9c3", header: "#fef08a", border: "#fde047", text: "#854d0e" },
  blue: { bg: "#dbeafe", header: "#bfdbfe", border: "#93c5fd", text: "#1e40af" },
  green: { bg: "#dcfce7", header: "#bbf7d0", border: "#86efac", text: "#166534" },
  pink: { bg: "#fce7f3", header: "#fbcfe8", border: "#f9a8d4", text: "#9d174d" },
  purple: { bg: "#f3e8ff", header: "#e9d5ff", border: "#d8b4fe", text: "#6b21a8" },
  orange: { bg: "#ffedd5", header: "#fed7aa", border: "#fdba74", text: "#9a3412" },
};

const FONT_FAMILY: Record<NonNullable<StickyNoteData["fontFamily"]>, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, monospace",
};

const COLOR_KEYS = Object.keys(COLORS) as StickyColor[];

export function StickyNoteNodeView({ id, data, selected }: NodeProps<StickyNoteNode>) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const set = (patch: Partial<StickyNoteData>) => updateNodeData(id, patch);

  const color = COLORS[data.color ?? "yellow"];
  const fontSize = data.fontSize ?? 14;
  const fontFamily = data.fontFamily ?? "sans";

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Right} offset={12}>
        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="flex gap-1">
            {COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                onClick={() => set({ color: key })}
                style={{ background: COLORS[key].bg, borderColor: COLORS[key].border }}
                className={`h-5 w-5 rounded-full border ${data.color === key ? "ring-2 ring-gray-400 ring-offset-1" : ""}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => set({ bold: !data.bold })}
              className={`h-7 w-7 rounded text-sm font-bold ${data.bold ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              B
            </button>
            {(["sans", "serif", "mono"] as const).map((fam) => (
              <button
                key={fam}
                type="button"
                aria-label={`Font ${fam}`}
                onClick={() => set({ fontFamily: fam })}
                style={{ fontFamily: FONT_FAMILY[fam] }}
                className={`h-7 w-7 rounded text-xs ${fontFamily === fam ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Aa
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Decrease font size"
              onClick={() => set({ fontSize: Math.max(10, fontSize - 2) })}
              className="h-7 w-7 rounded bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
            >
              A−
            </button>
            <span className="w-7 text-center text-xs text-gray-600">{fontSize}</span>
            <button
              type="button"
              aria-label="Increase font size"
              onClick={() => set({ fontSize: Math.min(40, fontSize + 2) })}
              className="h-7 w-7 rounded bg-gray-100 text-xs text-gray-700 hover:bg-gray-200"
            >
              A+
            </button>
          </div>
        </div>
      </NodeToolbar>

      <div
        style={{ width: 220, background: color.bg, borderColor: color.border }}
        className={`overflow-hidden rounded-md border shadow-sm ${selected ? "ring-2 ring-offset-1 ring-amber-300" : ""}`}
      >
        <div
          className="flex h-5 cursor-grab items-center justify-center active:cursor-grabbing"
          style={{ background: color.header }}
        >
          <GripHorizontal className="h-3.5 w-3.5" style={{ color: color.text, opacity: 0.5 }} />
        </div>
        <textarea
          value={data.text}
          onChange={(e) => set({ text: e.target.value })}
          placeholder="Type a note..."
          style={{
            color: color.text,
            fontWeight: data.bold ? 700 : 400,
            fontSize,
            fontFamily: FONT_FAMILY[fontFamily],
          }}
          className="nodrag h-28 w-full resize-y bg-transparent p-2.5 leading-snug outline-none placeholder:opacity-50"
        />
      </div>
    </>
  );
}
