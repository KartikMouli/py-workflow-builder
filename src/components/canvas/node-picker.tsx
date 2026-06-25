"use client";

import { useReactFlow } from "@xyflow/react";
import { FileText, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useCanvasStore } from "./store";
import { type AppNode, createCropImageNode, createGeminiNode } from "./types";

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

  function add(create: (p: { x: number; y: number }) => AppNode) {
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(create(pos));
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

      <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Add node"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
