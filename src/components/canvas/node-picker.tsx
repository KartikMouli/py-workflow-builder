"use client";

import { useReactFlow } from "@xyflow/react";
import { File, Plus, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useCanvasStore } from "./store";
import { type AppNode, createCropImageNode, createGeminiNode, createStickyNote } from "./types";

function ToolbarButton({
  label,
  ariaLabel,
  onClick,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
      >
        {children}
      </button>
      <span className="pointer-events-none absolute bottom-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
        {label}
      </span>
    </div>
  );
}

const ITEMS: {
  key: string;
  label: string;
  category: string;
  create: (p: { x: number; y: number }) => AppNode;
}[] = [
  { key: "crop-image", label: "Crop Image", category: "Image", create: createCropImageNode },
  { key: "gemini", label: "Gemini 3 Flash", category: "LLM", create: createGeminiNode },
];

export function NodePicker() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const addNode = useCanvasStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  function centerPosition() {
    return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }

  function add(create: (p: { x: number; y: number }) => AppNode) {
    addNode(create(centerPosition()));
    setOpen(false);
    setQuery("");
  }

  const filtered = ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  const categories = Array.from(new Set(filtered.map((i) => i.category)));

  return (
    <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
      {open && (
        <div className="absolute bottom-16 left-1/2 w-72 -translate-x-1/2 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes or models..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {categories.map((cat) => (
              <div key={cat} className="mb-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {cat}
                </p>
                {filtered
                  .filter((i) => i.category === cat)
                  .map((i) => (
                    <button
                      key={i.key}
                      type="button"
                      onClick={() => add(i.create)}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {i.label}
                    </button>
                  ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-gray-400">No matches</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
        <ToolbarButton
          label="Add Sticky Note"
          ariaLabel="Add sticky note"
          onClick={() => addNode(createStickyNote(centerPosition()))}
        >
          <File className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Add Node" ariaLabel="Add node" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}
