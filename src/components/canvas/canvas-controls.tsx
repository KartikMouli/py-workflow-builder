"use client";

import { MiniMap, type Node, useReactFlow, useViewport } from "@xyflow/react";
import {
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useCanvasStore } from "./store";

function Ctrl({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function CanvasControls() {
  const [open, setOpen] = useState(false);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Show controls"
        onClick={() => setOpen(true)}
        className="absolute bottom-6 left-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-md">
      <Ctrl onClick={() => setOpen(false)} label="Hide controls">
        <ChevronLeft className="h-4 w-4" />
      </Ctrl>
      <Ctrl onClick={undo} disabled={!canUndo} label="Undo">
        <Undo2 className="h-4 w-4" />
      </Ctrl>
      <Ctrl onClick={redo} disabled={!canRedo} label="Redo">
        <Redo2 className="h-4 w-4" />
      </Ctrl>
      <div className="mx-1 h-5 w-px bg-gray-200" />
      <Ctrl onClick={() => zoomOut()} label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Ctrl>
      <button
        type="button"
        onClick={() => fitView({ duration: 200 })}
        title="Fit view"
        className="min-w-12 rounded-lg px-1 text-center text-xs font-medium text-gray-700 hover:bg-gray-100"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Ctrl onClick={() => zoomIn()} label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Ctrl>
      <Ctrl onClick={() => fitView({ duration: 200 })} label="Fit view">
        <Maximize2 className="h-4 w-4" />
      </Ctrl>
    </div>
  );
}

const MAP_COLOR: Record<string, string> = {
  gemini: "#22c55e",
  "crop-image": "#3b82f6",
  "request-inputs": "#9ca3af",
  response: "#6058e8",
  "sticky-note": "#f59e0b",
};

export function CanvasMinimap() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Show minimap"
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50"
      >
        <MapIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 z-10">
      <div className="overflow-hidden rounded-xl border border-gray-800 shadow-lg">
        <MiniMap
          pannable
          zoomable
          bgColor="#171717"
          maskColor="rgba(0,0,0,0.55)"
          nodeColor={(n: Node) => MAP_COLOR[n.type ?? ""] ?? "#9ca3af"}
          nodeStrokeColor="transparent"
          style={{ position: "relative", margin: 0, width: 220, height: 140, inset: "auto" }}
        />
      </div>
      <button
        type="button"
        aria-label="Hide minimap"
        onClick={() => setOpen(false)}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50"
      >
        <Minimize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
