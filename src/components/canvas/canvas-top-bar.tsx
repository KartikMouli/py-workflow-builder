"use client";

import { ArrowLeft, Calculator, Clock, Play, Square, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCanvasStore } from "./store";

// No real billing — Est is a rough per-node placeholder in Magica's "M" credit unit.
const NODE_COST_M: Record<string, number> = { gemini: 0.0025, "crop-image": 0.001 };

export function CanvasTopBar({
  name,
  isRunning,
  onRun,
  onStop,
  onHistory,
}: {
  name: string;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onHistory: () => void;
}) {
  const nodes = useCanvasStore((s) => s.nodes);
  const estimate = useMemo(
    () => nodes.reduce((sum, n) => sum + (NODE_COST_M[n.type ?? ""] ?? 0), 0),
    [nodes],
  );

  return (
    <>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-2 pr-4 shadow-sm">
        <Link
          href="/dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {isRunning ? (
          <>
            <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              Viewing live run
            </span>
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-lg bg-[#e42125] px-3 py-2 text-xs font-medium text-white shadow-sm hover:brightness-95"
            >
              <Square className="h-3.5 w-3.5" />
              Stop run
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-sm">
              <Calculator className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500">Est</span>
              <span className="font-semibold text-gray-900">{estimate.toFixed(2)}</span>
              <span className="text-gray-400">M</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-sm">
              <Wallet className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500">Bal</span>
              <span className="font-semibold text-gray-900">0.00</span>
              <span className="text-gray-400">M</span>
            </span>
            <button
              type="button"
              onClick={onRun}
              aria-label="Run workflow"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm hover:bg-brand-hover"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          </>
        )}
        <button
          type="button"
          aria-label="Run history"
          onClick={onHistory}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
