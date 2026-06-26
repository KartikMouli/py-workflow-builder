"use client";

import { Pencil, Workflow as WorkflowIcon } from "lucide-react";
import Link from "next/link";
import type { AppEdge, AppNode } from "@/components/canvas/types";

export function WorkflowTab({
  workflowId,
  graph,
}: {
  workflowId: string;
  graph: { nodes: AppNode[]; edges: AppEdge[] };
}) {
  return (
    <div className="mx-auto max-w-6xl px-8 py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {graph.nodes.length} node{graph.nodes.length === 1 ? "" : "s"} ·{" "}
          {graph.edges.length} connection{graph.edges.length === 1 ? "" : "s"}
        </p>
        <Link
          href={`/workflow/${workflowId}/edit`}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          <Pencil className="h-4 w-4" />
          Edit Workflow
        </Link>
      </div>

      <div className="mt-4 flex min-h-96 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <WorkflowIcon className="h-6 w-6 text-gray-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">Open the canvas to edit this workflow</p>
        <p className="mt-1 text-xs text-gray-400">Add nodes, connect inputs, and configure each step.</p>
      </div>
    </div>
  );
}
