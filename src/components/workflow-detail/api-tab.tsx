"use client";

import { Code2 } from "lucide-react";
import type { AppEdge, AppNode } from "@/components/canvas/types";

export function ApiTab({
  workflowId,
}: {
  workflowId: string;
  graph: { nodes: AppNode[]; edges: AppEdge[] };
}) {
  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">API Endpoint</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Run this workflow programmatically.</p>
        <div className="mt-4 rounded-lg bg-gray-900 px-4 py-3 font-mono text-xs text-gray-100">
          <span className="text-green-400">POST</span> /api/workflows/{workflowId}/runs
        </div>
      </div>
    </div>
  );
}
