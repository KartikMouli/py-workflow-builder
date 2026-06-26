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

const CATEGORIES = ["Recent", "Image", "Video", "Audio", "Others"] as const;
type Category = (typeof CATEGORIES)[number];

const ITEMS: {
  key: string;
  label: string;
  category: Exclude<Category, "Recent">;
  create: (p: { x: number; y: number }) => AppNode;
}[] = [
  { key: "crop-image", label: "Crop Image", category: "Image", create: createCropImageNode },
  { key: "gemini", label: "Gemini 3.1 Pro", category: "Others", create: createGeminiNode },
];

function itemsFor(category: Category) {
  return category === "Recent" ? ITEMS : ITEMS.filter((i) => i.category === category);
}

export function NodePicker() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("Recent");
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

  const trimmed = query.trim().toLowerCase();
  // Search ignores the active category and matches across everything; otherwise the tab decides.
  const visible = trimmed
    ? ITEMS.filter((i) => i.label.toLowerCase().includes(trimmed))
    : itemsFor(category);

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

          {!trimmed && (
            <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-2 py-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-brand text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto p-2">
            {visible.map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => add(i.create)}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {i.label}
              </button>
            ))}
            {visible.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-gray-400">
                {trimmed ? "No matches" : "Nothing in this category yet"}
              </p>
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
